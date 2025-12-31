import { ethers } from "hardhat";

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log(`\n=== DEPLOYING 3RD POOL (POOL C - MORPHO) ===`);
    console.log(`Deploying from: ${deployer.address}\n`);

    const vaultAddr = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
    const assetAddr = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

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
