import { ethers } from "hardhat";

async function main() {
    const VAULT = "0xa0389d5836d0B9CcBF9cAe89caA4cbe0ddE18342";
    const vault = await ethers.getContractAt("NexusVault", VAULT);

    const owner = await vault.owner();
    console.log("Vault Owner:", owner);
}

main().catch(console.error);
