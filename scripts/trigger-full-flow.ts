import { ethers } from "hardhat";

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Account:", deployer.address);

    const ADAPTER_A = "0x6022868B710EA865dd6B21c27888847aC1F31ffE";
    const ADAPTER_B = "0x75Faf823c7FC1c526F04B8B6DBda13200287bE85";
    const ADAPTER_C = "0x56168d09bac2A8e0235b097e50426EbAC88606D6"; // Morpho
    const HUB = "0xbB47EfeE770216222f1A97c0C2bb83B43F91F759"; // Mirror Hub

    const adapterA = await ethers.getContractAt("MockAdapter", ADAPTER_A);
    const adapterB = await ethers.getContractAt("MockAdapter", ADAPTER_B);
    const adapterC = await ethers.getContractAt("MockAdapter", ADAPTER_C);
    const hub = await ethers.getContractAt("RemoteHub", HUB);

    // Current yield was 1500. Set to 1800 to trigger a new event.
    console.log("\n--- TRIGGERING ORIGIN TRANSACTION ---");
    console.log("Setting Adapter C (Morpho) Yield to 1800 bps...");

    // This emits RateUpdated(1800)
    const tx = await adapterC.simulateRateChange(1800);
    console.log("Origin TX Hash:", tx.hash);

    const receipt = await tx.wait();
    console.log("Origin Block:", receipt?.blockNumber);

    console.log("\n--- WAITING FOR REACTIVE CALLBACK (DESTINATION) ---");
    console.log("Polling RemoteHub for ActionExecuted event...");

    // Poll for up to 5 minutes (Reactive Network can take 30-60s)
    const startTime = Date.now();
    const timeout = 300000; // 5 mins

    let destinationHash = "";

    while (Date.now() - startTime < timeout) {
        // Filter for ALL ActionExecuted events on Hub (cannot filter non-indexed string)
        const filter = hub.filters.ActionExecuted();
        const events = (await hub.queryFilter(filter, (receipt?.blockNumber || 0))) as any[];

        if (events.length > 0) {
            // Find the one that matches "OPTIMIZE"
            const event = events.find((e: any) => e.args.actionType === "OPTIMIZE");
            if (event) {
                destinationHash = event.transactionHash;
                console.log("\n🚀 DESTINATION CALLBACK DETECTED!");
                console.log("Destination TX Hash:", destinationHash);
                console.log("Result:", event.args.success ? "Success" : "Failed");
                if (!event.args.success) console.log("Reason:", event.args.data);
                break;
            }
        }

        process.stdout.write(".");
        await new Promise(r => setTimeout(r, 5000));
    }

    if (!destinationHash) {
        console.log("\n❌ Timeout waiting for callback. Check Lasna explorer for your rebalancer contract status.");
        console.log("Lasna Rebalancer Address: 0x760FBf81b2FE506dEc35dA1385E65C79A8fD12FB");
    }
}

main().catch(console.error);
