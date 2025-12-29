import { ethers } from "ethers";

async function main() {
    const RPC = "https://lasna-rpc.rnk.dev";
    const REBALANCER = "0x760FBf81b2FE506dEc35dA1385E65C79A8fD12FB";

    const provider = new ethers.JsonRpcProvider(RPC);

    console.log("Checking Lasna Logs for:", REBALANCER);

    const block = await provider.getBlockNumber();
    console.log("Current Lasna Block:", block);

    // Look for any logs in the last 100 blocks
    const logs = await provider.getLogs({
        address: REBALANCER,
        fromBlock: block - 1000,
        toBlock: block
    });

    console.log(`Found ${logs.length} logs.`);
    for (const log of logs) {
        console.log(`Log in block ${log.blockNumber}: TX ${log.transactionHash}`);
        console.log(`Topics: ${log.topics}`);
        console.log(`Data: ${log.data}`);
    }
}

main().catch(console.error);
