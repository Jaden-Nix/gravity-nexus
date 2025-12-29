import { ethers } from "hardhat";
import "dotenv/config";

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("=== DEPLOYING FINAL FRICTIONLESS DEMO INFRASTRUCTURE ===\n");
    console.log("Account:", deployer.address);
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("Balance:", ethers.formatUnits(balance, 18), "ETH\n");

    const ASSET = "0x828c06dE0F2D60E2ce726bb99a6572b88f4BdE53";
    const ADAPTER_A = "0x6022868B710EA865dd6B21c27888847aC1F31ffE";
    const ADAPTER_B = "0x75Faf823c7FC1c526F04B8B6DBda13200287bE85";
    const ADAPTER_C = "0x56168d09bac2A8e0235b097e50426EbAC88606D6";
    const RELAYER = "0x0000000000000000000000000000000000000051"; // System Relayer on Sepolia

    // 1. Deploy New Vault (Public checkYieldAndRebalance)
    console.log("1. Deploying Public NexusVault...");
    const Vault = await ethers.getContractFactory("NexusVault");
    const vault = await Vault.deploy(ASSET);
    await vault.waitForDeployment();
    const vaultAddr = await vault.getAddress();
    console.log("   Vault deployed to:", vaultAddr);

    // 2. Deploy New Hub
    console.log("2. Deploying New RemoteHub...");
    const Hub = await ethers.getContractFactory("RemoteHub");
    const hub = await Hub.deploy();
    await hub.waitForDeployment();
    const hubAddr = await hub.getAddress();
    console.log("   Hub deployed to:", hubAddr);

    // 3. Configure Infrastructure
    console.log("3. Linking components...");
    console.log("   Adding Pool A...");
    await (await vault.addAdapter(ADAPTER_A)).wait();
    console.log("   Adding Pool B...");
    await (await vault.addAdapter(ADAPTER_B)).wait();
    console.log("   Adding Pool C...");
    await (await vault.addAdapter(ADAPTER_C)).wait();

    console.log("   Authorizing Hub in Vault...");
    await (await vault.setAuthorization(hubAddr, true)).wait();

    console.log("   Configuring Hub...");
    await (await hub.setVault(vaultAddr)).wait();
    await (await hub.setReactiveNetwork(RELAYER)).wait();

    console.log("\n=== FINAL DEPLOYMENT COMPLETE ===");
    console.log("Vault:", vaultAddr);
    console.log("Hub:", hubAddr);
    console.log("\nACTION REQUIRED:");
    console.log("1. Update frontend/contracts.js with these addresses.");
    console.log("2. Redeploy ReactiveRebalancer on Lasna pointing to THIS Hub and Vault.");
    console.log("3. Test with a Guest Wallet!");
}

main().catch(console.error);
