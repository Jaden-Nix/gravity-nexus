import { ethers } from "ethers";

async function main() {
    const RPC = "https://lasna-rpc.rnk.dev";
    const REBALANCER = "0x760FBf81b2FE506dEc35dA1385E65C79A8fD12FB";

    const provider = new ethers.JsonRpcProvider(RPC);
    const rebalancer = new ethers.Contract(REBALANCER, [
        "function owner() view returns (address)",
        "function sepVault() view returns (address)",
        "function sepRemoteHub() view returns (address)"
    ], provider);

    try {
        const [owner, vault, hub] = await Promise.all([
            rebalancer.owner(),
            rebalancer.sepVault(),
            rebalancer.sepRemoteHub()
        ]);
        console.log("Rebalancer Owner on Lasna:", owner);
        console.log("Registered Sepolia Vault:", vault);
        console.log("Registered Sepolia Hub:", hub);
    } catch (e) {
        console.log("Failed to fetch rebalancer config.");
    }
}

main().catch(console.error);
