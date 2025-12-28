import { ethers } from "hardhat";

async function main() {
    const vaultAddress = "0xaF4e198830f24B000D14A682f9c537D54fd76e49";
    const vault = await ethers.getContractAt("NexusVault", vaultAddress);

    const totalAssets = await vault.totalAssets();
    console.log("Vault Total Assets:", ethers.formatUnits(totalAssets, 18));

    const count = await vault.getAdaptersCount();
    for (let i = 0; i < count; i++) {
        const adr = await vault.adapters(i);
        const adapter = await ethers.getContractAt("MockAdapter", adr);
        const assets = await adapter.totalAssets();
        const rate = await adapter.getSupplyRate();
        console.log(`Adapter ${i} (${adr}): Assets=${ethers.formatUnits(assets, 18)}, Rate=${rate}`);
    }
}

main().catch(console.error);
