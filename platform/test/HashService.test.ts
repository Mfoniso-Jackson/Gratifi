import { describe, expect, it, vi } from "vitest";
import { ethers } from "ethers";
import { HashService } from "@/lib/services/HashService";
import { createDemoClient } from "@/lib/demo/client";
import { RecognitionEngine } from "@/lib/services/RecognitionEngine";
import { eraseTipNotes } from "@/lib/services/DataRequestService";

const payload = {
  venueId: "550e8400-e29b-41d4-a716-446655440000",
  workerId: "550e8400-e29b-41d4-a716-446655440001",
  amountPence: 500,
  currency: "GBP" as const,
  message: "Thank you",
  stripePaymentIntentId: "pi_123",
  stripeStatus: "succeeded"
};

describe("HashService", () => {
  const service = new HashService();

  it("gives the same hash for the same tip and salt", () => {
    const salt = service.newSalt();
    expect(service.recognitionHash(payload, salt)).toEqual(service.recognitionHash({ ...payload }, salt));
  });

  it("hashes blank messages consistently", () => {
    const salt = service.newSalt();
    expect(service.messageHash(null, salt)).toEqual(service.messageHash("", salt));
  });

  it("makes short notes impossible to match by guessing without the tip's salt", () => {
    const salt = service.newSalt();
    const onChain = service.messageHash("Thanks!", salt);
    // An attacker tries the plain hash of a common note: no match.
    expect(onChain).not.toEqual(ethers.keccak256(ethers.toUtf8Bytes("Thanks!")));
    // The same note on another tip hashes differently.
    expect(onChain).not.toEqual(service.messageHash("Thanks!", service.newSalt()));
    expect(service.newSalt()).toMatch(/^0x[0-9a-f]{64}$/);
  });

  it("stops a staff member's tips being linked on-chain through their public ID", () => {
    expect(service.entityHash(payload.workerId, service.newSalt())).not.toEqual(service.entityHash(payload.workerId, service.newSalt()));
  });
});

describe("salted recognitions", () => {
  it("stores a salt with each new tip, records each payment once, and erases the salt on request", async () => {
    delete (globalThis as { __gratifiDemoData?: unknown }).__gratifiDemoData;
    const db = createDemoClient({ env: {} });
    const engine = new RecognitionEngine(db, undefined, undefined, "batch");
    const tip = {
      venueId: "de30a001-0000-4000-8000-000000000001",
      workerId: "de30b002-0000-4000-8000-000000000001",
      amountPence: 500,
      currency: "GBP" as const,
      message: "Thanks!",
      stripePaymentIntentId: "pi_salt_test",
      stripeStatus: "paid"
    };
    const first = await engine.createFromPaidIntent(tip);
    // The salt is not on the tip row (which staff and owners can read), only in the server-only table.
    expect(first).not.toHaveProperty("hash_salt");
    const salt = await engine.saltFor(first.id);
    expect(salt).toMatch(/^0x[0-9a-f]{64}$/);
    expect(first.message_hash).toEqual(new HashService().messageHash("Thanks!", salt));
    expect(first.protocol_version).toBe("gratifi-v2");

    // Stripe resends the event: same recognition, not a second one with a new salt.
    const again = await engine.createFromPaidIntent(tip);
    expect(again.id).toBe(first.id);

    await eraseTipNotes(db, [first.id]);
    const erased = (await db.from("recognition_events").select("*").eq("id", first.id).single()).data;
    expect(erased).toMatchObject({ message: null, recognition_hash: first.recognition_hash });
    expect(await engine.saltFor(first.id)).toBeNull();
  });

  it("never anchors raw IDs for a tip whose salt was erased", async () => {
    delete (globalThis as { __gratifiDemoData?: unknown }).__gratifiDemoData;
    const db = createDemoClient({ env: {} });
    const recordRecognition = vi.fn(async () => ({ txHash: "0xtx", blockNumber: 1, chainId: 8453, alreadyRecorded: false }));
    const engine = new RecognitionEngine(db, undefined, { recordRecognition } as any, "single");
    const event = (await db.from("recognition_events").select("*").eq("anchor_status", "retry").limit(1)).data[0];
    await eraseTipNotes(db, [event.id]);
    await engine.anchor(event);
    const sent = (recordRecognition.mock.calls[0] as any[])[0];
    const hashes = new HashService();
    expect(sent.workerHash).not.toEqual(hashes.entityHash(event.worker_id));
    expect(sent.venueHash).not.toEqual(hashes.entityHash(event.venue_id));
  });
});

describe("demo database", () => {
  it("supports delete, which un-blocking a sponsor relies on", async () => {
    delete (globalThis as { __gratifiDemoData?: unknown }).__gratifiDemoData;
    const db = createDemoClient({ env: {} });
    await db.from("venue_sponsor_blocks").insert({ venue_id: "v1", sponsor_id: "s1" });
    await db.from("venue_sponsor_blocks").insert({ venue_id: "v1", sponsor_id: "s2" });
    await db.from("venue_sponsor_blocks").delete().eq("venue_id", "v1").eq("sponsor_id", "s1");
    const left = (await db.from("venue_sponsor_blocks").select("*")).data;
    expect(left.map((r: any) => r.sponsor_id)).toEqual(["s2"]);
  });
});
