import { ethers } from "hardhat";

async function main() {
    const remoteHubAddr = "0x0236A17a010c9262af2697E59A0cbce6da218D1d";
    const vaultAddr = "0x1cE3FD7dBAA3d41B692340C8c9181be99D3011b8";

    console.log("Setting vault in RemoteHub...");
    const RemoteHub = await ethers.getContractFactory("RemoteHub");
    const hub = await RemoteHub.attach(remoteHubAddr);

    const tx = await hub.setVault(vaultAddr);
    console.log("Tx sent:", tx.hash);
    await tx.wait();
    console.log("Vault linked to RemoteHub successfully!");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
