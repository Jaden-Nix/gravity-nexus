import { ethers } from "hardhat";

async function main() {
    const [deployer] = await ethers.getSigners();
    const address = deployer.address;
    console.log("Checking status for:", address);

    const [nonce, balance] = await Promise.all([
        ethers.provider.getTransactionCount(address),
        ethers.provider.getBalance(address)
    ]);

    console.log("Confirmed Nonce:", nonce);
    console.log("Balance:", ethers.formatUnits(balance, 18), "ETH");

    const pendingNonce = await ethers.provider.getTransactionCount(address, "pending");
    console.log("Pending Nonce:", pendingNonce);

    if (pendingNonce > nonce) {
        console.log(`⚠️ You have ${pendingNonce - nonce} pending transaction(s).`);

        // Peek at the pending transaction if possible
        // Note: ethers can't easily get pending txs by nonce from RPC directly without custom methods
        // but we can try to get the latest tx hash we sent if we had it.
        // Instead, let's just show the current network gas price recommendation
        const feeData = await ethers.provider.getFeeData();
        console.log("Current Network Gas Price (Gwei):", ethers.formatUnits(feeData.gasPrice || 0n, "gwei"));
    } else {
        console.log("✅ No pending transactions in the mempool.");
    }
}

main().catch(console.error);
