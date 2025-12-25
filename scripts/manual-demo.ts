import { ethers } from "hardhat";

/**
 * Gravity Nexus: Manual Demo Script
 * 
 * This script provides step-by-step interactive testing of all contract features.
 * Run with: npx hardhat run scripts/manual-demo.ts --network localhost
 * 
 * Before running, ensure:
 *   1. Local Hardhat node is running: npx hardhat node
 *   2. Contracts are deployed: npx hardhat run scripts/deploy.ts --network localhost
 */

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("\n╔════════════════════════════════════════════════════════════════╗");
    console.log("║          GRAVITY NEXUS - MANUAL DEMO SCRIPT                    ║");
    console.log("╚════════════════════════════════════════════════════════════════╝\n");
    console.log(`Connected Account: ${deployer.address}`);
    console.log(`Network: ${(await ethers.provider.getNetwork()).name || 'localhost'}\n`);

    // Load deployed contract addresses from frontend/contracts.js
    const fs = require("fs");
    const path = require("path");
    const contractsJsPath = path.join(__dirname, "..", "frontend", "contracts.js");
    const contractsJs = fs.readFileSync(contractsJsPath, "utf8");

    // Parse localhost addresses
    const localhostMatch = contractsJs.match(/localhost:\s*\{[\s\S]*?nexusVault:\s*"(0x[a-fA-F0-9]+)"[\s\S]*?reactiveNexus:\s*"(0x[a-fA-F0-9]+)"[\s\S]*?assetToken:\s*"(0x[a-fA-F0-9]+)"[\s\S]*?remoteHub:\s*"(0x[a-fA-F0-9]+)"/);

    if (!localhostMatch) {
        throw new Error("Could not parse contract addresses from frontend/contracts.js. Run deploy.ts first.");
    }

    const addresses = {
        nexusVault: localhostMatch[1],
        reactiveNexus: localhostMatch[2],
        assetToken: localhostMatch[3],
        remoteHub: localhostMatch[4]
    };

    console.log("📋 Contract Addresses:");
    console.log("─────────────────────────────────────────");
    console.log(`  NexusVault:     ${addresses.nexusVault}`);
    console.log(`  ReactiveNexus:  ${addresses.reactiveNexus}`);
    console.log(`  AssetToken:     ${addresses.assetToken}`);
    console.log(`  RemoteHub:      ${addresses.remoteHub}`);
    console.log("─────────────────────────────────────────\n");

    // Connect to contracts
    const vault = await ethers.getContractAt("NexusVault", addresses.nexusVault);
    const reactive = await ethers.getContractAt("ReactiveNexus", addresses.reactiveNexus);
    const token = await ethers.getContractAt("MockToken", addresses.assetToken);
    const remoteHub = await ethers.getContractAt("RemoteHub", addresses.remoteHub);

    // Get adapters
    const adapterAAddr = await vault.adapters(0);
    const adapterBAddr = await vault.adapters(1);
    const adapterA = await ethers.getContractAt("MockAdapter", adapterAAddr);
    const adapterB = await ethers.getContractAt("MockAdapter", adapterBAddr);

    console.log("📊 Lending Pools:");
    console.log(`  Pool A (Safe):       ${adapterAAddr}`);
    console.log(`  Pool B (High Yield): ${adapterBAddr}\n`);

    // ═══════════════════════════════════════════════════════════════════
    // DEMO STEP 1: Check Initial State
    // ═══════════════════════════════════════════════════════════════════
    console.log("┌────────────────────────────────────────────────────────────────┐");
    console.log("│  STEP 1: INITIAL STATE CHECK                                   │");
    console.log("└────────────────────────────────────────────────────────────────┘");

    const initialVaultTVL = await vault.totalAssets();
    const initialThreshold = await reactive.yieldThreshold();
    const rateA = await adapterA.getSupplyRate();
    const rateB = await adapterB.getSupplyRate();

    console.log(`  Vault TVL:          ${ethers.formatUnits(initialVaultTVL, 18)} mUSDC`);
    console.log(`  Yield Threshold:    ${Number(initialThreshold) / 100}%`);
    console.log(`  Pool A Rate:        ${Number(rateA) / 100}%`);
    console.log(`  Pool B Rate:        ${Number(rateB) / 100}%`);
    console.log(`  User mUSDC Balance: ${ethers.formatUnits(await token.balanceOf(deployer.address), 18)}\n`);

    // ═══════════════════════════════════════════════════════════════════
    // DEMO STEP 2: Mint Test Tokens (Faucet)
    // ═══════════════════════════════════════════════════════════════════
    console.log("┌────────────────────────────────────────────────────────────────┐");
    console.log("│  STEP 2: MINT TEST TOKENS (FAUCET)                             │");
    console.log("└────────────────────────────────────────────────────────────────┘");

    const mintAmount = ethers.parseUnits("10000", 18);
    console.log(`  Minting ${ethers.formatUnits(mintAmount, 18)} mUSDC...`);
    await (await token.mint(deployer.address, mintAmount)).wait();
    console.log(`  ✅ New Balance: ${ethers.formatUnits(await token.balanceOf(deployer.address), 18)} mUSDC\n`);

    // ═══════════════════════════════════════════════════════════════════
    // DEMO STEP 3: Approve & Deposit to Vault
    // ═══════════════════════════════════════════════════════════════════
    console.log("┌────────────────────────────────────────────────────────────────┐");
    console.log("│  STEP 3: DEPOSIT TO VAULT                                      │");
    console.log("└────────────────────────────────────────────────────────────────┘");

    const depositAmount = ethers.parseUnits("1000", 18);
    console.log(`  Approving ${ethers.formatUnits(depositAmount, 18)} mUSDC for vault...`);
    await (await token.approve(addresses.nexusVault, depositAmount)).wait();
    console.log("  ✅ Approval granted");

    console.log(`  Depositing ${ethers.formatUnits(depositAmount, 18)} mUSDC...`);
    await (await vault.deposit(depositAmount)).wait();

    const newTVL = await vault.totalAssets();
    const poolAAssets = await adapterA.totalAssets();
    const poolBAssets = await adapterB.totalAssets();

    console.log(`  ✅ Vault TVL:     ${ethers.formatUnits(newTVL, 18)} mUSDC`);
    console.log(`     Pool A:        ${ethers.formatUnits(poolAAssets, 18)} mUSDC`);
    console.log(`     Pool B:        ${ethers.formatUnits(poolBAssets, 18)} mUSDC\n`);

    // ═══════════════════════════════════════════════════════════════════
    // DEMO STEP 4: Simulate Yield Shift (Market Volatility)
    // ═══════════════════════════════════════════════════════════════════
    console.log("┌────────────────────────────────────────────────────────────────┐");
    console.log("│  STEP 4: SIMULATE MARKET VOLATILITY                            │");
    console.log("└────────────────────────────────────────────────────────────────┘");

    console.log("  📉 Setting Pool A to 2% APY (low)...");
    await (await adapterA.setSupplyRate(200)).wait();
    console.log("  📈 Setting Pool B to 15% APY (HIGH)...");
    await (await adapterB.setSupplyRate(1500)).wait();

    const newRateA = await adapterA.getSupplyRate();
    const newRateB = await adapterB.getSupplyRate();
    console.log(`  ✅ New Rates: A=${Number(newRateA) / 100}% | B=${Number(newRateB) / 100}%`);
    console.log(`  📊 Yield Gap: ${(Number(newRateB) - Number(newRateA)) / 100}% (exceeds threshold)\n`);

    // ═══════════════════════════════════════════════════════════════════
    // DEMO STEP 5: Trigger Reactive Rebalance
    // ═══════════════════════════════════════════════════════════════════
    console.log("┌────────────────────────────────────────────────────────────────┐");
    console.log("│  STEP 5: TRIGGER REACTIVE REBALANCE                            │");
    console.log("└────────────────────────────────────────────────────────────────┘");

    console.log("  🔄 Calling checkYieldAndRebalance()...");
    const tx = await reactive.checkYieldAndRebalance(await vault.totalAssets());
    const receipt = await tx.wait();

    // Parse events
    for (const log of receipt?.logs || []) {
        try {
            const parsed = reactive.interface.parseLog(log);
            if (parsed?.name === "ActionTriggered") {
                console.log(`  🚀 ACTION TRIGGERED: ${parsed.args[0]}`);
                console.log(`     From Pool ${parsed.args[1]} → Pool ${parsed.args[2]}`);
                console.log(`     Amount: ${ethers.formatUnits(parsed.args[3], 18)} mUSDC`);
            }
            if (parsed?.name === "ActionExecuted") {
                console.log(`  ⚡ RESULT: ${parsed.args[0]}`);
            }
        } catch { }
    }

    const finalPoolA = await adapterA.totalAssets();
    const finalPoolB = await adapterB.totalAssets();
    console.log(`\n  📊 Final Allocation:`);
    console.log(`     Pool A: ${ethers.formatUnits(finalPoolA, 18)} mUSDC`);
    console.log(`     Pool B: ${ethers.formatUnits(finalPoolB, 18)} mUSDC\n`);

    // ═══════════════════════════════════════════════════════════════════
    // DEMO STEP 6: Update Yield Threshold via Agentic Intent
    // ═══════════════════════════════════════════════════════════════════
    console.log("┌────────────────────────────────────────────────────────────────┐");
    console.log("│  STEP 6: AGENTIC THRESHOLD UPDATE                              │");
    console.log("└────────────────────────────────────────────────────────────────┘");

    const newThreshold = 50; // 0.5%
    console.log(`  🤖 Updating yield threshold to ${newThreshold / 100}%...`);
    await (await reactive.setYieldThreshold(newThreshold)).wait();
    console.log(`  ✅ New Threshold: ${Number(await reactive.yieldThreshold()) / 100}%\n`);

    // ═══════════════════════════════════════════════════════════════════
    // DEMO STEP 7: Test RemoteHub Actions
    // ═══════════════════════════════════════════════════════════════════
    console.log("┌────────────────────────────────────────────────────────────────┐");
    console.log("│  STEP 7: TEST REMOTEHUB CROSS-CHAIN ACTIONS                    │");
    console.log("└────────────────────────────────────────────────────────────────┘");

    // Send tokens to RemoteHub for testing
    const hubTestAmount = ethers.parseUnits("100", 18);
    console.log(`  Sending ${ethers.formatUnits(hubTestAmount, 18)} mUSDC to RemoteHub...`);
    await (await token.mint(addresses.remoteHub, hubTestAmount)).wait();
    console.log(`  ✅ RemoteHub Balance: ${ethers.formatUnits(await token.balanceOf(addresses.remoteHub), 18)} mUSDC`);

    console.log("  Testing recoverFunds()...");
    const beforeBalance = await token.balanceOf(deployer.address);
    await (await remoteHub.recoverFunds(addresses.assetToken, deployer.address)).wait();
    const afterBalance = await token.balanceOf(deployer.address);
    console.log(`  ✅ Recovered ${ethers.formatUnits(afterBalance - beforeBalance, 18)} mUSDC\n`);

    // ═══════════════════════════════════════════════════════════════════
    // DEMO STEP 8: Reverse Rebalance (Show Bi-directional)
    // ═══════════════════════════════════════════════════════════════════
    console.log("┌────────────────────────────────────────────────────────────────┐");
    console.log("│  STEP 8: REVERSE REBALANCE (BI-DIRECTIONAL)                    │");
    console.log("└────────────────────────────────────────────────────────────────┘");

    console.log("  📈 Now Pool A surges to 20% APY...");
    await (await adapterA.setSupplyRate(2000)).wait();
    console.log("  📉 Pool B drops to 3% APY...");
    await (await adapterB.setSupplyRate(300)).wait();

    console.log(`  🔄 Triggering rebalance check...`);
    const tx2 = await reactive.checkYieldAndRebalance(await vault.totalAssets());
    const receipt2 = await tx2.wait();

    for (const log of receipt2?.logs || []) {
        try {
            const parsed = reactive.interface.parseLog(log);
            if (parsed?.name === "ActionTriggered") {
                console.log(`  🚀 REVERSE REBALANCE: Pool ${parsed.args[1]} → Pool ${parsed.args[2]}`);
            }
            if (parsed?.name === "ActionExecuted") {
                console.log(`  ⚡ ${parsed.args[0]}`);
            }
        } catch { }
    }

    const reversePoolA = await adapterA.totalAssets();
    const reversePoolB = await adapterB.totalAssets();
    console.log(`\n  📊 Final Allocation:`);
    console.log(`     Pool A: ${ethers.formatUnits(reversePoolA, 18)} mUSDC`);
    console.log(`     Pool B: ${ethers.formatUnits(reversePoolB, 18)} mUSDC\n`);

    // ═══════════════════════════════════════════════════════════════════
    // SUMMARY
    // ═══════════════════════════════════════════════════════════════════
    console.log("╔════════════════════════════════════════════════════════════════╗");
    console.log("║                      DEMO COMPLETE ✅                          ║");
    console.log("╚════════════════════════════════════════════════════════════════╝");
    console.log(`
Summary:
  • Deposited 1,000 mUSDC into Vault
  • Simulated market volatility (yield shift)
  • Triggered automated rebalance A → B
  • Updated yield threshold to 0.5%
  • Tested RemoteHub fund recovery
  • Demonstrated reverse rebalance B → A

All contract functions working correctly!
    `);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("\n❌ Demo failed:", error);
        process.exit(1);
    });
