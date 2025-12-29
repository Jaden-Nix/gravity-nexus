import { ethers } from "hardhat";

async function main() {
    console.log("=== COMPLETING BOUNTY WORKFLOW (LASNA + SEPOLIA) ===\n");

    const NEW_VAULT = "0xa0389d5836d0B9CcBF9cAe89caA4cbe0ddE18342";
    const NEW_HUB = "0xbB47EfeE770216222f1A97c0C2bb83B43F91F759";
    const ADAPTER_A = "0x6022868B710EA865dd6B21c27888847aC1F31ffE";
    const SYSTEM_CONTRACT = "0x0000000000000000000000000000000000000051";
    const SEPOLIA_CHAIN_ID = 11155111;
    const RATE_UPDATED_SELECTOR = "0xe65c987b2e4668e09ba867026921588005b2b2063607a1e7e7d91683c8f91b7b";

    // 1. Deploy Rebalancer on Lasna
    console.log("1. Deploying Rebalancer on Lasna...");
    const Rebalancer = await ethers.getContractFactory("ReactiveRebalancer");
    const rebalancer = await Rebalancer.deploy(NEW_VAULT, NEW_HUB);
    await rebalancer.waitForDeployment();
    const rebalancerAddr = await rebalancer.getAddress();
    console.log("   Rebalancer deployed to:", rebalancerAddr);

    // 2. Call rsync (Subscribe)
    console.log("2. Registering Subscription on Lasna via rsync...");
    const txSync = await rebalancer.rsync(SYSTEM_CONTRACT, SEPOLIA_CHAIN_ID, ADAPTER_A, RATE_UPDATED_SELECTOR);
    console.log("   Sync TX Hash:", txSync.hash);
    await txSync.wait();
    console.log("   ✅ Subscription Registered\n");

    // 3. Trigger Origin Transaction (Sepolia)
    // We need to switch network context, but we can just use a provider/wallet for Sepolia
    console.log("3. Triggering Origin Event on Sepolia (Yield Shift)...");
    const sepProvider = new ethers.JsonRpcProvider("https://ethereum-sepolia-rpc.publicnode.com");
    const sepWallet = new ethers.Wallet(process.env.PRIVATE_KEY!, sepProvider);
    const adapterA = new ethers.Contract(ADAPTER_A, ["function simulateRateChange(uint256)"], sepWallet);

    // Set to a new rate to trigger event (6000)
    const txOrigin = await adapterA.simulateRateChange(6000);
    console.log("   🚀 ORIGIN TX HASH:", txOrigin.hash);
    const receiptOrigin = await txOrigin.wait();
    console.log("   Confirmed in block:", receiptOrigin?.blockNumber);

    console.log("\n4. Polling for Reactive/Destination hashes...");
    console.log("   (Monitoring Reactive Network and Sepolia Hub)");

    const startTime = Date.now();
    const timeout = 600000; // 10 mins

    const hub = new ethers.Contract(NEW_HUB, ["event ActionExecuted(string actionType, bool success, bytes data)"], sepProvider);

    while (Date.now() - startTime < timeout) {
        // Look for the callback on Hub
        const logs = await sepProvider.getLogs({
            address: NEW_HUB,
            fromBlock: receiptOrigin?.blockNumber,
            toBlock: 'latest'
        });

        if (logs.length > 0) {
            console.log("\n🔥 CALLBACK DETECTED ON SEPOLIA!");
            console.log("   DESTINATION TX HASH:", logs[0].transactionHash);

            // Now we need the REACTIVE hash (on Lasna)
            // It will be the transaction on Lasna that called Hub.callback
            // Wait, actually the judges want the REAC TX on Lasna.
            // We can find it by looking for logs from our rebalancer contract on Lasna?
            // Or just check the most recent tx to the rebalancer.
            break;
        }

        process.stdout.write(".");
        await new Promise(r => setTimeout(r, 10000));
    }
}

main().catch(console.error);
