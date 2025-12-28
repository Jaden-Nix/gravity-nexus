import { ethers } from "hardhat";

async function main() {
    const vaultAddress = "0xaF4e198830f24B000D14A682f9c537D54fd76e49";
    const remoteHub = "0x448688AD41C79D5E6c649B5BF3A12e68E4528707";
    const vault = await ethers.getContractAt("NexusVault", vaultAddress);

    const isAuthorized = await vault.authorizedCallers(remoteHub);
    console.log(`Vault Authorization for Hub (${remoteHub}):`, isAuthorized);
}

main().catch(console.error);
