import { createHash } from "node:crypto";
import { ethers } from "ethers";

/**
 * A free Bitcoin backup for each hourly batch, using OpenTimestamps (opentimestamps.org).
 *
 * The 32-byte Merkle root is the "file" being timestamped: its SHA-256 digest is sent to public
 * calendar servers, which commit it to Bitcoin within a few hours. Each calendar's reply is saved as
 * a standard detached .ots proof. To check one:
 *
 *   1. download the root (32 bytes) and the .ots file from /api/v1/batches/<id>/...
 *   2. `ots upgrade root.bin.ots` (fetches the finished Bitcoin proof from the calendar)
 *   3. `ots verify root.bin.ots`
 */
export const DEFAULT_CALENDARS = [
  "https://alice.btc.calendar.opentimestamps.org",
  "https://bob.btc.calendar.opentimestamps.org",
  "https://finney.calendar.eternitywall.com"
];

// Detached timestamp file header, format version 1, and the SHA-256 operation tag.
const HEADER_MAGIC = Uint8Array.from([
  0x00, 0x4f, 0x70, 0x65, 0x6e, 0x54, 0x69, 0x6d, 0x65, 0x73, 0x74, 0x61, 0x6d, 0x70, 0x73, 0x00, 0x00, 0x50, 0x72, 0x6f, 0x6f, 0x66,
  0x00, 0xbf, 0x89, 0xe2, 0xe8, 0x84, 0xe8, 0x92, 0x94
]);
const MAJOR_VERSION = 0x01;
const OP_SHA256 = 0x08;
const PENDING_ATTESTATION_TAG = Uint8Array.from([0x83, 0xdf, 0xe3, 0x0d, 0x2e, 0xf9, 0x0c, 0x8e]);

export interface OtsProof {
  calendar: string;
  /** Base64 of the detached .ots file. */
  proof: string;
}

/** The digest sent to calendars: SHA-256 of the 32 root bytes. */
export function otsDigest(merkleRoot: string) {
  return new Uint8Array(createHash("sha256").update(ethers.getBytes(merkleRoot)).digest());
}

/** A complete detached .ots file from a calendar's reply (the reply is the serialized timestamp). */
export function detachedOtsFile(digest: Uint8Array, calendarReply: Uint8Array) {
  return ethers.getBytes(ethers.concat([HEADER_MAGIC, Uint8Array.of(MAJOR_VERSION, OP_SHA256), digest, calendarReply]));
}

function varuint(n: number) {
  const out: number[] = [];
  do {
    let byte = n & 0x7f;
    n >>>= 7;
    if (n) byte |= 0x80;
    out.push(byte);
  } while (n);
  return Uint8Array.from(out);
}

/** The simplest valid timestamp: a pending attestation from one calendar (used for demo data and tests). */
export function pendingTimestamp(calendarUrl: string) {
  const uri = new TextEncoder().encode(calendarUrl);
  const payload = ethers.getBytes(ethers.concat([varuint(uri.length), uri]));
  return ethers.getBytes(ethers.concat([Uint8Array.of(0x00), PENDING_ATTESTATION_TAG, varuint(payload.length), payload]));
}

export function calendars(env: Record<string, string | undefined> = process.env) {
  const list = (env.OTS_CALENDARS ?? "").split(",").map((u) => u.trim()).filter((u) => u.startsWith("https://"));
  return list.length ? list : DEFAULT_CALENDARS;
}

/**
 * Sends the root to each calendar and returns the proofs that came back. Never throws: the Bitcoin
 * backup is extra, so a calendar being down must not affect the Base record.
 */
export async function stampRoot(
  merkleRoot: string,
  options: { fetchImpl?: typeof fetch; calendarUrls?: string[]; timeoutMs?: number } = {}
): Promise<OtsProof[]> {
  const digest = otsDigest(merkleRoot);
  const fetchImpl = options.fetchImpl ?? fetch;
  const results = await Promise.all(
    (options.calendarUrls ?? calendars()).map(async (calendar) => {
      try {
        const response = await fetchImpl(`${calendar}/digest`, {
          method: "POST",
          headers: { Accept: "application/vnd.opentimestamps.v1", "Content-Type": "application/x-www-form-urlencoded", "User-Agent": "gratifi-anchor" },
          body: digest,
          signal: AbortSignal.timeout(options.timeoutMs ?? 10_000)
        });
        if (!response.ok) return null;
        const reply = new Uint8Array(await response.arrayBuffer());
        if (reply.length === 0 || reply.length > 10_000) return null;
        return { calendar, proof: Buffer.from(detachedOtsFile(digest, reply)).toString("base64") };
      } catch {
        return null;
      }
    })
  );
  return results.filter((r): r is OtsProof => r !== null);
}
