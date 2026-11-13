import { appConfig } from "@/lib/config";

/** Block explorer links for the configured Moonbeam network (Moonbeam 1284, Moonbase Alpha 1287). */
export function explorerBase(chainId = appConfig.moonbeam.chainId) {
  if (chainId === 1284) return "https://moonbeam.moonscan.io";
  if (chainId === 1287) return "https://moonbase.moonscan.io";
  return null;
}

export function networkName(chainId = appConfig.moonbeam.chainId) {
  return chainId === 1284 ? "Moonbeam mainnet" : chainId === 1287 ? "Moonbase Alpha (test network)" : `Chain ${chainId}`;
}

export function txUrl(hash: string | null | undefined) {
  const base = explorerBase();
  return base && hash ? `${base}/tx/${hash}` : null;
}

export function addressUrl(address: string | null | undefined) {
  const base = explorerBase();
  return base && address ? `${base}/address/${address}` : null;
}
