import { ethers } from "hardhat";

async function main() {
    const userAddress = process.env.USER_ADDRESS;

    if (!userAddress) {
        console.error("Please set USER_ADDRESS environment variable.");
        return;
    }

    const [sender] = await ethers.getSigners();
    console.log(`Sending 10 ETH from ${sender.address} to ${userAddress}...`);

    const tx = await sender.sendTransaction({
        to: userAddress,
        value: ethers.parseEther("10.0")
    });

    await tx.wait();
    console.log("Success! Account funded.");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
