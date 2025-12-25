import { ethers } from "hardhat";

async function main() {
    // Load deployed contract addresses from frontend/contracts.js
    const fs = require("fs");
    const path = require("path");
    const contractsJsPath = path.join(process.cwd(), "frontend", "contracts.js");
    const contractsJs = fs.readFileSync(contractsJsPath, "utf8");

    // Parse localhost addresses
    const localhostMatch = contractsJs.match(/localhost:\s*\{[\s\S]*?nexusVault:\s*"(0x[a-fA-F0-9]+)"[\s\S]*?reactiveNexus:\s*"(0x[a-fA-F0-9]+)"/);

    if (!localhostMatch) {
        throw new Error("Could not parse contract addresses from frontend/contracts.js");
    }

    const vaultAddress = localhostMatch[1];
    const reactiveAddress = localhostMatch[2];

    console.log("Vault Address:", vaultAddress);
    console.log("Reactive Address:", reactiveAddress);

    const vault = await ethers.getContractAt("NexusVault", vaultAddress);

    try {
        const owner = await vault.owner();
        console.log("Vault Owner:", owner);

        const isReactiveOwner = (owner.toLowerCase() === reactiveAddress.toLowerCase());
        console.log("Is ReactiveNexus the owner?", isReactiveOwner);

        const isAuthorized = await vault.authorizedCallers(reactiveAddress);
        console.log("Is ReactiveNexus authorized caller?", isAuthorized);

        const adapterCount = await vault.getAdaptersCount();
        console.log("Adapter Count:", adapterCount.toString());

        for (let i = 0; i < Number(adapterCount); i++) {
            const adapterAddr = await vault.adapters(i);
            const adapter = await ethers.getContractAt("MockAdapter", adapterAddr);
            const rate = await adapter.getSupplyRate();
            const assets = await adapter.totalAssets();
            console.log(`Adapter ${i} (${adapterAddr}): Rate=${rate.toString()}, Assets=${ethers.formatUnits(assets, 18)}`);
        }

    } catch (e: any) {
        console.error("Error checking vault:", e.message);
    }
}

main().catch(console.error);
