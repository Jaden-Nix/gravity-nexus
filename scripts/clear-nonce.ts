import { ethers } from "hardhat";

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Clearing nonce for:", deployer.address);

    const nonce = await ethers.provider.getTransactionCount(deployer.address);
    console.log("Current Nonce to clear:", nonce);

    const tx = await deployer.sendTransaction({
        to: deployer.address,
        value: 0,
        nonce: nonce,
        gasPrice: ethers.parseUnits("150", "gwei"), // Very high gas price to force clear
        gasLimit: 21000
    });

    console.log("Cleanup TX Sent:", tx.hash);
    await tx.wait();
    console.log("✅ Nonce cleared!");
}

main().catch(console.error);
