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
    const ADAPTER_A = "0x6022868B710EA865dd6B21c27888847aC1F31ffE";
    const REBALANCER = "0x760FBf81b2FE506dEc35dA1385E65C79A8fD12FB";

    // Selector for RateUpdated(uint256)
    // keccak256("RateUpdated(uint256)")
    const RATE_UPDATED_SELECTOR = "0xe65c987b2e4668e09ba867026921588005b2b2063607a1e7e7d91683c8f91b7b";

    // Standard Reactive System Contract interface for subscriptions
    const system = await ethers.getContractAt([
        "function subscribe(uint256 chainId, address logAddress, uint256 selector, bytes32 topic1, bytes32 topic2, bytes32 topic3) external"
    ], SYSTEM_CONTRACT);

    console.log(`Subscribing Rebalancer (${REBALANCER}) to:`);
    console.log(`  Source Chain: Sepolia (${SEPOLIA_CHAIN_ID})`);
    console.log(`  Contract: ${ADAPTER_A}`);
    console.log(`  Event: RateUpdated (selector: ${RATE_UPDATED_SELECTOR})`);

    try {
        const tx = await system.subscribe(
            SEPOLIA_CHAIN_ID,
            ADAPTER_A,
            RATE_UPDATED_SELECTOR,
            ethers.ZeroHash, // topic1 (not indexed)
            ethers.ZeroHash, // topic2
            ethers.ZeroHash  // topic3
        );

        console.log("Subscription TX sent:", tx.hash);
        const receipt = await tx.wait();
        console.log("Subscription confirmed in block:", receipt?.blockNumber);
        console.log("✅ Reactive Network is now listening for yield shifts!");
    } catch (e: any) {
        console.error("❌ Subscription Failed!");
        console.error(e.message);
    }
}

main().catch(console.error);
