import { ethers } from "ethers";

async function main() {
    const RPC = "https://lasna-rpc.rnk.dev";
    const REBALANCER = "0x760FBf81b2FE506dEc35dA1385E65C79A8fD12FB";

    const provider = new ethers.JsonRpcProvider(RPC);
    const rebalancer = new ethers.Contract(REBALANCER, ["function owner() view returns (address)"], provider);

    try {
        const owner = await rebalancer.owner();
        console.log("Rebalancer Owner on Lasna:", owner);
    } catch (e) {
        console.log("Failed to fetch owner.");
    }
}

main().catch(console.error);
