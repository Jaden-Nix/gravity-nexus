import { ethers } from "hardhat";

async function main() {
    const remoteHubAddr = "0xF4E960e816695ed37ca0b0CAbbbabe92461afBF1";
    const reactiveAddr = "0x5062E2a55548a603Fdaf83a424aBFE00cE2f45D2";

    console.log("RemoteHub Address:", remoteHubAddr);
    console.log("Reactive Address:", reactiveAddr);

    try {
        const hub = await ethers.getContractAt("RemoteHub", remoteHubAddr);
        console.log("Contract object obtained.");

        console.log("Sending transaction...");
        const tx = await hub.setReactiveNetwork(reactiveAddr);
        console.log("Transaction sent:", tx.hash);

        const receipt = await tx.wait();
        console.log("Transaction confirmed in block:", receipt.blockNumber);
        console.log("✅ Success!");
    } catch (e: any) {
        console.error("❌ Failed!");
        console.error("Error Message:", e.message);
        if (e.code) console.error("Error Code:", e.code);
        if (e.argument) console.error("Error Argument:", e.argument);
        if (e.value) console.error("Error Value:", e.value);
    }
}

main().catch(console.error);
