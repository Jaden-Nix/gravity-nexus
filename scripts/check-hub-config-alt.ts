import { ethers } from "hardhat";

async function main() {
    const hubAddress = "0x0236A17a010c9262af2697E59A0cbce6da218D1d";
    const hub = await ethers.getContractAt("RemoteHub", hubAddress);

    try {
        const reactiveNetwork = await hub.reactiveNetwork();
        const vault = await hub.vault();
        const owner = await hub.owner();

        console.log("RemoteHub (Alt) Config:");
        console.log("  Address:", hubAddress);
        console.log("  Reactive Network:", reactiveNetwork);
        console.log("  Vault:", vault);
        console.log("  Owner:", owner);
    } catch (e) {
        console.log("Contract not found or not a RemoteHub at this address on this network.");
    }
}

main().catch(console.error);
