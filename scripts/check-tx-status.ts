import { ethers } from "hardhat";

async function main() {
    const txHash = "0x529746722a197180c9f0b470b9f59309583b0f1ef98c4434b5ba8f01e2e5db5b";

    const receipt = await ethers.provider.getTransactionReceipt(txHash);
    if (receipt) {
        console.log("Transaction Status:", receipt.status === 1 ? "Success" : "Failed");
        console.log("Block Number:", receipt.blockNumber);
        console.log("Logs Count:", receipt.logs.length);
    } else {
        console.log("Transaction not found or still pending.");
    }
}

main().catch(console.error);
