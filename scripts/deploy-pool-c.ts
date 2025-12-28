import { ethers } from "hardhat";

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log(`\n=== DEPLOYING 3RD POOL (POOL C - MORPHO) ===`);
    console.log(`Deploying from: ${deployer.address}\n`);

    const vaultAddr = "0xa0389d5836d0B9CcBF9cAe89caA4cbe0ddE18342";
    const assetAddr = "0x828c06dE0F2D60E2ce726bb99a6572b88f4BdE53";

    // 1. Deploy MockAdapter C
    console.log("1. Deploying MockAdapter C...");
    const MockAdapter = await ethers.getContractFactory("MockAdapter");
    const adapterC = await MockAdapter.deploy(assetAddr, 400); // 4% initial rate
    await adapterC.waitForDeployment();
    const adapterCAddr = await adapterC.getAddress();
    console.log(`   ✅ Pool C deployed at: ${adapterCAddr}`);

    // 2. Link to Vault
    console.log("2. Linking Pool C to Vault...");
    const vault = await ethers.getContractAt("NexusVault", vaultAddr);
    const tx = await vault.addAdapter(adapterCAddr);
    await tx.wait();
    console.log("   ✅ Pool C linked to Vault");

    console.log("\n--- CONFIGURATION UPDATE ---");
    console.log(`Add this to CONTRACT_ADDRESSES.sepolia in contracts.js:`);
    console.log(`adapterC: "${adapterCAddr}"`);
}

main().catch(console.error);
