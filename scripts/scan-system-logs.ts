import { ethers } from "hardhat";

async function main() {
    const SYSTEM_CONTRACT = "0x0000000000000000000000000000000000000051";
    const RPC = "https://lasna-rpc.rnk.dev";
    const provider = new ethers.JsonRpcProvider(RPC);

    const block = await provider.getBlockNumber();
    console.log("Current Lasna Block:", block);

    const logs = await provider.getLogs({
        address: SYSTEM_CONTRACT,
        fromBlock: block - 1000,
        toBlock: block
    });

    console.log(`Found ${logs.length} logs for system contract.`);
    for (const log of logs) {
        console.log(`Block ${log.blockNumber}: Topics=${log.topics}`);
    }
}

main().catch(console.error);
