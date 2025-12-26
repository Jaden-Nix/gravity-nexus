import { ethers } from "hardhat";

async function main() {
    const HUB = "0xbB47EfeE770216222f1A97c0C2bb83B43F91F759";
    const hub = await ethers.getContractAt("RemoteHub", HUB);

    console.log("Checking Sepolia Hub Events...");

    const block = await ethers.provider.getBlockNumber();
    console.log("Current Sepolia Block:", block);

    // Query ALL events on the hub
    const events = await ethers.provider.getLogs({
        address: HUB,
        fromBlock: block - 5000,
        toBlock: block
    });

    console.log(`Found ${events.length} events.`);
    for (const log of events) {
        try {
            const parsed = hub.interface.parseLog(log);
            console.log(`Block ${log.blockNumber}: Event=${parsed?.name}, TX=${log.transactionHash}`);
            if (parsed?.name === "ActionExecuted") {
                console.log("   ActionType:", parsed.args.actionType);
                console.log("   Success:", parsed.args.success);
            }
        } catch (e) {
            console.log(`Block ${log.blockNumber}: Unknown Event (Topic: ${log.topics[0]}), TX=${log.transactionHash}`);
        }
    }
}

main().catch(console.error);
