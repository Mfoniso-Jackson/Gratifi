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
