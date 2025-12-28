import { ethers } from "hardhat";

async function main() {
    const HUB = "0x448688AD41C79D5E6c649B5BF3A12e68E4528707";
    const hub = await ethers.getContractAt("RemoteHub", HUB);

    console.log("Checking for ReactiveCallbackReceived events...");

    const block = await ethers.provider.getBlockNumber();
    const filter = hub.filters.ReactiveCallbackReceived();
    const events = await hub.queryFilter(filter, block - 10000, block);

    console.log(`Found ${events.length} callback events.`);
    for (const event of events as any[]) {
        console.log(`Block ${event.blockNumber}: TX=${event.transactionHash}`);
    }
}

main().catch(console.error);
