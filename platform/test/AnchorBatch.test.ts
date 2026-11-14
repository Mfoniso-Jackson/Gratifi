import { beforeEach, describe, expect, it, vi } from "vitest";
import { createDemoClient } from "@/lib/demo/client";
import { AnchorBatchService, type BatchChain } from "@/lib/anchoring/AnchorBatchService";
import { verifyMerkleProof } from "@/lib/anchoring/merkle";
import { detachedOtsFile, otsDigest, pendingTimestamp, stampRoot } from "@/lib/anchoring/opentimestamps";

function freshDemoData() {
  delete (globalThis as { __gratifiDemoData?: unknown }).__gratifiDemoData;
}

function chain(overrides: Partial<BatchChain> = {}): BatchChain {
  return {
    isConfigured: () => true,
    recordBatch: vi.fn(async () => ({ txHash: "0xbatchtx", blockNumber: 123, chainId: 84532 })),
    ...overrides
  };
}

const proof = [{ calendar: "https://cal.test", proof: "AAAA" }];

describe("hourly batches", () => {
  beforeEach(freshDemoData);

  it("records every waiting tip under one root and gives each a working proof", async () => {
    const db = createDemoClient({ env: {} });
    const waitingBefore = ((await db.from("recognition_events").select("*")).data as any[]).filter((e) => e.anchor_status !== "confirmed");
    expect(waitingBefore.length).toBeGreaterThan(0);

    const fakeChain = chain();
    const outcome = await new AnchorBatchService(db, fakeChain, async () => proof).run();
    expect(outcome).toMatchObject({ action: "recorded", tips: waitingBefore.length, bitcoinBackup: 1 });
    expect(fakeChain.recordBatch).toHaveBeenCalledTimes(1);

    const batch = (await db.from("anchor_batches").select("*").eq("id", (outcome as any).batchId).single()).data;
    expect(batch).toMatchObject({ status: "confirmed", tx_hash: "0xbatchtx", ots_status: "submitted", leaf_count: waitingBefore.length });
    for (const before of waitingBefore) {
      const tip = (await db.from("recognition_events").select("*").eq("id", before.id).single()).data;
      expect(tip).toMatchObject({ anchor_status: "confirmed", anchor_tx_hash: "0xbatchtx", anchor_batch_id: batch.id, anchor_chain_id: 84532 });
      expect(verifyMerkleProof(tip.recognition_hash, tip.merkle_proof, batch.merkle_root)).toBe(true);
    }

    // Nothing left to record on the next run.
    expect(await new AnchorBatchService(db, chain(), async () => proof).run()).toMatchObject({ action: "skipped" });
  });

  it("puts tips back to retry when the Base write fails", async () => {
    const db = createDemoClient({ env: {} });
    const failing = chain({ recordBatch: vi.fn(async () => { throw new Error("RPC down"); }) });
    const outcome = await new AnchorBatchService(db, failing, async () => proof).run();
    expect(outcome).toMatchObject({ action: "failed", error: "RPC down" });
    const tips = ((await db.from("recognition_events").select("*")).data as any[]).filter((e) => e.anchor_status !== "confirmed");
    expect(tips.every((t) => t.anchor_status === "retry" && t.anchor_batch_id === null)).toBe(true);
  });

  it("keeps the Base record when the Bitcoin calendars are down, and tries again next run", async () => {
    const db = createDemoClient({ env: {} });
    const outcome = await new AnchorBatchService(db, chain(), async () => []).run();
    expect(outcome).toMatchObject({ action: "recorded", bitcoinBackup: 0 });
    const id = (outcome as any).batchId;
    expect((await db.from("anchor_batches").select("*").eq("id", id).single()).data.ots_status).toBe("failed");

    await new AnchorBatchService(db, chain(), async () => proof).run();
    expect((await db.from("anchor_batches").select("*").eq("id", id).single()).data.ots_status).toBe("submitted");
  });

  it("does nothing until the chain is configured", async () => {
    const outcome = await new AnchorBatchService(createDemoClient({ env: {} }), chain({ isConfigured: () => false })).run();
    expect(outcome).toMatchObject({ action: "skipped" });
  });
});

describe("OpenTimestamps", () => {
  it("sends the root's SHA-256 to each calendar and saves a detached .ots file per reply", async () => {
    const root = "0x" + "ab".repeat(32);
    const reply = pendingTimestamp("https://cal-a.test");
    const fetchImpl = vi.fn(async (url: string) =>
      url.startsWith("https://cal-a.test") ? new Response(new Blob([Buffer.from(reply)])) : new Response("busy", { status: 503 })
    ) as unknown as typeof fetch;
    const proofs = await stampRoot(root, { fetchImpl, calendarUrls: ["https://cal-a.test", "https://cal-b.test"] });
    expect(proofs).toHaveLength(1);
    const file = Buffer.from(proofs[0].proof, "base64");
    expect(file.subarray(0, 31).toString("latin1")).toContain("OpenTimestamps");
    expect(file.equals(Buffer.from(detachedOtsFile(otsDigest(root), reply)))).toBe(true);
    // Header (31 bytes), version, SHA-256 op tag, then the digest.
    expect(file.subarray(31, 33)).toEqual(Buffer.from([0x01, 0x08]));
    expect(file.subarray(33, 65)).toEqual(Buffer.from(otsDigest(root)));
  });

  it("never throws when every calendar is unreachable", async () => {
    const fetchImpl = vi.fn(async () => { throw new Error("offline"); }) as unknown as typeof fetch;
    await expect(stampRoot("0x" + "cd".repeat(32), { fetchImpl, calendarUrls: ["https://x.test"] })).resolves.toEqual([]);
  });
});
