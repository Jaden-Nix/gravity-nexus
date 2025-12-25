import { ethers } from "hardhat";

async function main() {
    const remoteHubAddr = "0xF4E960e816695ed37ca0b0CAbbbabe92461afBF1";
    const hub = await ethers.getContractAt("RemoteHub", remoteHubAddr);
    const owner = await hub.owner();
    console.log("RemoteHub Owner:", owner);

    const [deployer] = await ethers.getSigners();
    console.log("Current Deployer Account:", deployer.address);

    if (owner.toLowerCase() === deployer.address.toLowerCase()) {
        console.log("Deployer is STILL the owner. Linking should work.");
    } else {
        console.log("Ownership has ALREADY BEEN TRANSFERRED. Linking must be done by the new owner.");
    }
}

main().catch(console.error);
