export const protocolVersion = "gratifi-v1";

export const appConfig = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  minTipAmountPence: Number(process.env.MIN_TIP_AMOUNT_PENCE ?? 100),
  maxTipAmountPence: Number(process.env.MAX_TIP_AMOUNT_PENCE ?? 50000),
  moonbeam: {
    rpcUrl: process.env.MOONBEAM_RPC_URL ?? "",
    chainId: Number(process.env.MOONBEAM_CHAIN_ID ?? 1284),
    operatorPrivateKey: process.env.MOONBEAM_OPERATOR_PRIVATE_KEY ?? "",
    contractAddress: process.env.GRATIFI_PROTOCOL_CONTRACT_ADDRESS ?? ""
  }
};
