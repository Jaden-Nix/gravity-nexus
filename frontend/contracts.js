// Contract ABIs and Addresses for Nexus Galaxy
// Unified configuration for demo consistency

const CHAIN_CONFIG = {
    sepolia: {
        chainId: '0xaa36a7',
        chainName: 'Ethereum Sepolia',
        rpcUrls: ['https://eth-sepolia.g.alchemy.com/v2/U8EFwS5DhuAefGym1cNcQ'],
        nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
        remoteHub: "0x5E1B04116a8F3cBf57b35CCdc42F96115Ca3Ee69",
        nexusVault: "0xB7cd5b44Fcd3646ec08954Ecc6FDe43f334dF18f",
        reactiveNexus: "0x11c2813851B649382cC72A64Ebcd0958467B705B",
        mlModel: "0x8429D458ccECA475AC28Aa29846344603e231E43",
        zkmlVerifier: "0xD29Da591e7447B7321695488EfE983486FFb82c0",
        assetToken: "0x828c06dE0F2D60E2ce726bb99a6572b88f4BdE53",
        blockExplorerUrls: ['https://sepolia.etherscan.io']
    },
    localhost: {
        chainId: '0x7a69',
        chainName: 'Localhost 8545',
        rpcUrls: ['http://127.0.0.1:8545'],
        nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 }
    }
};

const CONTRACT_ADDRESSES = {
    localhost: {
        remoteHub: "0x322813Fd9A801c5507c9de605d63CEA4f2CE6c44",
        nexusVault: "0x0B306BF915C4d645ff596e518fAf3F9669b97016",
        reactiveNexus: "0x4ed7c70F96B99c776995fB64377f0d4aB3B0e1C1",
        mlModel: "0xa85233C63b9Ee964Add6F2cffe00Fd84eb32338f",
        zkmlVerifier: "0x4A679253410272dd5232B3Ff7cF5dbB88f295319",
        assetToken: "0x9A676e781A523b5d0C0e43731313A708CB607508"
    },
    sepolia: {
        remoteHub: "0x5E1B04116a8F3cBf57b35CCdc42F96115Ca3Ee69",
        nexusVault: "0xB7cd5b44Fcd3646ec08954Ecc6FDe43f334dF18f",
        reactiveNexus: "0x11c2813851B649382cC72A64Ebcd0958467B705B",
        mlModel: "0x8429D458ccECA475AC28Aa29846344603e231E43",
        zkmlVerifier: "0xD29Da591e7447B7321695488EfE983486FFb82c0",
        assetToken: "0x828c06dE0F2D60E2ce726bb99a6572b88f4BdE53"
    },
    lasna: {
        reactiveContract: "0x760FBf81b2FE506dEc35dA1385E65C79A8fD12FB",
        blockExplorerUrls: ['https://lasna.reactives.network']
    }
};

const ABIS = {
    ReactiveNexus: [
        "function nexusVault() view returns (address)",
        "function yieldThreshold() view returns (uint256)",
        "function checkYieldAndRebalance(uint256 amountToMove)",
        "function setVault(address _vault)",
        "function setYieldThreshold(uint256 _threshold)",
        "function setAuthorization(address _caller, bool _status)",
        "function authorizedCallers(address) view returns (bool)",
        "event ActionTriggered(string action, uint256 fromIdx, uint256 toIdx, uint256 amount)",
        "event ActionExecuted(string result)",
        "event YieldThresholdUpdated(uint256 newThreshold)",
        "event AuthorizationUpdated(address indexed caller, bool status)"
    ],
    NexusVault: [
        "function asset() view returns (address)",
        "function totalAssets() view returns (uint256)",
        "function deposit(uint256 amount)",
        "function withdraw(uint256 amount)",
        "function rebalance(uint256 fromIdx, uint256 toIdx, uint256 amount)",
        "function adapters(uint256) view returns (address)",
        "function getAdaptersCount() view returns (uint256)",
        "function transferOwnership(address newOwner)",
        "function checkYieldAndRebalance()",
        "function pause()",
        "function unpause()",
        "function paused() view returns (bool)",
        "function setAuthorization(address _caller, bool _status)",
        "function authorizedCallers(address) view returns (bool)",
        "function yieldThresholdBps() view returns (uint256)",
        "function setYieldThreshold(uint256 _thresholdBps)",
        "function addAdapter(address _adapter)",
        "event Rebalanced(uint256 indexed fromIdx, uint256 indexed toIdx, uint256 amount)",
        "event AdapterAdded(address indexed adapter, uint256 index)",
        "event EmergencyPaused(address indexed by)",
        "event EmergencyUnpaused(address indexed by)",
        "event AuthorizationUpdated(address indexed caller, bool status)",
        "event ThresholdUpdated(uint256 newThreshold)"
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
        "function modelHash() view returns (bytes32)",
        "function lastUpdated() view returns (uint256)",
        "function getModelInfo() view returns (string, bytes32, uint256)",
        "function updateModel(string memory _newModelId, bytes32 _newModelHash)",
        "event ModelUpdated(string indexed newModelId, bytes32 newModelHash, uint256 timestamp)"
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
