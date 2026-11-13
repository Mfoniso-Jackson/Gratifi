/** Deploys GratiFiProtocol. Run with: npm run deploy:base-sepolia (test) or npm run deploy:base. */
import hre from "hardhat";

async function main() {
  const hardhatEthers = hre.ethers as any;
  const [deployer] = await hardhatEthers.getSigners();
  const GratiFiProtocol = await hardhatEthers.getContractFactory("GratiFiProtocol");
  const contract = await GratiFiProtocol.deploy(deployer.address);
  await contract.waitForDeployment();
  const address = await contract.getAddress();
  console.log(`GratiFiProtocol deployed to ${address} on ${hre.network.name}`);
  console.log(`Set GRATIFI_PROTOCOL_CONTRACT_ADDRESS=${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
