import { ethers } from "hardhat";

async function main() {
    const newOwner = "0x9Fa915353AA1e8F955f76D3a39497B8f1F38a273";

    console.log("Transferring ownership to:", newOwner);

    const reactive = await ethers.getContractAt("ReactiveNexus", "0xDb38b7773ca8250D6471C15d4A50698d6ff6F7a0");
    console.log("Current ReactiveNexus owner:", await reactive.owner());

    const tx = await reactive.transferOwnership(newOwner);
    console.log("Tx hash:", tx.hash);
    await tx.wait();

    console.log("New owner:", await reactive.owner());
    console.log("✅ Ownership transferred!");
}

main().catch(console.error);
