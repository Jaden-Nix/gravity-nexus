import { ethers } from "ethers";

const RPC = "https://ethereum-sepolia-rpc.publicnode.com";
const VAULT_ADDR = "0x07A9ac70429D177126CAd0D3bC07C4c4f0b461d3";
const REACTIVE_ADDR = "0x73ffea1c8Ef127b0e73874C2a243E39Af4daB2B6";

async function main() {
    const provider = new ethers.JsonRpcProvider(RPC);

    const vault = new ethers.Contract(VAULT_ADDR, [
        "function owner() view returns (address)",
        "function getAdaptersCount() view returns (uint256)",
        "function adapters(uint256) view returns (address)"
    ], provider);

    const reactive = new ethers.Contract(REACTIVE_ADDR, [
        "function nexusVault() view returns (address)",
        "function yieldThreshold() view returns (uint256)"
    ], provider);

    try {
        const vaultOwner = await vault.owner();
        const configuredVault = await reactive.nexusVault();
        const threshold = await reactive.yieldThreshold();
        const adapterCount = await vault.getAdaptersCount();

        console.log(`--- Ownership Audit ---`);
        console.log(`Vault Address: ${VAULT_ADDR}`);
        console.log(`Vault Owner:   ${vaultOwner}`);
        console.log(`Reactive Smart Contract: ${REACTIVE_ADDR}`);

        console.log(`\n--- Reactive Config ---`);
        console.log(`Configured Vault: ${configuredVault}`);
        console.log(`Yield Threshold:  ${threshold.toString()}`);
        console.log(`Adapter Count:    ${adapterCount.toString()}`);

        if (vaultOwner.toLowerCase() !== REACTIVE_ADDR.toLowerCase()) {
            console.log(`\n[CRITICAL] Vault owner is NOT the Reactive contract!`);
            console.log(`The Reactive contract cannot call rebalance() unless it is the owner.`);
        } else {
            console.log(`\n[OK] Vault owner is correctly set to Reactive contract.`);
        }

        if (configuredVault.toLowerCase() !== VAULT_ADDR.toLowerCase()) {
            console.log(`\n[CRITICAL] Reactive contract is pointing to the WRONG vault!`);
        } else {
            console.log(`\n[OK] Reactive contract is pointing to the correct vault.`);
        }

        // Check yields of adapters
        console.log(`\n--- Adapter Yields ---`);
        for (let i = 0; i < Number(adapterCount); i++) {
            const adr = await vault.adapters(i);
            const adapter = new ethers.Contract(adr, ["function getSupplyRate() view returns (uint256)", "function totalAssets() view returns (uint256)"], provider);
            const rate = await adapter.getSupplyRate();
            const assets = await adapter.totalAssets();
            console.log(`Adapter ${i} (${adr}): Rate=${rate.toString()}, Assets=${ethers.formatUnits(assets, 18)}`);
        }

    } catch (e) {
        console.error("Audit failed:", e);
    }
}

main();
