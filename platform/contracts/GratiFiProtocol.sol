// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {MerkleProof} from "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

contract GratiFiProtocol is Ownable {
    struct RecognitionRecord {
        bytes32 recognitionHash;
        bytes32 venueHash;
        bytes32 workerHash;
        bytes32 messageHash;
        uint256 amountPence;
        uint256 timestamp;
    }

    /// One Merkle root covering every tip recorded in a batch (normally one an hour).
    struct BatchRecord {
        bytes32 merkleRoot;
        uint256 leafCount;
        uint256 timestamp;
    }

    mapping(bytes32 => RecognitionRecord) private records;
    bytes32[] private recognitionHashes;

    mapping(bytes32 => BatchRecord) private batches;
    uint256 private batchCount;

    event RecognitionRecorded(
        bytes32 indexed recognitionHash,
        bytes32 indexed venueHash,
        bytes32 indexed workerHash,
        bytes32 messageHash,
        uint256 amountPence,
        uint256 timestamp
    );

    event BatchRecorded(bytes32 indexed merkleRoot, uint256 leafCount, uint256 timestamp);

    error RecognitionAlreadyRecorded(bytes32 recognitionHash);
    error BatchAlreadyRecorded(bytes32 merkleRoot);
    error EmptyBatch();
    error InvalidRecognitionHash();
    error InvalidAmount();

    constructor(address initialOwner) Ownable(initialOwner) {}

    function recordRecognition(
        bytes32 recognitionHash,
        bytes32 venueHash,
        bytes32 workerHash,
        bytes32 messageHash,
        uint256 amountPence
    ) external onlyOwner {
        if (recognitionHash == bytes32(0)) revert InvalidRecognitionHash();
        if (amountPence == 0) revert InvalidAmount();
        if (records[recognitionHash].timestamp != 0) revert RecognitionAlreadyRecorded(recognitionHash);

        RecognitionRecord memory record = RecognitionRecord({
            recognitionHash: recognitionHash,
            venueHash: venueHash,
            workerHash: workerHash,
            messageHash: messageHash,
            amountPence: amountPence,
            timestamp: block.timestamp
        });

        records[recognitionHash] = record;
        recognitionHashes.push(recognitionHash);

        emit RecognitionRecorded(recognitionHash, venueHash, workerHash, messageHash, amountPence, block.timestamp);
    }

    function isRecognitionRecorded(bytes32 recognitionHash) external view returns (bool) {
        return records[recognitionHash].timestamp != 0;
    }

    function getRecognitionCount() external view returns (uint256) {
        return recognitionHashes.length;
    }

    function getRecognition(bytes32 recognitionHash) external view returns (RecognitionRecord memory) {
        return records[recognitionHash];
    }

    /// Records the Merkle root of a batch of tips. Each leaf is keccak256(recognitionHash), and pairs
    /// are hashed in sorted order (OpenZeppelin MerkleProof), so anyone can check a tip with its proof.
    function recordBatch(bytes32 merkleRoot, uint256 leafCount) external onlyOwner {
        if (merkleRoot == bytes32(0)) revert InvalidRecognitionHash();
        if (leafCount == 0) revert EmptyBatch();
        if (batches[merkleRoot].timestamp != 0) revert BatchAlreadyRecorded(merkleRoot);

        batches[merkleRoot] = BatchRecord({merkleRoot: merkleRoot, leafCount: leafCount, timestamp: block.timestamp});
        batchCount += 1;

        emit BatchRecorded(merkleRoot, leafCount, block.timestamp);
    }

    function isBatchRecorded(bytes32 merkleRoot) external view returns (bool) {
        return batches[merkleRoot].timestamp != 0;
    }

    function getBatch(bytes32 merkleRoot) external view returns (BatchRecord memory) {
        return batches[merkleRoot];
    }

    function getBatchCount() external view returns (uint256) {
        return batchCount;
    }

    /// True when the tip is in a recorded batch: its proof leads to a root stored on this contract.
    function verifyInBatch(bytes32 recognitionHash, bytes32 merkleRoot, bytes32[] calldata proof) external view returns (bool) {
        if (batches[merkleRoot].timestamp == 0) return false;
        bytes32 leaf = keccak256(abi.encodePacked(recognitionHash));
        return MerkleProof.verifyCalldata(proof, merkleRoot, leaf);
    }
}
