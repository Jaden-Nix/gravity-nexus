import { ethers } from "hardhat";

async function main() {
    const txHash = "0x83fac4436763fdb7c3367f70b1192c0f49c6e7634feda495f5b58ffc807b0927";
    const RPC = "https://lasna-rpc.rnk.dev";
    const provider = new ethers.JsonRpcProvider(RPC);

    const receipt = await provider.getTransactionReceipt(txHash);
    if (!receipt) {
        console.log("Sync TX not found.");
        return;
    }

    console.log("Sync TX Receipt found in block:", receipt.blockNumber);
    console.log("Logs count:", receipt.logs.length);
    for (const log of receipt.logs) {
        console.log(`Log Index: ${log.index}, Topics: ${log.topics}`);
    }
}

main().catch(console.error);
