import { ethers } from "hardhat";
import * as fs from "fs";

async function main() {
    console.log("=== FULL SYSTEM REFRESH (LASNA) ===");

    // Read Sepolia addresses
    if (!fs.existsSync("deployment-temp.json")) {
        throw new Error("Sepolia deployment data missing! Run Sepolia script first.");
    }
    const sepolia = JSON.parse(fs.readFileSync("deployment-temp.json", "utf8"));

    console.log(`Using Sepolia Vault: ${sepolia.vault}`);
    console.log(`Using Sepolia Hub: ${sepolia.hub}`);

    // Deploy Rebalancer on Lasna (Kopli)
    const ReactiveRebalancer = await ethers.getContractFactory("ReactiveRebalancer");
    const rebalancer = await ReactiveRebalancer.deploy(sepolia.vault, sepolia.hub);
    await rebalancer.waitForDeployment();
    const rebalancerAddr = await rebalancer.getAddress();
    console.log("New Lasna Rebalancer Deployed at:", rebalancerAddr);

    // Update temp file
    sepolia.lasnaRebalancer = rebalancerAddr;
    fs.writeFileSync("deployment-temp.json", JSON.stringify(sepolia, null, 2));

    console.log("\n=== LASNA REFRESH COMPLETE ===");
}

main().catch(console.error);
