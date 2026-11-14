import { ethers } from "ethers";

/**
 * Merkle tree for hourly batches, matching OpenZeppelin's MerkleProof (used by the contract's
 * verifyInBatch):
 * - each leaf is keccak256(recognitionHash), so a leaf (32 bytes hashed) can never be mistaken for
 *   an inner node (64 bytes hashed);
 * - each pair is hashed in sorted order, so a proof is just the list of sibling hashes.
 */
export function leafFor(recognitionHash: string) {
  return ethers.keccak256(ethers.getBytes(recognitionHash));
}

function hashPair(a: string, b: string) {
  const [x, y] = BigInt(a) < BigInt(b) ? [a, b] : [b, a];
  return ethers.keccak256(ethers.concat([x, y]));
}

export interface MerkleBatch {
  root: string;
  /** Proof for each input hash, in the same order as the input. */
  proofs: string[][];
}

/** Builds the tree. Hashes must be unique 0x-prefixed bytes32 values. */
export function buildMerkleBatch(recognitionHashes: string[]): MerkleBatch {
  if (recognitionHashes.length === 0) throw new Error("A batch needs at least one tip.");
  const leaves = recognitionHashes.map(leafFor);
  const proofs: string[][] = leaves.map(() => []);
  // positions[i] = index of input i's node in the current level.
  let positions = leaves.map((_, i) => i);
  let level = leaves;
  while (level.length > 1) {
    const next: string[] = [];
    for (let i = 0; i < level.length; i += 2) {
      // An odd node out moves up unchanged.
      next.push(i + 1 < level.length ? hashPair(level[i], level[i + 1]) : level[i]);
    }
    positions = positions.map((pos, input) => {
      const sibling = pos % 2 === 0 ? pos + 1 : pos - 1;
      if (sibling < level.length) proofs[input].push(level[sibling]);
      return Math.floor(pos / 2);
    });
    level = next;
  }
  return { root: level[0], proofs };
}

/** Checks a tip against a root with its proof (same result as the contract's verifyInBatch). */
export function verifyMerkleProof(recognitionHash: string, proof: string[], root: string) {
  const computed = proof.reduce((node, sibling) => hashPair(node, sibling), leafFor(recognitionHash));
  return computed.toLowerCase() === root.toLowerCase();
}
