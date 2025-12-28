import { ethers } from "hardhat";

async function main() {
    const txHash = "0xd515ed3f5692efe01786c6af8585c58740344c704a75945523c0d0f2e8ea72fe";
    const receipt = await ethers.provider.getTransactionReceipt(txHash);

    if (!receipt) {
        console.log("TX not found.");
        return;
    }

    console.log("Transaction Inspection:", txHash);
    console.log("From:", receipt.from);
    console.log("To:", receipt.to);
    console.log("Block:", receipt.blockNumber);
    console.log("Status:", receipt.status === 1 ? "Success" : "Failed");
    console.log("\nLogs Found:", receipt.logs.length);

    const vault = await ethers.getContractAt("NexusVault", "0xaF4e198830f24B000D14A682f9c537D54fd76e49");
    const hub = await ethers.getContractAt("RemoteHub", "0x448688AD41C79D5E6c649B5BF3A12e68E4528707");

    for (const log of receipt.logs) {
        try {
            if (log.address.toLowerCase() === vault.target.toString().toLowerCase()) {
                const parsed = vault.interface.parseLog(log);
                console.log(`[Vault] ${parsed?.name}:`, parsed?.args);
            } else if (log.address.toLowerCase() === hub.target.toString().toLowerCase()) {
                const parsed = hub.interface.parseLog(log);
                console.log(`[Hub] ${parsed?.name}:`, parsed?.args);
            } else {
                console.log(`[Other] Contract: ${log.address} Topic: ${log.topics[0]}`);
            }
        } catch (e) {
            console.log(`[Raw] Contract: ${log.address} Topic: ${log.topics[0]}`);
        }
    }
}

main().catch(console.error);
