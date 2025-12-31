import { ethers } from "hardhat";

async function main() {
    console.log("\n🚀 STARTING SHOWCASE REBALANCE DEMO");
    console.log("====================================\n");

    const [deployer] = await ethers.getSigners();
    const network = await ethers.provider.getNetwork();
    const chainId = network.chainId.toString();

    // Dynamic Address Mapping (Assuming localhost/sepolia for now)
    const ADDR_MAP: { [key: string]: any } = {
        "31337": { // Hardhat Localhost
            vault: "0x0B306BF915C4d645ff596e518fAf3F9669b97016",
            reactive: "0x4ed7c70F96B99c776995fB64377f0d4aB3B0e1C1"
        },
        "11155111": { // Sepolia
            vault: "0xB7cd5b44Fcd3646ec08954Ecc6FDe43f334dF18f",
            reactive: "0x11c2813851B649382cC72A64Ebcd0958467B705B"
        }
    };

    // Attempt to read from the most recent deployment if on localhost
    let vaultAddress = ADDR_MAP[chainId]?.vault;
    let reactiveAddress = ADDR_MAP[chainId]?.reactive;

    // For better reliability, we could try to find the addresses in frontend/contracts.js or similar
    // For this showcase, we'll assume the user has the correct addresses set or we'll hint them.

    const Vault = await ethers.getContractAt("NexusVault", vaultAddress);
    const Reactive = await ethers.getContractAt("ReactiveNexus", reactiveAddress);

    const adapterAAddress = await Vault.adapters(0);
    const adapterBAddress = await Vault.adapters(1);
    const adapterCAddress = await Vault.adapters(2);

    const AdapterA = await ethers.getContractAt("MockAdapter", adapterAAddress);
    const AdapterB = await ethers.getContractAt("MockAdapter", adapterBAddress);
    const AdapterC = await ethers.getContractAt("MockAdapter", adapterCAddress);

    console.log("📍 CONTRACT ADDRESSES:");
    console.log(`Vault:    ${vaultAddress}`);
    console.log(`Pool A:   ${adapterAAddress} (Safe)`);
    console.log(`Pool B:   ${adapterBAddress} (High Yield)`);
    console.log(`Pool C:   ${adapterCAddress} (Morpho)`);
    console.log(`Reactive: ${reactiveAddress}\n`);

    // --- STEP 1: INITIAL YIELD SETUP ---
    console.log("➔ STEP 1: Setting Pool A to highest yield (20% = 2000 bps)...");
    await (await AdapterA.simulateRateChange(2000)).wait();
    await (await AdapterB.simulateRateChange(1000)).wait();
    await (await AdapterC.simulateRateChange(500)).wait();
    console.log("✅ Pool A is now the optimal pool.\n");

    // --- STEP 2: DEPOSIT ---
    const depositAmount = ethers.parseUnits("1.0", 18);
    console.log(`➔ STEP 2: Depositing ${ethers.formatUnits(depositAmount, 18)} tETH into Vault...`);

    // Check if we need to mint or approve
    const tokenAddress = await Vault.asset();
    const token = await ethers.getContractAt("IERC20", tokenAddress);
    const balance = await token.balanceOf(deployer.address);
    if (balance < depositAmount) {
        console.log("   (Insufficient balance, trying to mint/fund...)");
        // Try to call mint if it's MockToken
        try {
            const mockToken = await ethers.getContractAt("MockToken", tokenAddress);
            await (await mockToken.mint(deployer.address, depositAmount)).wait();
        } catch (e) {
            console.log("   (Mint failed, proceeding anyway - might fail)");
        }
    }
    await (await token.approve(vaultAddress, depositAmount)).wait();

    const txDeposit = await Vault.deposit(depositAmount);
    await txDeposit.wait();

    const balanceA = await AdapterA.totalAssets();
    console.log(`✅ Deposit complete. Funds landed in Pool A (Current Bal: ${ethers.formatUnits(balanceA, 18)} tETH)\n`);

    // --- STEP 3: YIELD SHOCK ---
    console.log("➔ STEP 3: Market Volatility! Pool C yield spikes to 30% (3000 bps), Pool A drops to 2% (200 bps)...");
    await (await AdapterC.simulateRateChange(3000)).wait();
    await (await AdapterA.simulateRateChange(200)).wait();
    console.log("⚠️ IMMINENT REBALANCE DETECTED: Pool C (3000 bps) >> Pool A (200 bps)\n");

    // --- STEP 4: TRIGGER REBALANCE ---
    console.log("➔ STEP 4: Triggering Reactive Automation...");
    const txRebalance = await Reactive.checkYieldAndRebalance(depositAmount);
    const receipt = await txRebalance.wait();

    const rebalanceEvent = receipt?.logs.find((log: any) => {
        try {
            const parsed = Reactive.interface.parseLog(log);
            return parsed?.name === 'ActionTriggered';
        } catch { return false; }
    });

    if (rebalanceEvent) {
        const parsed = Reactive.interface.parseLog(rebalanceEvent);
        console.log(`🚀 SUCCESS: Rebalance triggered from Pool ${parsed?.args[1]} to Pool ${parsed?.args[2]}!`);
    } else {
        console.log("❌ ERROR: No rebalance event found.");
    }

    // --- STEP 5: FINAL STATE ---
    console.log("\n➔ STEP 5: Verifying final balances...");
    const finalBalanceA = await AdapterA.totalAssets();
    const finalBalanceC = await AdapterC.totalAssets();

    console.log(`Final Pool A Balance: ${ethers.formatUnits(finalBalanceA, 18)} tETH`);
    console.log(`Final Pool C Balance: ${ethers.formatUnits(finalBalanceC, 18)} tETH`);

    if (finalBalanceC > 0n) {
        console.log("\n🎉 DEMO SUCCESSFUL: Funds moved automatically to the highest yield pool!");
    } else {
        console.log("\n❌ DEMO FAILED: Funds did not move to Pool C.");
    }
    console.log("====================================\n");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
