import { randomUUID } from "node:crypto";
import { buildDemoData } from "./fixtures";

type Row = Record<string, any>;
type Result = { data: any; error: { message: string } | null; count?: number };

/**
 * A minimal in-memory stand-in for the subset of the Supabase query builder
 * this app uses: select (with one level of embedded relations), insert,
 * update, upsert, eq, order, limit, single and maybeSingle.
 *
 * Data lives in-process and resets when the server restarts.
 */
const globalStore = globalThis as unknown as { __gratifiDemoData?: Record<string, Row[]> };

function store() {
  globalStore.__gratifiDemoData ??= buildDemoData();
  return globalStore.__gratifiDemoData;
}

function table(name: string) {
  const s = store();
  s[name] ??= [];
  return s[name];
}

// "venues(name)" on a row embeds the venue referenced by `venue_id`.
function embedRelations(row: Row, columns: string) {
  const out = { ...row };
  for (const match of columns.matchAll(/(\w+)\(([^)]*)\)/g)) {
    const relation = match[1];
    const foreignKey = `${relation.replace(/s$/, "")}_id`;
    const related = table(relation).find((r) => r.id === row[foreignKey]);
    out[relation] = related ? { ...related } : null;
  }
  return out;
}

class DemoQuery implements PromiseLike<Result> {
  private filters: Array<[string, unknown]> = [];
  private orders: Array<[string, boolean]> = [];
  private limitCount: number | null = null;
  private mode: "many" | "single" | "maybeSingle" = "many";
  private columns = "*";
  private op: "select" | "insert" | "update" | "upsert" = "select";
  private payload: Row | Row[] | null = null;
  private upsertOptions: { onConflict?: string; ignoreDuplicates?: boolean } = {};

  constructor(private readonly tableName: string) {}

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
    this.filters.push([column, value]);
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
    return Promise.resolve()
      .then(() => this.execute())
      .then(onfulfilled, onrejected);
  }

  private matches(row: Row) {
    return this.filters.every(([column, value]) => row[column] === value);
  }

  private execute(): Result {
    const rows = table(this.tableName);
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

    let result = affected.map((row) => embedRelations(row, this.columns));

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

export function createDemoClient() {
  return {
    from: (tableName: string) => new DemoQuery(tableName),
    auth: {
      getUser: async () => ({ data: { user: { id: "demo-admin", email: "demo@gratifi.local" } }, error: null })
    }
  };
}
