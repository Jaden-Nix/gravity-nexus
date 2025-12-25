import { ethers } from "ethers";

const RPC = "https://ethereum-sepolia-rpc.publicnode.com";
const VAULT = "0x07A9ac70429D177126CAd0D3bC07C4c4f0b461d3";
const USER = "0x9Fa915353AA1e8f955f76D3a39497B8f1F38a273";

async function main() {
    const provider = new ethers.JsonRpcProvider(RPC);
    const vault = new ethers.Contract(VAULT, ["function asset() view returns (address)"], provider);

    const assetAddr = await vault.asset();
    console.log("Vault Asset Address:", assetAddr);

    const token = new ethers.Contract(assetAddr, [
        "function allowance(address, address) view returns (uint256)",
        "function balanceOf(address) view returns (uint256)",
        "function symbol() view returns (string)"
    ], provider);

    const [allowance, balance, symbol] = await Promise.all([
        token.allowance(USER, VAULT),
        token.balanceOf(USER),
        token.symbol()
    ]);

    console.log(`Token: ${symbol} (${assetAddr})`);
    console.log(`User Balance: ${ethers.formatUnits(balance, 18)}`);
    console.log(`Vault Allowance: ${ethers.formatUnits(allowance, 18)}`);
}

main().catch(console.error);
