// Contract ABIs and Addresses for Nexus Galaxy
// Unified configuration for demo consistency

const CHAIN_CONFIG = {
    sepolia: {
        chainId: '0xaa36a7',
        chainName: 'Ethereum Sepolia',
        rpcUrls: ['https://rpc.ankr.com/eth_sepolia'],
        nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
        remoteHub: "0x448688AD41C79D5E6c649B5BF3A12e68E4528707",
        nexusVault: "0xaF4e198830f24B000D14A682f9c537D54fd76e49",
        reactiveNexus: "0x11c2813851B649382cC72A64Ebcd0958467B705B",
        mlModel: "0x8429D458ccECA475AC28Aa29846344603e231E43",
        zkmlVerifier: "0xD29Da591e7447B7321695488EfE983486FFb82c0",
        assetToken: "0x828c06dE0F2D60E2ce726bb99a6572b88f4BdE53"
    },
    arbitrum: {
        chainId: '0x66eee',
        chainName: 'Arbitrum Sepolia',
        rpcUrls: ['https://sepolia-rollup.arbitrum.io/rpc'],
        nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 }
    },
    localhost: {
        chainId: '0x7a69',
        chainName: 'Localhost 8545',
        rpcUrls: ['http://127.0.0.1:8545'],
        nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
        remoteHub: "0x0236A17a010c9262af2697E59A0cbce6da218D1d",
        nexusVault: "0x1cE3FD7dBAA3d41B692340C8c9181be99D3011b8",
        reactiveNexus: "0xd358be542bb239890E758Ee6f2bB7e7795d0c0Da",
        mlModel: "0x82701705Ca21045995a4A1a0B5d4482b3bCffde2",
        zkmlVerifier: "0x9296FA3bFb87B6067549d7b11584967D90F34Cd7",
        assetToken: "0x227A7912a1CF41A4A85b5f1CF9b13F0a35E13282"
    },
    lasna: {
        chainId: '0x512577',
        chainName: 'Reactive Lasna',
        rpcUrls: ['https://lasna-rpc.rnk.dev'],
        nativeCurrency: { name: 'REACT', symbol: 'REACT', decimals: 18 }
    }
};

const CONTRACT_ADDRESSES = {
    // Latest Localhost Deployment (Turn 1272)
    localhost: {
        remoteHub: "0x0236A17a010c9262af2697E59A0cbce6da218D1d",
        nexusVault: "0x1cE3FD7dBAA3d41B692340C8c9181be99D3011b8",
        reactiveNexus: "0xd358be542bb239890E758Ee6f2bB7e7795d0c0Da",
        mlModel: "0x82701705Ca21045995a4A1a0B5d4482b3bCffde2",
        zkmlVerifier: "0x9296FA3bFb87B6067549d7b11584967D90F34Cd7",
        assetToken: "0x227A7912a1CF41A4A85b5f1CF9b13F0a35E13282"
    },
    // Ethereum Sepolia - Deployed
    sepolia: {
        remoteHub: "0x448688AD41C79D5E6c649B5BF3A12e68E4528707",
        nexusVault: "0xaF4e198830f24B000D14A682f9c537D54fd76e49",
        reactiveNexus: "0x11c2813851B649382cC72A64Ebcd0958467B705B",
        mlModel: "0x8429D458ccECA475AC28Aa29846344603e231E43",
        zkmlVerifier: "0xD29Da591e7447B7321695488EfE983486FFb82c0",
        assetToken: "0x828c06dE0F2D60E2ce726bb99a6572b88f4BdE53"
    },
    // Arbitrum Sepolia - Deployed
    arbitrum: {
        remoteHub: "0x9Fd448E930cE937d8dDCdF6e4F5bE8B9C6aF3581",
        nexusVault: "0x88CbFB989b9D87E94Bf94801dd92Ac770deC36Fe",
        reactiveNexus: "0x7d6a70f8303385D182ABAd16a8159B6A27FE6B25",
        mlModel: "0x850874fD813Ac1B5d21989b25A639950c68cD940",
        zkmlVerifier: "0xB9b6645ca21f4D4ECB86F0a7064E34DF2f71B51C",
        assetToken: "0xc0c9F3ff25517E7fF83d8be747F544c8595ADEDB"
    },
    lasna: {
        reactiveContract: "0x760FBf81b2FE506dEc35dA1385E65C79A8fD12FB"
    }
};

const ABIS = {
    ReactiveNexus: [
        "function nexusVault() view returns (address)",
        "function yieldThreshold() view returns (uint256)",
        "function checkYieldAndRebalance(uint256 amountToMove)",
        "function setVault(address _vault)",
        "function setYieldThreshold(uint256 _threshold)",
        "event ActionTriggered(string action, uint256 fromIdx, uint256 toIdx, uint256 amount)",
        "event ActionExecuted(string result)",
        "event YieldThresholdUpdated(uint256 newThreshold)"
    ],
    NexusVault: [
        "function asset() view returns (address)",
        "function totalAssets() view returns (uint256)",
        "function deposit(uint256 amount)",
        "function rebalance(uint256 fromIdx, uint256 toIdx, uint256 amount)",
        "function adapters(uint256) view returns (address)",
        "function getAdaptersCount() view returns (uint256)",
        "function transferOwnership(address newOwner)",
        "function checkYieldAndRebalance()",
        "event Rebalanced(uint256 fromIdx, uint256 toIdx, uint256 amount)",
        "event AdapterAdded(address indexed adapter)"
    ],
    LendingAdapter: [
        "function getSupplyRate() view returns (uint256)",
        "function totalAssets() view returns (uint256)",
        "function asset() view returns (address)"
    ],
    IERC20: [
        "function name() view returns (string)",
        "function symbol() view returns (string)",
        "function decimals() view returns (uint8)",
        "function totalSupply() view returns (uint256)",
        "function balanceOf(address owner) view returns (uint256)",
        "function allowance(address owner, address spender) view returns (uint256)",
        "function approve(address spender, uint256 amount) returns (bool)",
        "function transfer(address to, uint256 amount) returns (bool)",
        "function transferFrom(address from, address to, uint256 amount) returns (bool)",
        "function mint(address to, uint256 amount) external"
    ],
    MLModel: [
        "function modelId() view returns (string)",
        "function modelHash() view returns (bytes32)"
    ],
    ZKMLVerifier: [
        "function verify(bytes calldata proof, bytes calldata instances, bytes calldata output) pure returns (bool)"
    ]
};

window.CHAIN_CONFIG = CHAIN_CONFIG;
window.CONTRACT_ADDRESSES = CONTRACT_ADDRESSES;
window.ABIS = ABIS;
const PRICE_FEED_ABI = [
    "function latestRoundData() view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)",
    "function decimals() view returns (uint8)"
];
window.PRICE_FEED_ABI = PRICE_FEED_ABI;
