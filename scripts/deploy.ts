// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers } from "hardhat";

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // We get the contract to deploy
  const SpaceCoinICO = await ethers.getContractFactory("SpaceCoinICO");
  const spaceCoinICO = await SpaceCoinICO.deploy("0x02816799D8f93E24308B2760E2dC861B059F411e", ["0x02816799D8f93E24308B2760E2dC861B059F411e"]);

  await spaceCoinICO.deployed();

  console.log("SpaceCoin deployed to:", spaceCoinICO.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});