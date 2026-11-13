import { appConfig } from "@/lib/config";
import { chainInfo } from "@/lib/chains";

/** Block explorer for a network; defaults to the one new records are written to. */
export function explorerBase(chainId: number | null | undefined = appConfig.chain.chainId) {
  return chainInfo(chainId)?.explorer ?? null;
}

export function networkName(chainId: number | null | undefined = appConfig.chain.chainId) {
  return chainInfo(chainId)?.name ?? `Chain ${chainId}`;
}

/** Link to a record's transaction. Pass the record's own chain so older Moonbeam records link correctly. */
export function txUrl(hash: string | null | undefined, chainId?: number | null) {
  const base = explorerBase(chainId ?? undefined);
  return base && hash ? `${base}/tx/${hash}` : null;
}

export function addressUrl(address: string | null | undefined, chainId?: number | null) {
  const base = explorerBase(chainId ?? undefined);
  return base && address ? `${base}/address/${address}` : null;
}
