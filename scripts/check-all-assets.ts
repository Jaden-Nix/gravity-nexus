import { ethers } from "ethers";

const CHAINS = [
    { name: "Sepolia", rpc: "https://ethereum-sepolia-rpc.publicnode.com", vault: "0x07A9ac70429D177126CAd0D3bC07C4c4f0b461d3" },
    { name: "Arbitrum", rpc: "https://sepolia-rollup.arbitrum.io/rpc", vault: "0x88CbFB989b9D87E94Bf94801dd92Ac770deC36Fe" },
    { name: "Lasna", rpc: "https://lasna-rpc.rnk.dev", vault: "0x413c1ef36db28eD441D87c6ec1f078D0b7cEBe99" }
];

async function main() {
    for (const chain of CHAINS) {
        console.log(`\n--- ${chain.name} ---`);
        try {
            const provider = new ethers.JsonRpcProvider(chain.rpc);
            const vault = new ethers.Contract(chain.vault, ["function asset() view returns (address)"], provider);
            const asset = await vault.asset();
            console.log(`Vault Address: ${chain.vault}`);
            console.log(`On-chain Asset: ${asset}`);
        } catch (e) {
            console.log(`Failed to fetch for ${chain.name}`);
        }
    }
}

main();
