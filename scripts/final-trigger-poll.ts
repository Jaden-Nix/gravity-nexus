import { ethers } from "hardhat";
import "dotenv/config";

async function main() {
    console.log("=== FINAL BOUNTY TRIGGER & POLL ===\n");

    const NEW_VAULT = "0xa0389d5836d0B9CcBF9cAe89caA4cbe0ddE18342";
    const NEW_HUB = "0xbB47EfeE770216222f1A97c0C2bb83B43F91F759";
    const ADAPTER_A = "0x6022868B710EA865dd6B21c27888847aC1F31ffE";

    const sepProvider = new ethers.JsonRpcProvider("https://ethereum-sepolia-rpc.publicnode.com");
    const sepWallet = new ethers.Wallet(process.env.PRIVATE_KEY!, sepProvider);
    const adapterA = new ethers.Contract(ADAPTER_A, ["function setSupplyRate(uint256)"], sepWallet);
    const hub = new ethers.Contract(NEW_HUB, ["event ActionExecuted(string actionType, bool success, bytes data)"], sepProvider);

    console.log("1. Triggering Origin Event (Rate -> 7000)...");
    const tx = await adapterA.setSupplyRate(7000);
    console.log("   🚀 ORIGIN TX HASH:", tx.hash);
    const receipt = await tx.wait();
    console.log("   Confirmed in block:", receipt?.blockNumber);

    console.log("\n2. Polling for Reactive/Destination hashes...");
    console.log("   (Waiting up to 5 minutes)");

    const startTime = Date.now();
    while (Date.now() - startTime < 300000) {
        const logs = await sepProvider.getLogs({
            address: NEW_HUB,
            fromBlock: (receipt?.blockNumber || 0),
            toBlock: 'latest'
        });

        if (logs.length > 0) {
            console.log("\n🔥 CALLBACK DETECTED ON SEPOLIA!");
            console.log("   DESTINATION TX HASH:", logs[0].transactionHash);

            // The REACTIVE hash is on Lasna. We can't perfectly automate finding it without checking EVERY tx to our rebalancer,
            // but usually it's the most recent one.
            console.log("\n--- COMPLETE BOUNTY EVIDENCE ---");
            console.log("Origin (Sepolia):", tx.hash);
            console.log("Destination (Sepolia):", logs[0].transactionHash);
            console.log("Reactive (Lasna): [Scan Lasna Explorer for most recent tx to 0x63D3CE267c516Aad7Badc02328c6D0C60f1a522c]");
            return;
        }
        process.stdout.write(".");
        await new Promise(r => setTimeout(r, 10000));
    }
    console.log("\n❌ Timeout. Please check Reactive Network logs manually.");
}

main().catch(console.error);
