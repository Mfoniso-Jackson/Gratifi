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

export interface OperatorWalletStatus {
  configured: boolean;
  address: string | null;
  balance: string | null;
  threshold: string;
  low: boolean;
}

/** A wallet is low when its balance (in wei) is below the threshold, given in whole tokens (for example "1"). */
export function isBalanceLow(balanceWei: bigint, threshold: string) {
  return balanceWei < ethers.parseEther(threshold);
}

export class MoonbeamService {
  /**
   * Balance of the operator wallet that pays gas for anchoring. When it runs dry, recognitions stay
   * in pending/retry. MOONBEAM_LOW_BALANCE sets the warning threshold in GLMR (default 1).
   */
  async operatorWalletStatus(getBalance?: (address: string) => Promise<bigint>): Promise<OperatorWalletStatus> {
    const threshold = process.env.MOONBEAM_LOW_BALANCE || "1";
    const { rpcUrl, chainId, operatorPrivateKey } = appConfig.moonbeam;
    if (!rpcUrl || !operatorPrivateKey) {
      return { configured: false, address: null, balance: null, threshold, low: false };
    }

    const address = new ethers.Wallet(operatorPrivateKey).address;
    const balanceWei = getBalance
      ? await getBalance(address)
      : await new ethers.JsonRpcProvider(rpcUrl, chainId).getBalance(address);
    return {
      configured: true,
      address,
      balance: ethers.formatEther(balanceWei),
      threshold,
      low: isBalanceLow(balanceWei, threshold)
    };
  }

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
