import { ethers } from "hardhat";

async function main() {
    const ADAPTER_A = "0x6022868B710EA865dd6B21c27888847aC1F31ffE";
    const adapter = await ethers.getContractAt("MockAdapter", ADAPTER_A);

    console.log("Checking Adapter A Events...");
    const block = await ethers.provider.getBlockNumber();
    console.log("Current Sepolia Block:", block);

    const filter = adapter.filters.RateUpdated();
    const events = await adapter.queryFilter(filter, block - 2000, block);

    console.log(`Found ${events.length} RateUpdated events.`);
    for (const event of events as any[]) {
        console.log(`Block ${event.blockNumber}: Rate=${event.args.newRate}, TX=${event.transactionHash}`);
    }
}

main().catch(console.error);
