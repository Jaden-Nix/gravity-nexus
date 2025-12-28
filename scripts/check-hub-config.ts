import { ethers } from "hardhat";

async function main() {
    const HUB = "0xbB47EfeE770216222f1A97c0C2bb83B43F91F759";
    const hub = await ethers.getContractAt("RemoteHub", HUB);

    const reactiveNetwork = await hub.reactiveNetwork();
    const vault = await hub.vault();
    const owner = await hub.owner();

    console.log("RemoteHub Config:");
    console.log("  Address:", HUB);
    console.log("  Reactive Network:", reactiveNetwork);
    console.log("  Vault:", vault);
    console.log("  Owner:", owner);
}

main().catch(console.error);
