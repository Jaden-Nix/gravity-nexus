import { ethers } from "hardhat";

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deployer Address:", deployer.address);

    const addresses = {
        remoteHub: "0x448688AD41C79D5E6c649B5BF3A12e68E4528707",
        nexusVault: "0xaF4e198830f24B000D14A682f9c537D54fd76e49",
        reactiveNexus: "0x11c2813851B649382cC72A64Ebcd0958467B705B"
    };

    const hub = await ethers.getContractAt("RemoteHub", addresses.remoteHub);
    const vault = await ethers.getContractAt("NexusVault", addresses.nexusVault);
    const reactive = await ethers.getContractAt("ReactiveNexus", addresses.reactiveNexus);

    console.log("Hub Owner:", await hub.owner());
    console.log("Vault Owner:", await vault.owner());
    console.log("Reactive Owner:", await reactive.owner());
}

main().catch(console.error);
