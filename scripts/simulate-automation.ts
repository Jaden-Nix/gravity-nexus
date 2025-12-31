import { ethers } from "hardhat";

async function main() {
    const [deployer] = await ethers.getSigners();
    const network = await ethers.provider.getNetwork();
    const chainId = network.chainId.toString();

    console.log(`Starting Reactive Automation Simulator on Network ID: ${chainId}...`);

    // Dynamic Address Mapping
    const ADDR_MAP: { [key: string]: any } = {
        "11155111": { // Sepolia
            vault: "0xB7cd5b44Fcd3646ec08954Ecc6FDe43f334dF18f",
            reactive: "0x11c2813851B649382cC72A64Ebcd0958467B705B"
        },
        "31337": { // Hardhat Localhost
            vault: "0x0B306BF915C4d645ff596e518fAf3F9669b97016",
            reactive: "0x4ed7c70F96B99c776995fB64377f0d4aB3B0e1C1"
        },
        "421614": { // Arbitrum Sepolia
            vault: "0x88CbFB989b9D87E94Bf94801dd92Ac770deC36Fe",
            reactive: "0x7d6a70f8303385D182ABAd16a8159B6A27FE6B25"
        },
        "5318007": { // Lasna
            vault: "0x413c1ef36db28eD441D87c6ec1f078D0b7cEBe99",
            reactive: "0xB6B1406F0Cc984bC44e86DCE20B1bD9ce5d95020"
        }
    };

    const config = ADDR_MAP[chainId];
    if (!config) {
        throw new Error(`Unsupported network: ${chainId}. Please add it to ADDR_MAP.`);
    }

    const vaultAddress = config.vault;
    const reactiveAddress = config.reactive;

    const Vault = await ethers.getContractAt("NexusVault", vaultAddress);
    const Reactive = await ethers.getContractAt("ReactiveNexus", reactiveAddress);

    const adapterAAddress = await Vault.adapters(0);
    const adapterBAddress = await Vault.adapters(1);

    const AdapterA = await ethers.getContractAt("MockAdapter", adapterAAddress);
    const AdapterB = await ethers.getContractAt("MockAdapter", adapterBAddress);

    console.log("Monitoring yields...");
    console.log(`Vault: ${vaultAddress}`);
    console.log(`Reactive Hub: ${reactiveAddress}`);
    console.log(`Pool A: ${adapterAAddress}`);
    console.log(`Pool B: ${adapterBAddress}`);

    // Simulation loop - Long enough for interactive demo (60 iterations × ~1.5s = ~90 seconds)
    console.log("Entering simulation loop (2 iterations).");
    let iteration = 0;
    while (iteration < 2) {
        iteration++;
        console.log(`\n--- Iteration ${iteration} ---`);

        // 1. Set divergent rates (in basis points: 100 = 1%)
        // We'll vary them more aggressively to ensure rebalances trigger
        const rateA = (Math.floor(Math.random() * 10) + 2) * 100; // 2% - 11%
        const rateB = (Math.floor(Math.random() * 10) + 2) * 100; // 2% - 11%

        console.log(`Setting rates in parallel: Pool A=${(rateA / 100).toFixed(2)}%, Pool B=${(rateB / 100).toFixed(2)}%`);
        const [txA, txB] = await Promise.all([
            AdapterA.simulateRateChange(rateA),
            AdapterB.simulateRateChange(rateB)
        ]);
        await Promise.all([txA.wait(), txB.wait()]);

        // 2. Determine amount to move (dynamically check vault balance)
        const totalAssets = await Vault.totalAssets();
        if (totalAssets === 0n) {
            console.log("ℹ️ Vault is currently empty. Rebalance check will simulate with 0.1 ETH.");
        }

        const amountToMove = totalAssets > 0n ? totalAssets : ethers.parseUnits("0.1", 18);

        // 3. Trigger Reactive check
        console.log(`Triggering Reactive Yield Check with amount: ${ethers.formatUnits(amountToMove, 18)} tETH...`);
        try {
            const tx = await Reactive.checkYieldAndRebalance(amountToMove);
            const receipt = await tx.wait();

            // 4. Check for events
            const eventLog = receipt?.logs.find((log: any) => {
                try {
                    const parsed = Reactive.interface.parseLog(log);
                    return parsed?.name === 'ActionTriggered';
                } catch { return false; }
            });

            if (eventLog) {
                const parsed = Reactive.interface.parseLog(eventLog);
                console.log(`🚀 REBALANCE TRIGGERED: ${parsed?.args[0]} (Amount: ${ethers.formatUnits(parsed?.args[3], 18)})`);
            } else {
                console.log("⚡ Yield difference below threshold or funds already in best pool.");
            }
        } catch (e: any) {
            console.error(`❌ Rebalance Check Failed: ${e.reason || e.message}`);
        }

        // Wait a bit (fast 30-sec demo)
        await new Promise(resolve => setTimeout(resolve, 500));
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
