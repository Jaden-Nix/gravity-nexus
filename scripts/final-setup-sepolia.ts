import { ethers } from "hardhat";

/**
 * @notice Final configuration for Sepolia contracts:
 * 1. Link Reactive Contract to RemoteHub
 * 2. Transfer ownership of all contracts to the user's wallet
 * 
 * Run with: npx hardhat run scripts/final-setup-sepolia.ts --network sepolia
 */
async function main() {
    const userWallet = ethers.getAddress("0x9Fa915353AA1e8F955f76D3a39497B8f1F38a273");
    const reactiveContractAddress = ethers.getAddress("0x14947e1F03905307169fa47d159749216d1d30B7"); // On Lasna

    // Latest Sepolia Addresses
    const addresses = {
        nexusVault: ethers.getAddress("0x1cE3FD7dBAA3d41B692340C8c9181be99D3011b8"),
        reactiveNexus: ethers.getAddress("0xd358be542bb239890E758Ee6f2bB7e7795d0c0Da"),
        remoteHub: ethers.getAddress("0x0236A17a010c9262af2697E59A0cbce6da218D1d"),
        mlModel: ethers.getAddress("0x82701705Ca21045995a4A1a0B5d4482b3bCffde2")
    };

    console.log("Starting final setup on Sepolia...");

    const remoteHub = await ethers.getContractAt("RemoteHub", addresses.remoteHub);
    const vault = await ethers.getContractAt("NexusVault", addresses.nexusVault);
    const reactiveNexus = await ethers.getContractAt("ReactiveNexus", addresses.reactiveNexus);
    const mlModel = await ethers.getContractAt("MLModel", addresses.mlModel);

    // 2. Link Reactive Network to RemoteHub
    console.log(`Setting authorized Reactive Network address to: ${reactiveContractAddress}`);
    await (await remoteHub.setReactiveNetwork(reactiveContractAddress)).wait();
    console.log("✅ Reactive Network authorized in RemoteHub");

    // 3. Transfer Ownership to User
    console.log(`Transferring ownership of all contracts to: ${userWallet}`);

    console.log("  Transferring RemoteHub...");
    await (await remoteHub.transferOwnership(userWallet)).wait();

    console.log("  Transferring ReactiveNexus...");
    await (await reactiveNexus.transferOwnership(userWallet)).wait();

    console.log("  Transferring MLModel...");
    await (await mlModel.transferOwnership(userWallet)).wait();

    // Vault ownership is usually held by ReactiveNexus, but let's check
    const vaultOwner = await vault.owner();
    console.log(`  Current Vault Owner: ${vaultOwner}`);
    if (vaultOwner !== reactiveNexus.target) {
        console.log("  Warning: Vault owner is not ReactiveNexus. Transferring to user for manual control if needed.");
        await (await vault.transferOwnership(userWallet)).wait();
    }

    console.log("\n╔════════════════════════════════════════════════════════════════╗");
    console.log("║         SEPOLIA CONFIGURATION COMPLETE ✅                      ║");
    console.log("╚════════════════════════════════════════════════════════════════╝");
    console.log(`
Summary:
  • Linked Reactive Contract (Lasna) to RemoteHub (Sepolia)
  • Transferred ownership of all core contracts to your wallet:
    ${userWallet}
    `);
}

main().catch(console.error);
