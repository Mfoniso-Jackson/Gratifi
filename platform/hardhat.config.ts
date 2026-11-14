import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "dotenv/config";

const accounts = process.env.CHAIN_OPERATOR_PRIVATE_KEY ? [process.env.CHAIN_OPERATOR_PRIVATE_KEY] : [];

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: { enabled: true, runs: 200 }
    }
  },
  networks: {
    // Base, Coinbase's Ethereum layer 2. Moonbeam shut down in 2026 and is no longer a target.
    base: {
      url: process.env.CHAIN_RPC_URL || "https://mainnet.base.org",
      chainId: 8453,
      accounts
    },
    baseSepolia: {
      url: process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org",
      chainId: 84532,
      accounts
    }
  },
  etherscan: {
    // One Etherscan API key covers Basescan (Etherscan API v2).
    apiKey: process.env.ETHERSCAN_API_KEY || ""
  },
  paths: {
    tests: "./test/contracts"
  }
};

export default config;
