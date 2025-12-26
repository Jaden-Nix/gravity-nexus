import { ethers } from "hardhat";

async function main() {
    const VAULT = "0xaF4e198830f24B000D14A682f9c537D54fd76e49";
    const vault = await ethers.getContractAt("NexusVault", VAULT);

    console.log("Checking Sepolia Vault Events...");

    const block = await ethers.provider.getBlockNumber();
    console.log("Current Sepolia Block:", block);

    const filter = vault.filters.Rebalanced();
    const events = await vault.queryFilter(filter, block - 10000, block);

    console.log(`Found ${events.length} events in the last 10,000 blocks.`);
    for (const event of events as any[]) {
        console.log(`Block ${event.blockNumber}: Rebalanced ${event.args.amount} from ${event.args.fromIdx} to ${event.args.toIdx}, TX=${event.transactionHash}`);
    }
}

main().catch(console.error);
