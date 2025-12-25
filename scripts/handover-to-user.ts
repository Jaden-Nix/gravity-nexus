import { ethers } from "hardhat";
import * as fs from "fs";

async function main() {
    const userWallet = "0x9Fa915353AA1e8F955f76D3a39497B8f1F38a273";
    console.log("=== FINAL HANDOVER TO USER ===");
    console.log("Target User Wallet:", userWallet);

    if (!fs.existsSync("deployment-temp.json")) {
        throw new Error("Deployment data missing!");
    }
    const data = JSON.parse(fs.readFileSync("deployment-temp.json", "utf8"));

    const gasOptions = {
        gasPrice: ethers.parseUnits("3.5", "gwei")
    };

    // 1. Authorize ReactiveNexus in Vault
    console.log(`Authorizing ReactiveNexus (${data.reactiveNexus}) in Vault (${data.vault})...`);
    const Vault = await ethers.getContractFactory("NexusVault");
    const vault = await Vault.attach(data.vault);
    await (await vault.setAuthorization(data.reactiveNexus, true, gasOptions)).wait();
    console.log("✅ ReactiveNexus authorized in Vault.");

    // 2. Transfer Ownership of ALL contracts to User
    console.log("Transferring ownership of all contracts...");

    console.log("  Transferring Vault...");
    await (await vault.transferOwnership(userWallet, gasOptions)).wait();

    console.log("  Transferring RemoteHub...");
    const RemoteHub = await ethers.getContractFactory("RemoteHub");
    const hub = await RemoteHub.attach(data.hub);
    await (await hub.transferOwnership(userWallet, gasOptions)).wait();

    console.log("  Transferring ReactiveNexus...");
    const ReactiveNexus = await ethers.getContractFactory("ReactiveNexus");
    const reactive = await ReactiveNexus.attach(data.reactiveNexus);
    await (await reactive.transferOwnership(userWallet, gasOptions)).wait();

    console.log("  Transferring MLModel...");
    const MLModel = await ethers.getContractFactory("MLModel");
    const model = await MLModel.attach(data.mlModel);
    await (await model.transferOwnership(userWallet, gasOptions)).wait();

    console.log("\n🏆 HANDOVER COMPLETE!");
    console.log("Your wallet now owns the entire Nexus infrastructure on Sepolia.");
    console.log("AI Intent updates should now work perfectly.");
}

main().catch(console.error);
