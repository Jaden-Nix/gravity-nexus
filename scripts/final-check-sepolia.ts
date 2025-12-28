import { ethers } from "hardhat";

async function main() {
    const HUB = "0xbB47EfeE770216222f1A97c0C2bb83B43F91F759";
    const START_BLOCK = 9935351;

    const provider = new ethers.JsonRpcProvider("https://ethereum-sepolia-rpc.publicnode.com");
    const hub = new ethers.Contract(HUB, [
        "event ActionExecuted(string actionType, bool success, bytes data)",
        "event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)"
    ], provider);

    console.log("Checking Hub Events at:", HUB);
    const endBlock = await provider.getBlockNumber();
    console.log(`Scanning range: ${START_BLOCK} to ${endBlock}`);

    const logs = await provider.getLogs({
        address: HUB,
        fromBlock: START_BLOCK,
        toBlock: endBlock
    });

    console.log(`Found ${logs.length} logs in range.`);
    for (const log of logs) {
        try {
            const parsed = hub.interface.parseLog(log);
            console.log(`Block ${log.blockNumber}: Event=${parsed?.name}, TX=${log.transactionHash}`);
            if (parsed?.name === "ActionExecuted") {
                console.log("   Action:", parsed.args.actionType);
                console.log("   Success:", parsed.args.success);
            }
        } catch (e) {
            console.log(`Block ${log.blockNumber}: Unknown Event Topic=${log.topics[0]}, TX=${log.transactionHash}`);
        }
    }
}

main().catch(console.error);
