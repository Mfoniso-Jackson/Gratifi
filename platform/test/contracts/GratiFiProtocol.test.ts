import { expect } from "chai";
import hre from "hardhat";

const { ethers } = hre;

describe("GratiFiProtocol", function () {
  async function deploy() {
    const [owner, other] = await ethers.getSigners();
    const factory = await ethers.getContractFactory("GratiFiProtocol");
    const contract = (await factory.deploy(owner.address)) as any;
    return { contract, owner, other };
  }

  it("records immutable recognition events", async function () {
    const { contract } = await deploy();
    const recognitionHash = ethers.keccak256(ethers.toUtf8Bytes("recognition"));
    const venueHash = ethers.keccak256(ethers.toUtf8Bytes("venue"));
    const workerHash = ethers.keccak256(ethers.toUtf8Bytes("worker"));
    const messageHash = ethers.keccak256(ethers.toUtf8Bytes("thanks"));

    await expect(contract.recordRecognition(recognitionHash, venueHash, workerHash, messageHash, 500)).to.emit(
      contract,
      "RecognitionRecorded"
    );

    expect(await contract.isRecognitionRecorded(recognitionHash)).to.equal(true);
    expect(await contract.getRecognitionCount()).to.equal(1);
  });

  it("prevents duplicates and non-owner writes", async function () {
    const { contract, other } = await deploy();
    const hash = ethers.keccak256(ethers.toUtf8Bytes("unique"));
    const entity = ethers.keccak256(ethers.toUtf8Bytes("entity"));

    await contract.recordRecognition(hash, entity, entity, entity, 100);
    await expect(contract.recordRecognition(hash, entity, entity, entity, 100)).to.be.revertedWithCustomError(
      contract,
      "RecognitionAlreadyRecorded"
    );
    await expect(contract.connect(other).recordRecognition(hash, entity, entity, entity, 100)).to.be.revertedWithCustomError(
      contract,
      "OwnableUnauthorizedAccount"
    ).withArgs(other.address);
  });
});

describe("GratiFiProtocol batches", function () {
  async function deploy() {
    const [owner, other] = await ethers.getSigners();
    const factory = await ethers.getContractFactory("GratiFiProtocol");
    const contract = (await factory.deploy(owner.address)) as any;
    return { contract, owner, other };
  }

  it("records a batch root and verifies each tip with the off-chain proofs", async function () {
    const { buildMerkleBatch } = await import("../../lib/anchoring/merkle");
    const { contract } = await deploy();
    const hashes = ["a", "b", "c", "d", "e"].map((s) => ethers.keccak256(ethers.toUtf8Bytes(`tip-${s}`)));
    const batch = buildMerkleBatch(hashes);

    await expect(contract.recordBatch(batch.root, hashes.length)).to.emit(contract, "BatchRecorded");
    expect(await contract.isBatchRecorded(batch.root)).to.equal(true);
    expect(await contract.getBatchCount()).to.equal(1);
    for (let i = 0; i < hashes.length; i += 1) {
      expect(await contract.verifyInBatch(hashes[i], batch.root, batch.proofs[i])).to.equal(true);
    }
    const stranger = ethers.keccak256(ethers.toUtf8Bytes("not-in-batch"));
    expect(await contract.verifyInBatch(stranger, batch.root, batch.proofs[0])).to.equal(false);
  });

  it("refuses duplicate or empty batches and non-owner writes", async function () {
    const { contract, other } = await deploy();
    const root = ethers.keccak256(ethers.toUtf8Bytes("root"));
    await contract.recordBatch(root, 3);
    await expect(contract.recordBatch(root, 3)).to.be.revertedWithCustomError(contract, "BatchAlreadyRecorded");
    await expect(contract.recordBatch(ethers.keccak256(ethers.toUtf8Bytes("other")), 0)).to.be.revertedWithCustomError(contract, "EmptyBatch");
    await expect(contract.connect(other).recordBatch(ethers.keccak256(ethers.toUtf8Bytes("x")), 1)).to.be.revertedWithCustomError(
      contract,
      "OwnableUnauthorizedAccount"
    );
  });
});
