import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Redeploying for Autonomous Rebalancing...");
    console.log("Account:", deployer.address);

    const assetAddr = ethers.getAddress("0x227A7912a1CF41A4A85b5f1CF9b13F0a35E13282".toLowerCase());
    const adapterA = ethers.getAddress("0x6e9034F419478dBf840776Cc57849D65BD794785".toLowerCase());
    const adapterB = ethers.getAddress("0x16b09320Be9308D67e6c1f078D0b7cEBe99218D1".toLowerCase());
    const reactiveRelayer = ethers.getAddress("0x14947e1F03905307169fa47d159749216d1d30B7".toLowerCase());

    // 1. Vault
    console.log("1. Deploying NexusVault...");
    const NexusVault = await ethers.getContractFactory("NexusVault");
    const vault = await NexusVault.deploy(assetAddr);
    await vault.waitForDeployment();
    const vaultAddr = await vault.getAddress();
    console.log("   Vault:", vaultAddr);

    // 2. Adapters
    console.log("2. Adding Adapters...");
    await (await vault.addAdapter(adapterA)).wait();
    await (await vault.addAdapter(adapterB)).wait();

    // 3. Hub
    console.log("3. Deploying RemoteHub...");
    const RemoteHub = await ethers.getContractFactory("RemoteHub");
    const hub = await RemoteHub.deploy();
    await hub.waitForDeployment();
    const hubAddr = await hub.getAddress();
    console.log("   Hub:", hubAddr);

    // 4. Link & Authorize
    console.log("4. Linking & Authorizing...");
    await (await vault.setHub(hubAddr)).wait();
    console.log("   Hub linked to Vault.");
    await (await hub.setVault(vaultAddr)).wait();
    console.log("   Vault linked to Hub.");
    await (await hub.setReactiveNetwork(reactiveRelayer)).wait();
    console.log("   Reactive Relayer authorized in Hub.");

    // 5. Update Configs
    console.log("5. Updating Config Files...");

    // Update contracts.js
    const contractsPath = path.join(process.cwd(), "frontend", "contracts.js");
    let contracts = fs.readFileSync(contractsPath, "utf8");

    // Replace in CHAIN_CONFIG.sepolia
    const chainConfigRegex = /sepolia: \{[\s\S]*?remoteHub: "0x.*?",[\s\S]*?nexusVault: "0x.*?"[\s\S]*?\}/;
    const newChainConfig = `sepolia: {
        chainId: '0xaa36a7',
        chainName: 'Ethereum Sepolia',
        rpcUrls: ['https://rpc.ankr.com/eth_sepolia'],
        nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
        remoteHub: "${hubAddr}",
        nexusVault: "${vaultAddr}",
        reactiveNexus: "0xd358be542bb239890E758Ee6f2bB7e7795d0c0Da",
        mlModel: "0x82701705Ca21045995a4A1a0B5d4482b3bCffde2",
        zkmlVerifier: "0x9296FA3bFb87B6067549d7b11584967D90F34Cd7",
        assetToken: "${assetAddr}"
    }`;
    contracts = contracts.replace(chainConfigRegex, newChainConfig);

    // Replace in CONTRACT_ADDRESSES.sepolia
    const contractAddrRegex = /sepolia: \{[\s\S]*?remoteHub: "0x.*?",[\s\S]*?nexusVault: "0x.*?"[\s\S]*?\}/g;
    const newContractAddr = `sepolia: {
        remoteHub: "${hubAddr}",
        nexusVault: "${vaultAddr}",
        reactiveNexus: "0xd358be542bb239890E758Ee6f2bB7e7795d0c0Da",
        mlModel: "0x82701705Ca21045995a4A1a0B5d4482b3bCffde2",
        zkmlVerifier: "0x9296FA3bFb87B6067549d7b11584967D90F34Cd7",
        assetToken: "${assetAddr}"
    }`;
    contracts = contracts.replace(contractAddrRegex, newContractAddr);

    fs.writeFileSync(contractsPath, contracts);
    console.log("   frontend/contracts.js updated.");

    // Update simulate-automation.ts
    const simPath = path.join(process.cwd(), "scripts", "simulate-automation.ts");
    let sim = fs.readFileSync(simPath, "utf8");
    sim = sim.replace(/vault: "0x.*?"/, `vault: "${vaultAddr}"`);
    fs.writeFileSync(simPath, sim);
    console.log("   scripts/simulate-automation.ts updated.");

    console.log("\nDeployment successful! 🚀");
}

main().catch(console.error);
