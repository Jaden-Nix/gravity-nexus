import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("=== FULL SYSTEM REFRESH (SEPOLIA) ===");
    console.log("Deployer:", deployer.address);

    const gasOptions = {
        gasPrice: ethers.parseUnits("3.0", "gwei")
    };

    // 1. MockToken
    console.log("1. Deploying MockToken...");
    const MockToken = await ethers.getContractFactory("MockToken");
    const token = await MockToken.deploy(gasOptions);
    await token.waitForDeployment();
    const tokenAddr = await token.getAddress();
    console.log("   Token:", tokenAddr);

    // 2. Adapters
    console.log("2. Deploying Adapters...");
    const MockAdapter = await ethers.getContractFactory("MockAdapter");
    const adapterA = await MockAdapter.deploy(tokenAddr, 500, gasOptions); // 5%
    await adapterA.waitForDeployment();
    const adapterAAddr = await adapterA.getAddress();
    console.log("   Adapter A (Safe):", adapterAAddr);

    const adapterB = await MockAdapter.deploy(tokenAddr, 1000, gasOptions); // 10%
    await adapterB.waitForDeployment();
    const adapterBAddr = await adapterB.getAddress();
    console.log("   Adapter B (High Yield):", adapterBAddr);

    // 3. Vault
    console.log("3. Deploying NexusVault...");
    const NexusVault = await ethers.getContractFactory("NexusVault");
    const vault = await NexusVault.deploy(tokenAddr, gasOptions);
    await vault.waitForDeployment();
    const vaultAddr = await vault.getAddress();
    console.log("   Vault:", vaultAddr);

    console.log("   Adding Adapters to Vault...");
    await (await vault.addAdapter(adapterAAddr, gasOptions)).wait();
    await (await vault.addAdapter(adapterBAddr, gasOptions)).wait();

    // 4. Hub
    console.log("4. Deploying RemoteHub...");
    const RemoteHub = await ethers.getContractFactory("RemoteHub");
    const hub = await RemoteHub.deploy(gasOptions);
    await hub.waitForDeployment();
    const hubAddr = await hub.getAddress();
    console.log("   Hub:", hubAddr);

    // 5. Reactive Components (Mock for Sepolia side)
    console.log("5. Deploying Sepolia Reactive Components...");
    const ReactiveNexus = await ethers.getContractFactory("ReactiveNexus");
    const reactiveNexus = await ReactiveNexus.deploy(gasOptions);
    await reactiveNexus.waitForDeployment();
    const reactiveNexusAddr = await reactiveNexus.getAddress();
    console.log("   ReactiveNexus:", reactiveNexusAddr);

    const MLModel = await ethers.getContractFactory("MLModel");
    const mlModel = await MLModel.deploy("yield-lstm-v1", ethers.keccak256(ethers.toUtf8Bytes("weights")), gasOptions);
    await mlModel.waitForDeployment();
    const mlModelAddr = await mlModel.getAddress();

    const ZKMLVerifier = await ethers.getContractFactory("ZKMLVerifier");
    const verifier = await ZKMLVerifier.deploy(gasOptions);
    await verifier.waitForDeployment();
    const verifierAddr = await verifier.getAddress();

    // 6. Linking
    console.log("6. Linking Infrastructure...");
    await (await vault.setAuthorization(hubAddr, true, gasOptions)).wait();
    await (await hub.setVault(vaultAddr, gasOptions)).wait();
    await (await reactiveNexus.setVault(vaultAddr, gasOptions)).wait();
    // Link vault to existing rebalancer or we will do it in next script

    console.log("\n=== SEPOLIA REFRESH COMPLETE ===");
    console.log(`Vault: ${vaultAddr}`);
    console.log(`Hub: ${hubAddr}`);
    console.log(`Token: ${tokenAddr}`);

    // SAVE TO TEMP FILE FOR LASNA SCRIPT
    const deploymentData = {
        vault: vaultAddr,
        hub: hubAddr,
        token: tokenAddr,
        adapterA: adapterAAddr,
        adapterB: adapterBAddr,
        reactiveNexus: reactiveNexusAddr,
        mlModel: mlModelAddr,
        verifier: verifierAddr
    };
    fs.writeFileSync("deployment-temp.json", JSON.stringify(deploymentData, null, 2));
}

main().catch(console.error);
