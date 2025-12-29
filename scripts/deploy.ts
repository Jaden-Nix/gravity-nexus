import { ethers } from "hardhat";

async function main() {
    console.log("Starting deployment...");

    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);

    // 1. Deploy Mock Token (Asset for Vault)
    console.log("Deploying MockToken...");
    const MockToken = await ethers.getContractFactory("MockToken");
    const token = await MockToken.deploy({ gasPrice: ethers.parseUnits("1.5", "gwei"), gasLimit: 2000000 });
    await token.waitForDeployment();
    const tokenAddress = await token.getAddress();
    console.log("MockToken deployed to:", tokenAddress);

    // 2. Deploy NexusVault
    console.log("Deploying NexusVault...");
    const NexusVault = await ethers.getContractFactory("NexusVault");
    const vault = await NexusVault.deploy(tokenAddress, { gasPrice: ethers.parseUnits("1.5", "gwei"), gasLimit: 3000000 });
    await vault.waitForDeployment();
    const vaultAddress = await vault.getAddress();
    console.log("NexusVault deployed to:", vaultAddress);

    // 3. Deploy Mock Adapters (Pools)
    console.log("Deploying Adapters...");
    const MockAdapter = await ethers.getContractFactory("MockAdapter");

    // Pool A: 5% APY
    const adapterA = await MockAdapter.deploy(tokenAddress, 500, { gasPrice: ethers.parseUnits("1.5", "gwei"), gasLimit: 2000000 });
    await adapterA.waitForDeployment();
    const adapterAAddress = await adapterA.getAddress();
    console.log("Adapter A (Safe) deployed to:", adapterAAddress);

    // Pool B: 10% APY
    const adapterB = await MockAdapter.deploy(tokenAddress, 1000, { gasPrice: ethers.parseUnits("1.5", "gwei"), gasLimit: 2000000 });
    await adapterB.waitForDeployment();
    const adapterBAddress = await adapterB.getAddress();
    console.log("Adapter B (High Yield) deployed to:", adapterBAddress);

    // 4. Add Adapters to Vault
    console.log("Adding adapters to vault...");
    await (await vault.addAdapter(adapterAAddress, { gasPrice: ethers.parseUnits("1.5", "gwei"), gasLimit: 500000 })).wait();
    await (await vault.addAdapter(adapterBAddress, { gasPrice: ethers.parseUnits("1.5", "gwei"), gasLimit: 500000 })).wait();
    console.log("Adapters added.");

    // 5. Deploy ReactiveNexus
    console.log("Deploying ReactiveNexus...");
    const ReactiveNexus = await ethers.getContractFactory("ReactiveNexus");
    const reactiveNexus = await ReactiveNexus.deploy({ gasPrice: ethers.parseUnits("1.5", "gwei"), gasLimit: 3000000 });
    await reactiveNexus.waitForDeployment();
    const reactiveNexusAddress = await reactiveNexus.getAddress();
    console.log("ReactiveNexus deployed to:", reactiveNexusAddress);

    // 6. Deploy RemoteHub
    console.log("Deploying RemoteHub...");
    const RemoteHub = await ethers.getContractFactory("RemoteHub");
    const remoteHub = await RemoteHub.deploy({ gasPrice: ethers.parseUnits("1.5", "gwei"), gasLimit: 3000000 });
    await remoteHub.waitForDeployment();
    const remoteHubAddress = await remoteHub.getAddress();
    console.log("RemoteHub deployed to:", remoteHubAddress);

    // 7. Deploy ML Components
    console.log("Deploying AI components...");
    const MLModel = await ethers.getContractFactory("MLModel");
    const mlModel = await MLModel.deploy("yield-lstm-v1", ethers.keccak256(ethers.toUtf8Bytes("model-weights")), { gasPrice: ethers.parseUnits("1.5", "gwei"), gasLimit: 2000000 });
    await mlModel.waitForDeployment();
    const mlModelAddress = await mlModel.getAddress();
    console.log("MLModel deployed to:", mlModelAddress);

    const ZKMLVerifier = await ethers.getContractFactory("ZKMLVerifier");
    const verifier = await ZKMLVerifier.deploy({ gasPrice: ethers.parseUnits("1.5", "gwei"), gasLimit: 2000000 });
    await verifier.waitForDeployment();
    const verifierAddress = await verifier.getAddress();
    console.log("ZKMLVerifier deployed to:", verifierAddress);

    // 8. Setup Relationships
    console.log("Linking ReactiveNexus and Vault...");
    await (await reactiveNexus.setVault(vaultAddress, { gasPrice: ethers.parseUnits("1.5", "gwei"), gasLimit: 500000 })).wait();

    // Transfer Vault ownership to ReactiveNexus to allow automation
    await (await vault.transferOwnership(reactiveNexusAddress, { gasPrice: ethers.parseUnits("1.5", "gwei"), gasLimit: 500000 })).wait();
    console.log("NexusVault ownership transferred to ReactiveNexus.");

    // 9. Auto-sync frontend and simulation scripts
    const fs = require("fs");
    const path = require("path");

    console.log("\nSyncing addresses to frontend and simulation...");

    // Update frontend/contracts.js
    const contractsJsPath = path.join(__dirname, "..", "frontend", "contracts.js");
    let contractsJs = fs.readFileSync(contractsJsPath, "utf8");

    // Replace localhost section
    const localhostRegex = /localhost: \{[\s\S]*?\n    \}/g;
    const newLocalhost = `localhost: {
        remoteHub: "${remoteHubAddress}",
        nexusVault: "${vaultAddress}",
        reactiveNexus: "${reactiveNexusAddress}",
        mlModel: "${mlModelAddress}",
        zkmlVerifier: "${verifierAddress}",
        assetToken: "${tokenAddress}"
    }`;
    contractsJs = contractsJs.replace(localhostRegex, newLocalhost);

    // Also update kopli section
    const kopliRegex = /kopli: \{[\s\S]*?\n    \}/g;
    const newKopli = `kopli: {
        remoteHub: "${remoteHubAddress}",
        nexusVault: "${vaultAddress}",
        reactiveNexus: "${reactiveNexusAddress}",
        mlModel: "${mlModelAddress}",
        zkmlVerifier: "${verifierAddress}",
        assetToken: "${tokenAddress}"
    }`;
    contractsJs = contractsJs.replace(kopliRegex, newKopli);

    // Also update sepolia section
    const sepoliaRegex = /sepolia: \{[\s\S]*?\n    \}/g;
    const newSepolia = `sepolia: {
        remoteHub: "${remoteHubAddress}",
        nexusVault: "${vaultAddress}",
        reactiveNexus: "${reactiveNexusAddress}",
        mlModel: "${mlModelAddress}",
        zkmlVerifier: "${verifierAddress}",
        assetToken: "${tokenAddress}"
    }`;
    contractsJs = contractsJs.replace(sepoliaRegex, newSepolia);

    fs.writeFileSync(contractsJsPath, contractsJs);
    console.log("✓ frontend/contracts.js updated.");

    // Update scripts/simulate-automation.ts
    const simScriptPath = path.join(__dirname, "simulate-automation.ts");
    let simScript = fs.readFileSync(simScriptPath, "utf8");

    simScript = simScript.replace(/const vaultAddress = "0x.*?";/, `const vaultAddress = "${vaultAddress}";`);
    simScript = simScript.replace(/const reactiveAddress = "0x.*?";/, `const reactiveAddress = "${reactiveNexusAddress}";`);

    // Fix the function name bug (setRate -> simulateRateChange)
    simScript = simScript.replace(/\.setRate\(/g, ".simulateRateChange(");

    fs.writeFileSync(simScriptPath, simScript);
    console.log("✓ scripts/simulate-automation.ts updated.");

    console.log("\nDeployment complete!");
    console.log("-------------------");
    console.log("Contracts Summary:");
    console.log("Asset Token:   ", tokenAddress);
    console.log("NexusVault:    ", vaultAddress);
    console.log("Adapter A:     ", adapterAAddress);
    console.log("Adapter B:     ", adapterBAddress);
    console.log("ReactiveNexus: ", reactiveNexusAddress);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
