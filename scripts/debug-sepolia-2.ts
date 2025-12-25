import { ethers } from "ethers";

const RPC = "https://ethereum-sepolia-rpc.publicnode.com";
const VAULT_ADDR = "0x07A9ac70429D177126CAd0D3bC07C4c4f0b461d3";

async function main() {
    const provider = new ethers.JsonRpcProvider(RPC);
    const vault = new ethers.Contract(VAULT_ADDR, ["function asset() view returns (address)"], provider);

    try {
        const assetAddr = await vault.asset();
        console.log("Vault set asset address:", assetAddr);

        const token = new ethers.Contract(assetAddr, [
            "function symbol() view returns (string)",
            "function decimals() view returns (uint8)"
        ], provider);

        const sym = await token.symbol();
        const dec = await token.decimals();
        console.log(`Token Info: ${sym} (${assetAddr}), Decimals: ${dec}`);
    } catch (e) {
        console.error("Error querying vault or token:");
        console.error(e);
    }
}

main();
