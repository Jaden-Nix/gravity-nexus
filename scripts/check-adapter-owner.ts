import { ethers } from "hardhat";

async function main() {
    const vaultAddress = "0xaF4e198830f24B000D14A682f9c537D54fd76e49";
    const vault = await ethers.getContractAt("NexusVault", vaultAddress);

    const adapterAAddress = await vault.adapters(0);
    console.log("Adapter A:", adapterAAddress);

    const adapter = await ethers.getContractAt("MockAdapter", adapterAAddress);
    console.log("Adapter A Owner:", await adapter.owner());
}

main().catch(console.error);
