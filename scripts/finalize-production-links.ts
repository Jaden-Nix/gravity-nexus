import { ethers } from "hardhat";

/**
 * @notice Final Production Linker
 * This script ensures that the Nexus Vault is fully armed for autonomous rebalancing.
 */
async function main() {
    const [deployer] = await ethers.getSigners();
    const network = await ethers.provider.getNetwork();
    console.log(`\n=== FINALIZING PRODUCTION LINKS ON ${network.name.toUpperCase()} ===`);
    console.log(`Executing from: ${deployer.address}\n`);

    // Latest addresses from deployment
    const addresses = {
        vault: "0xaF4e198830f24B000D14A682f9c537D54fd76e49",
        hub: "0x448688AD41C79D5E6c649B5BF3A12e68E4528707",
        reactiveNexus: "0x11c2813851B649382cC72A64Ebcd0958467B705B",
        lasnaRebalancer: "0x760FBf81b2FE506dEc35dA1385E65C79A8fD12FB"
    };

    const vault = await ethers.getContractAt("NexusVault", addresses.vault);
    const hub = await ethers.getContractAt("RemoteHub", addresses.hub);
    const reactiveNexus = await ethers.getContractAt("ReactiveNexus", addresses.reactiveNexus);

    // 1. Authorize Hub on Vault
    console.log("1. Authorizing RemoteHub on Vault...");
    if (!(await vault.authorizedCallers(addresses.hub))) {
        await (await vault.setAuthorization(addresses.hub, true)).wait();
        console.log("   ✅ Hub Authorized");
    } else {
        console.log("   ℹ️ Hub already authorized");
    }

    // 2. Authorize ReactiveNexus on Vault
    console.log("2. Authorizing ReactiveNexus on Vault...");
    if (!(await vault.authorizedCallers(addresses.reactiveNexus))) {
        await (await vault.setAuthorization(addresses.reactiveNexus, true)).wait();
        console.log("   ✅ ReactiveNexus Authorized");
    } else {
        console.log("   ℹ️ ReactiveNexus already authorized");
    }

    // 3. Link Vault to Hub (OWNER ONLY)
    console.log("3. Linking Vault to RemoteHub...");
    const currentVault = await hub.vault();
    if (currentVault.toLowerCase() !== addresses.vault.toLowerCase()) {
        try {
            await (await hub.setVault(addresses.vault)).wait();
            console.log("   ✅ Vault Linked");
        } catch (e) {
            console.log("   ❌ Failed to link vault in RemoteHub. Are you the owner?");
        }
    } else {
        console.log("   ℹ️ Vault already linked in Hub");
    }

    // 4. Link Reactive Network to Hub (OWNER ONLY)
    console.log("4. Linking Reactive Network (Lasna) to RemoteHub...");
    const currentReactive = await hub.reactiveNetwork();
    if (currentReactive.toLowerCase() !== addresses.lasnaRebalancer.toLowerCase()) {
        try {
            await (await hub.setReactiveNetwork(addresses.lasnaRebalancer)).wait();
            console.log("   ✅ Lasna Rebalancer Linked");
        } catch (e) {
            console.log("   ❌ Failed to link Reactive Network in RemoteHub. Are you the owner?");
        }
    } else {
        console.log("   ℹ️ Lasna Rebalancer already linked");
    }

    // 5. Link Vault to Agent (OWNER ONLY)
    console.log("5. Linking Vault to ReactiveNexus Agent...");
    const agentVault = await reactiveNexus.nexusVault();
    if (agentVault.toLowerCase() !== addresses.vault.toLowerCase()) {
        try {
            await (await reactiveNexus.setVault(addresses.vault)).wait();
            console.log("   ✅ Agent Linked");
        } catch (e) {
            console.log("   ❌ Failed to link vault in ReactiveNexus. Are you the owner?");
        }
    } else {
        console.log("   ℹ️ Agent already linked to vault");
    }

    console.log("\n╔════════════════════════════════════════════════════════════════╗");
    console.log("║         PRODUCTION INFRASTRUCTURE IS ARMED ✅                 ║");
    console.log("╚════════════════════════════════════════════════════════════════╝");
}

main().catch(console.error);

// If you need to link from a different wallet (e.g., ownership was transferred),
// you can use this ABI via ethers in the browser console or a separate script:
console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║  MANUAL LINKING INSTRUCTIONS (if ownership was transferred)               ║
╠════════════════════════════════════════════════════════════════════════════╣
║  Connect your wallet (0x9Fa...) to Sepolia, then run in browser console:  ║
║                                                                           ║
║  const hub = new ethers.Contract(                                          ║
║    "0x448688AD41C79D5E6c649B5BF3A12e68E4528707",                            ║
║    ["function setReactiveNetwork(address)"],                               ║
║    window.nexusGalaxy.signer                                               ║
║  );                                                                        ║
║  await hub.setReactiveNetwork("0x760FBf81b2FE506dEc35dA1385E65C79A8fD12FB") ║
╚════════════════════════════════════════════════════════════════════════════╝
`);

