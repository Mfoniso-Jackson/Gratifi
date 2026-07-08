import hre from "hardhat";

async function main() {
  const hardhatEthers = hre.ethers as any;
  const [deployer] = await hardhatEthers.getSigners();
  const GratiFiProtocol = await hardhatEthers.getContractFactory("GratiFiProtocol");
  const contract = await GratiFiProtocol.deploy(deployer.address);
  await contract.waitForDeployment();
  console.log(`GratiFiProtocol deployed to ${await contract.getAddress()}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
