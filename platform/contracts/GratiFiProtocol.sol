// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract GratiFiProtocol is Ownable {
    struct RecognitionRecord {
        bytes32 recognitionHash;
        bytes32 venueHash;
        bytes32 workerHash;
        bytes32 messageHash;
        uint256 amountPence;
        uint256 timestamp;
    }

    mapping(bytes32 => RecognitionRecord) private records;
    bytes32[] private recognitionHashes;

    event RecognitionRecorded(
        bytes32 indexed recognitionHash,
        bytes32 indexed venueHash,
        bytes32 indexed workerHash,
        bytes32 messageHash,
        uint256 amountPence,
        uint256 timestamp
    );

    error RecognitionAlreadyRecorded(bytes32 recognitionHash);
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
}
