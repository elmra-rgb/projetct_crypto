import pkg from "hardhat";
const { ethers } = pkg;
import fs from "fs";

async function main() {
  console.log("Deploying AccidentContract...");

  const AccidentContract = await ethers.getContractFactory("AccidentContract");
  const contract = await AccidentContract.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("✅ AccidentContract deployed to:", address);

  // Save address so the backend can pick it up automatically
  fs.writeFileSync(
    "./backend/deployed-address.json",
    JSON.stringify({ address }, null, 2)
  );
  console.log("📝 Address saved to backend/deployed-address.json");

  // Register the default Hardhat account #0 as a driver for testing
  const [owner] = await ethers.getSigners();
  await contract.registerDriver(owner.address);
  console.log("🧑‍💼 Registered driver:", owner.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
