import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "dotenv/config";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: { enabled: true, runs: 200 }
    }
  },
  networks: {
    moonbeam: {
      url: process.env.MOONBEAM_RPC_URL || "https://rpc.api.moonbeam.network",
      chainId: Number(process.env.MOONBEAM_CHAIN_ID || 1284),
      accounts: process.env.MOONBEAM_OPERATOR_PRIVATE_KEY ? [process.env.MOONBEAM_OPERATOR_PRIVATE_KEY] : []
    },
    moonbase: {
      url: process.env.MOONBASE_RPC_URL || "https://rpc.api.moonbase.moonbeam.network",
      chainId: 1287,
      accounts: process.env.MOONBEAM_OPERATOR_PRIVATE_KEY ? [process.env.MOONBEAM_OPERATOR_PRIVATE_KEY] : []
    }
  },
  paths: {
    tests: "./test/contracts"
  }
};

export default config;
