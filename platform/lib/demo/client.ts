import { randomUUID } from "node:crypto";
import { buildDemoData } from "./fixtures";
import { redisConfig, redisPipeline, type RedisOptions } from "@/lib/services/redis";

type Row = Record<string, any>;
type Result = { data: any; error: { message: string } | null; count?: number };

type DemoData = Record<string, Row[]>;

/**
 * A minimal stand-in for the subset of the Supabase query builder this app uses: select (with one
 * level of embedded relations), insert, update, upsert, eq, order, limit, single and maybeSingle.
 *
 * Where the data lives:
 * - With Upstash Redis configured (UPSTASH_REDIS_REST_URL/TOKEN), the whole demo dataset is one
 *   Redis key, so every serverless instance (for example on a Vercel preview) sees the same tips and
 *   dream progress. It resets to the sample data after 7 days without changes.
 * - Otherwise it lives in this process's memory and resets when the server restarts.
 */
// Bump the version when the sample data changes, so hosted previews reseed.
export const DEMO_DATA_KEY = "gratifi:demo:data:v4";
const DEMO_TTL_SECONDS = 7 * 24 * 60 * 60;

const globalStore = globalThis as unknown as { __gratifiDemoData?: DemoData };

function memoryData() {
  globalStore.__gratifiDemoData ??= buildDemoData();
  return globalStore.__gratifiDemoData;
}

async function loadDemoData(options: RedisOptions): Promise<DemoData> {
  if (!redisConfig(options.env ?? process.env)) return memoryData();
  try {
    const [raw] = await redisPipeline([["GET", DEMO_DATA_KEY]], options);
    if (typeof raw === "string") return JSON.parse(raw) as DemoData;
    const fresh = buildDemoData();
    // NX: if another instance seeded the data first, keep theirs.
    await redisPipeline([["SET", DEMO_DATA_KEY, JSON.stringify(fresh), "EX", DEMO_TTL_SECONDS, "NX"]], options);
    return fresh;
  } catch (error) {
    console.error("Shared demo data unavailable, using this instance's memory:", error);
    return memoryData();
  }
}

async function saveDemoData(data: DemoData, options: RedisOptions) {
  if (!redisConfig(options.env ?? process.env)) return;
  try {
    await redisPipeline([["SET", DEMO_DATA_KEY, JSON.stringify(data), "EX", DEMO_TTL_SECONDS]], options);
  } catch (error) {
    console.error("Could not save shared demo data:", error);
  }
}

function table(data: DemoData, name: string) {
  data[name] ??= [];
  return data[name];
}

// "venues(name)" on a row embeds the venue referenced by `venue_id`.
function embedRelations(data: DemoData, row: Row, columns: string) {
  const out = { ...row };
  for (const match of columns.matchAll(/(\w+)\(([^)]*)\)/g)) {
    const relation = match[1];
    const foreignKey = `${relation.replace(/s$/, "")}_id`;
    const related = table(data, relation).find((r) => r.id === row[foreignKey]);
    out[relation] = related ? { ...related } : null;
  }
  return out;
}

class DemoQuery implements PromiseLike<Result> {
  private filters: Array<(row: Row) => boolean> = [];
  private orders: Array<[string, boolean]> = [];
  private limitCount: number | null = null;
  private mode: "many" | "single" | "maybeSingle" = "many";
  private columns = "*";
  private op: "select" | "insert" | "update" | "upsert" = "select";
  private payload: Row | Row[] | null = null;
  private upsertOptions: { onConflict?: string; ignoreDuplicates?: boolean } = {};

  constructor(
    private readonly tableName: string,
    private readonly options: RedisOptions = {}
  ) {}

  select(columns = "*") {
    this.columns = columns;
    return this;
  }

  insert(payload: Row | Row[]) {
    this.op = "insert";
    this.payload = payload;
    return this;
  }

  update(payload: Row) {
    this.op = "update";
    this.payload = payload;
    return this;
  }

  upsert(payload: Row | Row[], options: { onConflict?: string; ignoreDuplicates?: boolean } = {}) {
    this.op = "upsert";
    this.payload = payload;
    this.upsertOptions = options;
    return this;
  }

  eq(column: string, value: unknown) {
    this.filters.push((row) => row[column] === value);
    return this;
  }

  in(column: string, values: unknown[]) {
    this.filters.push((row) => values.includes(row[column]));
    return this;
  }

  order(column: string, options: { ascending?: boolean } = {}) {
    this.orders.push([column, options.ascending !== false]);
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  single() {
    this.mode = "single";
    return this;
  }

  maybeSingle() {
    this.mode = "maybeSingle";
    return this;
  }

  then<T1 = Result, T2 = never>(
    onfulfilled?: ((value: Result) => T1 | PromiseLike<T1>) | null,
    onrejected?: ((reason: unknown) => T2 | PromiseLike<T2>) | null
  ): PromiseLike<T1 | T2> {
    return this.run().then(onfulfilled, onrejected);
  }

  private async run(): Promise<Result> {
    const data = await loadDemoData(this.options);
    const result = this.execute(data);
    if (this.op !== "select") await saveDemoData(data, this.options);
    return result;
  }

  private matches(row: Row) {
    return this.filters.every((filter) => filter(row));
  }

  private execute(data: DemoData): Result {
    const rows = table(data, this.tableName);
    let affected: Row[];

    if (this.op === "insert") {
      affected = this.asArray().map((input) => this.withDefaults(input));
      rows.push(...affected);
    } else if (this.op === "update") {
      affected = rows.filter((row) => this.matches(row));
      for (const row of affected) Object.assign(row, this.payload);
    } else if (this.op === "upsert") {
      const keys = (this.upsertOptions.onConflict ?? "id").split(",").map((k) => k.trim());
      affected = [];
      for (const input of this.asArray()) {
        const existing = rows.find((row) => keys.every((key) => input[key] !== undefined && row[key] === input[key]));
        if (existing) {
          if (!this.upsertOptions.ignoreDuplicates) Object.assign(existing, input);
          affected.push(existing);
        } else {
          const created = this.withDefaults(input);
          rows.push(created);
          affected.push(created);
        }
      }
    } else {
      affected = rows.filter((row) => this.matches(row));
    }

    let result = affected.map((row) => embedRelations(data, row, this.columns));

    if (this.orders.length > 0) {
      result = [...result].sort((a, b) => {
        for (const [column, ascending] of this.orders) {
          const x = a[column];
          const y = b[column];
          if (x === y) continue;
          if (x === null || x === undefined) return 1;
          if (y === null || y === undefined) return -1;
          return (x < y ? -1 : 1) * (ascending ? 1 : -1);
        }
        return 0;
      });
    }
    if (this.limitCount !== null) result = result.slice(0, this.limitCount);

    if (this.mode === "many") return { data: result, error: null, count: result.length };
    if (result.length === 0) {
      return this.mode === "maybeSingle"
        ? { data: null, error: null }
        : { data: null, error: { message: `No ${this.tableName} row found` } };
    }
    return { data: result[0], error: null };
  }

  private asArray() {
    return Array.isArray(this.payload) ? this.payload : this.payload ? [this.payload] : [];
  }

  private withDefaults(input: Row): Row {
    const now = new Date().toISOString();
    return { id: randomUUID(), created_at: now, ...input };
  }
}

export function createDemoClient(options: RedisOptions = {}) {
  return {
    from: (tableName: string) => new DemoQuery(tableName, options),
    auth: {
      getUser: async () => ({ data: { user: { id: "demo-admin", email: "demo@gratifi.local" } }, error: null })
    }
  };
}
