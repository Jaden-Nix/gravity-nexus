import { ethers } from "hardhat";

async function main() {
    const VAULT = "0xaF4e198830f24B000D14A682f9c537D54fd76e49";
    const vault = await ethers.getContractAt("NexusVault", VAULT);

    const owner = await vault.owner();
    console.log("Vault Owner:", owner);
}

main().catch(console.error);
