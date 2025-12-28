import { ethers } from "hardhat";

async function main() {
    const HUB = "0xbB47EfeE770216222f1A97c0C2bb83B43F91F759";
    const RELAYER_LASNA = ethers.getAddress("0x0000000000000000000000000000000000ffffff");

    const hub = await ethers.getContractAt("RemoteHub", HUB);
    console.log("Updating Relayer to:", RELAYER_LASNA);

    const tx = await hub.setReactiveNetwork(RELAYER_LASNA);
    console.log("TX Hash:", tx.hash);
    await tx.wait();
    console.log("✅ Relayer Updated");
}

main().catch(console.error);
