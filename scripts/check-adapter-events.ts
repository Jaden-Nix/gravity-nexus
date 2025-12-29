import { ethers } from "hardhat";

async function main() {
    const ADAPTER_C = "0x56168d09bac2A8e0235b097e50426EbAC88606D6";
    const adapter = await ethers.getContractAt("MockAdapter", ADAPTER_C);

    console.log("Checking Adapter C (Morpho) Events...");
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
