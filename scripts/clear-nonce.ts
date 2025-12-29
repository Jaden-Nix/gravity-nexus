import { ethers } from "hardhat";

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Clearing nonces for:", deployer.address);

    const nonce = await ethers.provider.getTransactionCount(deployer.address);
    const pendingNonce = await ethers.provider.getTransactionCount(deployer.address, "pending");

    console.log("Confirmed Nonce:", nonce);
    console.log("Pending Nonce:", pendingNonce);

    for (let i = nonce; i < pendingNonce; i++) {
        console.log(`Clearing nonce ${i}...`);
        const tx = await deployer.sendTransaction({
            to: deployer.address,
            value: 0,
            nonce: i,
            gasPrice: ethers.parseUnits("150", "gwei"),
            gasLimit: 21000
        });
        console.log(`   TX Sent: ${tx.hash}`);
        await tx.wait();
        console.log(`   ✅ Nonce ${i} cleared!`);
    }
}

main().catch(console.error);
