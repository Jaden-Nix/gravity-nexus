import { ethers } from "ethers";
import "dotenv/config";

async function main() {
    const pk = process.env.PRIVATE_KEY;
    if (!pk) {
        console.log("No private key found in .env");
        return;
    }
    const wallet = new ethers.Wallet(pk);
    console.log("Wallet Address:", wallet.address);
}

main().catch(console.error);
