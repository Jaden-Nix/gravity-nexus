import { ethers } from "hardhat";

/**
 * @notice Register Reactive Subscription
 * This script calls the Reactive System Contract on Lasna to subscribe our 
 * rebalancer contract to events from the Sepolia network.
 */
async function main() {
    console.log("=== REGISTERING REACTIVE SUBSCRIPTION ON LASNA ===");

    const [deployer] = await ethers.getSigners();
    console.log("Account:", deployer.address);

    const SYSTEM_CONTRACT = "0x0000000000000000000000000000000000000051";
    const SEPOLIA_CHAIN_ID = 11155111;

    // Core Addresses
    const ADAPTERS = [
        "0x6022868B710EA865dd6B21c27888847aC1F31ffE", // Pool A
        "0x75Faf823c7FC1c526F04B8B6DBda13200287bE85", // Pool B
        "0x56168d09bac2A8e0235b097e50426EbAC88606D6"  // Pool C (Morpho)
    ];
    const REBALANCER = "0x760FBf81b2FE506dEc35dA1385E65C79A8fD12FB";

    // Selector for RateUpdated(uint256)
    // keccak256("RateUpdated(uint256)")
    const RATE_UPDATED_SELECTOR = "0xe65c987b2e4668e09ba867026921588005b2b2063607a1e7e7d91683c8f91b7b";

    // Standard Reactive System Contract interface for subscriptions
    const system = await ethers.getContractAt([
        "function subscribe(uint256 chainId, address logAddress, uint256 selector, bytes32 topic1, bytes32 topic2, bytes32 topic3) external"
    ], SYSTEM_CONTRACT);

    console.log(`Subscribing Rebalancer (${REBALANCER}) to all yield pools...`);

    for (const adapter of ADAPTERS) {
        console.log(`\nSubscribing to: ${adapter}`);
        try {
            const tx = await system.subscribe(
                SEPOLIA_CHAIN_ID,
                adapter,
                RATE_UPDATED_SELECTOR,
                ethers.ZeroHash,
                ethers.ZeroHash,
                ethers.ZeroHash
            );

            console.log("   TX sent:", tx.hash);
            await tx.wait();
            console.log("   ✅ Subscribed.");
        } catch (e: any) {
            console.error(`   ❌ Failed: ${e.message}`);
        }
    }
    console.log("\n=== ALL SUBSCRIPTIONS COMPLETED ===");
}

main().catch(console.error);
