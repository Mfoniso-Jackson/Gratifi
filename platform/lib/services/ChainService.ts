import { ethers } from "ethers";
import { appConfig } from "@/lib/config";
import { chainInfo } from "@/lib/chains";

const abi = [
  "function recordRecognition(bytes32 recognitionHash, bytes32 venueHash, bytes32 workerHash, bytes32 messageHash, uint256 amountPence)",
  "function isRecognitionRecorded(bytes32 recognitionHash) view returns (bool)",
  "function getRecognitionCount() view returns (uint256)"
];

export interface AnchorRecordInput {
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

/** Default warning level for the operator wallet: 0.002 ETH pays for thousands of records on Base. */
export const DEFAULT_LOW_BALANCE = "0.002";

/**
 * Writes each tip's fingerprint to the GratiFiProtocol contract on an EVM network: Base by default
 * (CHAIN_ID 8453, or 84532 for the Base Sepolia test network). Only hashes go on-chain, never names,
 * messages or amounts in pounds that could identify a person on their own.
 */
export class ChainService {
  /**
   * Balance of the operator wallet that pays gas for anchoring. When it runs dry, recognitions stay
   * in pending/retry. CHAIN_LOW_BALANCE sets the warning threshold in ETH (default 0.002).
   */
  async operatorWalletStatus(getBalance?: (address: string) => Promise<bigint>): Promise<OperatorWalletStatus> {
    const threshold = process.env.CHAIN_LOW_BALANCE || DEFAULT_LOW_BALANCE;
    const { rpcUrl, chainId, operatorPrivateKey } = appConfig.chain;
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

  async recordRecognition(input: AnchorRecordInput) {
    if (!appConfig.chain.rpcUrl || !appConfig.chain.operatorPrivateKey || !appConfig.chain.contractAddress) {
      throw new Error("The blockchain record is not configured.");
    }
    if (chainInfo(appConfig.chain.chainId)?.retired) {
      throw new Error(`${chainInfo(appConfig.chain.chainId)?.name} no longer accepts records. Set CHAIN_ID to Base (8453).`);
    }

    const provider = new ethers.JsonRpcProvider(appConfig.chain.rpcUrl, appConfig.chain.chainId);
    const wallet = new ethers.Wallet(appConfig.chain.operatorPrivateKey, provider);
    const contract = new ethers.Contract(appConfig.chain.contractAddress, abi, wallet);

    const alreadyRecorded = await contract.isRecognitionRecorded(input.recognitionHash);
    if (alreadyRecorded) {
      return { txHash: null, blockNumber: null, chainId: appConfig.chain.chainId, alreadyRecorded: true };
    }

    const tx = await contract.recordRecognition(
      input.recognitionHash,
      input.venueHash,
      input.workerHash,
      input.messageHash,
      input.amountPence
    );
    const receipt = await tx.wait();

    return { txHash: receipt.hash as string, blockNumber: Number(receipt.blockNumber), chainId: appConfig.chain.chainId, alreadyRecorded: false };
  }

  async status() {
    if (!appConfig.chain.contractAddress) {
      return { configured: false, contractAddress: null, recognitionCount: null, retired: false };
    }

    const provider = new ethers.JsonRpcProvider(appConfig.chain.rpcUrl, appConfig.chain.chainId);
    const contract = new ethers.Contract(appConfig.chain.contractAddress, abi, provider);
    const recognitionCount = await contract.getRecognitionCount();
    return {
      configured: true,
      contractAddress: appConfig.chain.contractAddress,
      recognitionCount: recognitionCount.toString(),
      retired: Boolean(chainInfo(appConfig.chain.chainId)?.retired)
    };
  }
}
