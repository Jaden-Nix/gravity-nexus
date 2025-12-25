import { ethers } from "hardhat";

/**
 * @notice Deploy ReactiveRebalancer to the Reactive Network (Kopli/Lasna)
 * Run with: npx hardhat run scripts/deploy-reactive.ts --network kopli
 */
async function main() {
    console.log("Starting Reactive Contract deployment...");

    const [deployer] = await ethers.getSigners();
    console.log("Deploying with account:", deployer.address);

    // Get addresses from deploy.ts run or from contracts.js
    // For this demo, we'll use the latest Sepolia addresses
    // Correct Sepolia Addresses from contracts.js
    const sepVault = "0xaF4e198830f24B000D14A682f9c537D54fd76e49";
    const sepRemoteHub = "0x448688AD41C79D5E6c649B5BF3A12e68E4528707";

    console.log(`Vault on Sepolia: ${sepVault}`);
    console.log(`RemoteHub on Sepolia: ${sepRemoteHub}`);

    // Deploy ReactiveRebalancer
    const ReactiveRebalancer = await ethers.getContractFactory("ReactiveRebalancer");
    const rebalancer = await ReactiveRebalancer.deploy(sepVault, sepRemoteHub);
    await rebalancer.waitForDeployment();

    const rebalancerAddress = await rebalancer.getAddress();
    console.log("ReactiveRebalancer deployed to:", rebalancerAddress);
    console.log("Network:", (await ethers.provider.getNetwork()).name);

    console.log("\nNext Steps:");
    console.log(`1. Authorized this contract address in RemoteHub on Sepolia:`);
    console.log(`   await remoteHub.setReactiveNetwork("${rebalancerAddress}")`);
    console.log(`2. The Reactive Network will now monitor Vault events and trigger callbacks!`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
