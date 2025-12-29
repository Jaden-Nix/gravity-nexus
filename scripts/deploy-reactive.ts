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
    const sepVault = "0xB7cd5b44Fcd3646ec08954Ecc6FDe43f334dF18f";
    const sepRemoteHub = "0x5E1B04116a8F3cBf57b35CCdc42F96115Ca3Ee69";

    console.log(`Vault on Sepolia: ${sepVault}`);
    console.log(`RemoteHub on Sepolia: ${sepRemoteHub}`);

    // Deploy ReactiveRebalancer with manual gas to fit in balance
    const ReactiveRebalancer = await ethers.getContractFactory("ReactiveRebalancer");
    const rebalancer = await ReactiveRebalancer.deploy(sepVault, sepRemoteHub, {
        gasPrice: ethers.parseUnits("100", "gwei"),
        gasLimit: 800000 // 800k gas
    });
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
