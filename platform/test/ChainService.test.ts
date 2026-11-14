import { describe, expect, it } from "vitest";
import { ChainService, DEFAULT_LOW_BALANCE, isBalanceLow } from "@/lib/services/ChainService";
import { appConfig } from "@/lib/config";
import { chainInfo } from "@/lib/chains";
import { networkName, txUrl } from "@/lib/explorer";
import { ethers } from "ethers";

describe("ChainService", () => {
  it("reports unconfigured protocol status", async () => {
    const status = await new ChainService().status();
    expect(status.configured).toBe(false);
  });

  it("records on Base by default", () => {
    expect(appConfig.chain.chainId).toBe(8453);
    expect(appConfig.chain.rpcUrl).toBe("https://mainnet.base.org");
    expect(networkName()).toBe("Base");
  });

  it("refuses to write to Moonbeam, which has shut down", async () => {
    const saved = { ...appConfig.chain };
    Object.assign(appConfig.chain, { chainId: 1284, rpcUrl: "http://localhost:1", operatorPrivateKey: "0x" + "11".repeat(32), contractAddress: "0x" + "22".repeat(20) });
    try {
      await expect(
        new ChainService().recordRecognition({ recognitionHash: "0x00", venueHash: "0x00", workerHash: "0x00", messageHash: "0x00", amountPence: 100 })
      ).rejects.toThrow(/no longer accepts records/);
    } finally {
      Object.assign(appConfig.chain, saved);
    }
  });

  it("links each record to the explorer for the chain it was written to", () => {
    expect(txUrl("0xabc", 8453)).toBe("https://basescan.org/tx/0xabc");
    expect(txUrl("0xabc", 84532)).toBe("https://sepolia.basescan.org/tx/0xabc");
    expect(txUrl("0xabc", 1284)).toBe("https://moonbeam.moonscan.io/tx/0xabc");
    expect(txUrl("0xabc")).toBe("https://basescan.org/tx/0xabc");
    expect(txUrl(null, 8453)).toBeNull();
    expect(chainInfo(1284)?.retired).toBe(true);
  });

  it("warns below 0.002 ETH by default", () => {
    expect(isBalanceLow(ethers.parseEther("0.001"), DEFAULT_LOW_BALANCE)).toBe(true);
    expect(isBalanceLow(ethers.parseEther("0.01"), DEFAULT_LOW_BALANCE)).toBe(false);
  });
});
