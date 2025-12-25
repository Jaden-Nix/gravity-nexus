import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
    console.log("=== FINALIZING LINKS & CONFIGS ===");

    if (!fs.existsSync("deployment-temp.json")) {
        throw new Error("Deployment data missing!");
    }
    const data = JSON.parse(fs.readFileSync("deployment-temp.json", "utf8"));

    // 1. Authorize Lasna Rebalancer in Sepolia Hub
    console.log(`Authorizing Lasna Rebalancer (${data.lasnaRebalancer}) in Sepolia Hub (${data.hub})...`);
    const RemoteHub = await ethers.getContractFactory("RemoteHub");
    const hub = await RemoteHub.attach(data.hub);

    // We need to switch back to Sepolia network context in our heads, 
    // but the script will be run with --network sepolia
    await (await hub.setReactiveNetwork(data.lasnaRebalancer)).wait();
    console.log("✅ Reactive Network authorized.");

    // 2. Sync contracts.js
    console.log("Syncing contracts.js...");
    const contractsPath = path.join(process.cwd(), "frontend", "contracts.js");
    let contracts = fs.readFileSync(contractsPath, "utf8");

    const newSepoliaConfig = `sepolia: {
        chainId: '0xaa36a7',
        chainName: 'Ethereum Sepolia',
        rpcUrls: ['https://rpc.ankr.com/eth_sepolia'],
        nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
        remoteHub: "${data.hub}",
        nexusVault: "${data.vault}",
        reactiveNexus: "${data.reactiveNexus}",
        mlModel: "${data.mlModel}",
        zkmlVerifier: "${data.verifier}",
        assetToken: "${data.token}"
    }`;

    const newSepoliaAddr = `sepolia: {
        remoteHub: "${data.hub}",
        nexusVault: "${data.vault}",
        reactiveNexus: "${data.reactiveNexus}",
        mlModel: "${data.mlModel}",
        zkmlVerifier: "${data.verifier}",
        assetToken: "${data.token}"
    }`;

    // Simple replacement for demo (regex might be cleaner but this is safe)
    contracts = contracts.replace(/sepolia: \{[\s\S]*?chainId: '0xaa36a7'[\s\S]*?\}/, newSepoliaConfig);
    contracts = contracts.replace(/sepolia: \{[\s\S]*?remoteHub: "${data.hub}"[\s\S]*?\}/g, newSepoliaAddr);
    // Wait, the regex above might fail if addresses are already different.

    // Let's use a more robust replacement for CONTRACT_ADDRESSES.sepolia
    const contractAddrStart = contracts.indexOf("sepolia: {", contracts.indexOf("CONTRACT_ADDRESSES"));
    const contractAddrEnd = contracts.indexOf("}", contractAddrStart) + 1;
    contracts = contracts.substring(0, contractAddrStart) + newSepoliaAddr + contracts.substring(contractAddrEnd);

    fs.writeFileSync(contractsPath, contracts);
    console.log("✅ frontend/contracts.js updated.");

    // 3. Sync simulate-automation.ts
    console.log("Syncing simulate-automation.ts...");
    const simPath = path.join(process.cwd(), "scripts", "simulate-automation.ts");
    let sim = fs.readFileSync(simPath, "utf8");
    sim = sim.replace(/vault: "0x.*?"/, `vault: "${data.vault}"`);
    sim = sim.replace(/reactive: "0x.*?"/, `reactive: "${data.reactiveNexus}"`);
    fs.writeFileSync(simPath, sim);
    console.log("✅ scripts/simulate-automation.ts updated.");

    console.log("\n🚀 EVERYTHING IS LIVE AND SYNCED!");
}

main().catch(console.error);
