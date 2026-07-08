import { ethers } from "ethers";
import { appConfig } from "@/lib/config";

const abi = [
  "function recordRecognition(bytes32 recognitionHash, bytes32 venueHash, bytes32 workerHash, bytes32 messageHash, uint256 amountPence)",
  "function isRecognitionRecorded(bytes32 recognitionHash) view returns (bool)",
  "function getRecognitionCount() view returns (uint256)"
];

export interface MoonbeamRecordInput {
  recognitionHash: string;
  venueHash: string;
  workerHash: string;
  messageHash: string;
  amountPence: number;
}

export class MoonbeamService {
  async recordRecognition(input: MoonbeamRecordInput) {
    if (!appConfig.moonbeam.rpcUrl || !appConfig.moonbeam.operatorPrivateKey || !appConfig.moonbeam.contractAddress) {
      throw new Error("Moonbeam is not configured.");
    }

    const provider = new ethers.JsonRpcProvider(appConfig.moonbeam.rpcUrl, appConfig.moonbeam.chainId);
    const wallet = new ethers.Wallet(appConfig.moonbeam.operatorPrivateKey, provider);
    const contract = new ethers.Contract(appConfig.moonbeam.contractAddress, abi, wallet);

    const alreadyRecorded = await contract.isRecognitionRecorded(input.recognitionHash);
    if (alreadyRecorded) {
      return { txHash: null, blockNumber: null, alreadyRecorded: true };
    }

    const tx = await contract.recordRecognition(
      input.recognitionHash,
      input.venueHash,
      input.workerHash,
      input.messageHash,
      input.amountPence
    );
    const receipt = await tx.wait();

    return { txHash: receipt.hash as string, blockNumber: Number(receipt.blockNumber), alreadyRecorded: false };
  }

  async status() {
    if (!appConfig.moonbeam.contractAddress) {
      return { configured: false, contractAddress: null, recognitionCount: null };
    }

    const provider = new ethers.JsonRpcProvider(appConfig.moonbeam.rpcUrl, appConfig.moonbeam.chainId);
    const contract = new ethers.Contract(appConfig.moonbeam.contractAddress, abi, provider);
    const recognitionCount = await contract.getRecognitionCount();
    return {
      configured: true,
      contractAddress: appConfig.moonbeam.contractAddress,
      recognitionCount: recognitionCount.toString()
    };
  }
}
