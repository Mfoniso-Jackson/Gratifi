/**
 * Networks GratiFi records tips on, or has recorded them on in the past.
 *
 * New records go to Base (Coinbase's Ethereum layer 2). Moonbeam shut down in mid-2026, so the
 * Moonbeam entries are kept only so older records still show where they were written.
 */
export interface ChainInfo {
  id: number;
  name: string;
  explorer: string | null;
  /** Native token used to pay for records. */
  gasToken: string;
  testnet: boolean;
  /** No longer running: old records stay readable, new ones cannot be written. */
  retired?: boolean;
  defaultRpcUrl?: string;
}

export const BASE_MAINNET = 8453;
export const BASE_SEPOLIA = 84532;

export const chains: Record<number, ChainInfo> = {
  [BASE_MAINNET]: { id: BASE_MAINNET, name: "Base", explorer: "https://basescan.org", gasToken: "ETH", testnet: false, defaultRpcUrl: "https://mainnet.base.org" },
  [BASE_SEPOLIA]: { id: BASE_SEPOLIA, name: "Base Sepolia (test network)", explorer: "https://sepolia.basescan.org", gasToken: "ETH", testnet: true, defaultRpcUrl: "https://sepolia.base.org" },
  1284: { id: 1284, name: "Moonbeam (retired)", explorer: "https://moonbeam.moonscan.io", gasToken: "GLMR", testnet: false, retired: true },
  1287: { id: 1287, name: "Moonbase Alpha (retired)", explorer: "https://moonbase.moonscan.io", gasToken: "DEV", testnet: true, retired: true }
};

export function chainInfo(chainId: number | null | undefined): ChainInfo | null {
  return chainId == null ? null : chains[chainId] ?? null;
}
