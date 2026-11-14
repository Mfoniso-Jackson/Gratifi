import { describe, expect, it } from "vitest";
import { ethers } from "ethers";
import { buildMerkleBatch, leafFor, verifyMerkleProof } from "@/lib/anchoring/merkle";

const hash = (s: string) => ethers.keccak256(ethers.toUtf8Bytes(s));

describe("batch Merkle tree", () => {
  it("gives every tip a proof that leads to the root, for any batch size", () => {
    for (const size of [1, 2, 3, 4, 5, 7, 8, 13, 100]) {
      const hashes = Array.from({ length: size }, (_, i) => hash(`tip-${size}-${i}`));
      const batch = buildMerkleBatch(hashes);
      hashes.forEach((h, i) => expect(verifyMerkleProof(h, batch.proofs[i], batch.root)).toBe(true));
    }
  });

  it("uses the hashed tip as the root of a one-tip batch", () => {
    const h = hash("solo");
    expect(buildMerkleBatch([h])).toEqual({ root: leafFor(h), proofs: [[]] });
  });

  it("rejects a tip that isn't in the batch, or a changed proof", () => {
    const hashes = ["a", "b", "c"].map(hash);
    const batch = buildMerkleBatch(hashes);
    expect(verifyMerkleProof(hash("z"), batch.proofs[0], batch.root)).toBe(false);
    expect(verifyMerkleProof(hashes[0], batch.proofs[1], batch.root)).toBe(false);
    expect(() => buildMerkleBatch([])).toThrow();
  });
});
