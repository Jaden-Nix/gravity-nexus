import { ethers } from "hardhat";

async function main() {
    const VAULT = "0xa0389d5836d0B9CcBF9cAe89caA4cbe0ddE18342";
    const HUB = "0xbB47EfeE770216222f1A97c0C2bb83B43F91F759";

    const vault = await ethers.getContractAt("NexusVault", VAULT);

    console.log("Checking Vault Authorization...");
    console.log("Vault Address:", VAULT);
    console.log("Hub Address:", HUB);

    const isAuthorized = await vault.authorizedCallers(HUB);
    const owner = await vault.owner();

    console.log("Is HUB authorized?", isAuthorized);
    console.log("Vault Owner:", owner);

    if (!isAuthorized) {
        console.log("\nAuthorizing HUB in Vault...");
        const tx = await vault.setAuthorization(HUB, true);
        await tx.wait();
        console.log("✅ HUB authorized!");
    } else {
        console.log("\nHUB is already authorized.");
    }
}

main().catch(console.error);
