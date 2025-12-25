import "dotenv/config";
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-ethers";

const config: HardhatUserConfig = {
    solidity: "0.8.24",
    networks: {
        sepolia: {
            url: process.env.SEPOLIA_RPC_URL || "https://rpc.sepolia.org",
            accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
            timeout: 600000, // 10 minutes
        },
        arbitrumSepolia: {
            url: process.env.ARBITRUM_SEPOLIA_RPC_URL || "https://sepolia-rollup.arbitrum.io/rpc",
            accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
        },
        optimismSepolia: {
            url: process.env.OPTIMISM_SEPOLIA_RPC_URL || "https://sepolia.optimism.io",
            accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
        },
        kopli: {
            url: process.env.KOPLI_RPC_URL || "https://kopli-rpc.rnk.dev",
            accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
            chainId: 5318008,
        },
        lasna: {
            url: "https://lasna-rpc.rnk.dev/",
            accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
            chainId: 5318007,
        },
    },
    /*
        etherscan: {
            apiKey: process.env.ETHERSCAN_API_KEY,
        },
    */
};

export default config;
