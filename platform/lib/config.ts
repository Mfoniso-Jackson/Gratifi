import { BASE_MAINNET, chains } from "@/lib/chains";

export const protocolVersion = "gratifi-v1";

const chainId = Number(process.env.CHAIN_ID ?? BASE_MAINNET);

export const appConfig = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  minTipAmountPence: Number(process.env.MIN_TIP_AMOUNT_PENCE ?? 200),
  maxTipAmountPence: Number(process.env.MAX_TIP_AMOUNT_PENCE ?? 50000),
  /** The network new tip records are written to (Base by default). */
  chain: {
    chainId,
    rpcUrl: process.env.CHAIN_RPC_URL || chains[chainId]?.defaultRpcUrl || "",
    operatorPrivateKey: process.env.CHAIN_OPERATOR_PRIVATE_KEY ?? "",
    contractAddress: process.env.GRATIFI_PROTOCOL_CONTRACT_ADDRESS ?? ""
  }
};
