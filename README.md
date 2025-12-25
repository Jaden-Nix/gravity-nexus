# 🌌 Gravity Nexus

<div align="center">

**AI-Powered Cross-Chain DeFi Yield Optimization Layer**

*Moving liquidity at the speed of thought, secured by the power of math.*

[![Solidity](https://img.shields.io/badge/Solidity-0.8.24-363636?logo=solidity)](https://soliditylang.org/)
[![Hardhat](https://img.shields.io/badge/Hardhat-2.22-yellow?logo=hardhat)](https://hardhat.org/)
[![OpenZeppelin](https://img.shields.io/badge/OpenZeppelin-5.4-blue?logo=openzeppelin)](https://openzeppelin.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

[Demo](#-quick-start-demo) • [Architecture](#-architecture-overview) • [Contracts](#-smart-contracts) • [Deployment](#-deployment)

</div>

---

## 📖 What is Gravity Nexus?

**Gravity Nexus** is a next-generation, autonomous yield optimization protocol that revolutionizes how capital flows in the multi-chain DeFi ecosystem. It combines three cutting-edge technologies:

1. **🤖 Reactive Smart Contracts** — Trustless, event-driven automation without centralized keepers
2. **🧠 ZKML-Verified AI** — AI-driven yield predictions with zero-knowledge proof verification
3. **💬 Agentic Intent Builder** — Natural language interface for strategy configuration

### The Problem

In today's fragmented DeFi landscape:
- **Yield opportunities are scattered** across dozens of chains and protocols
- **Manual rebalancing is slow** — by the time you move capital, yields have shifted
- **Keeper-based automation is centralized** — relying on Gelato, Chainlink Automation, or custom bots
- **AI predictions are opaque** — users can't verify that models execute correctly

### The Solution

Gravity Nexus creates an **autonomous lending vault** that:

| Feature | Traditional Vaults | Gravity Nexus |
|---------|-------------------|---------------|
| Rebalancing Trigger | Manual or centralized bots | Reactive Network (trustless) |
| Strategy Configuration | Complex parameter tuning | Natural language intents |
| AI Integration | None or black-box | ZKML-verified predictions |
| Gas Management | User pays per action | Self-funded autonomy |
| Cross-Chain Support | Single chain | Multi-chain native |

---

## 🏗️ Architecture Overview

Gravity Nexus operates across multiple layers, each handling a specific responsibility:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           USER INTERFACE LAYER                               │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐              │
│  │ Agentic Intent  │  │ Vault Strategy  │  │  ZKML Proof     │              │
│  │    Builder      │  │    Monitor      │  │   Verifier      │              │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘              │
└───────────┼─────────────────────┼─────────────────────┼─────────────────────┘
            │                     │                     │
            ▼                     ▼                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    SMART CONTRACT LAYER (Sepolia)                            │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                          NexusVault.sol                               │   │
│  │  • Central capital repository                                         │   │
│  │  • Manages lending adapters                                           │   │
│  │  • Executes rebalancing logic                                         │   │
│  │  • Autonomous gas buffer                                              │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                    │                                         │
│            ┌───────────────────────┼───────────────────────┐                │
│            ▼                       ▼                       ▼                │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐         │
│  │ MockAdapter A   │    │ MockAdapter B   │    │  RemoteHub.sol  │         │
│  │ (Aave-style)    │    │ (Compound-style)│    │ (Cross-chain)   │         │
│  └─────────────────┘    └─────────────────┘    └────────┬────────┘         │
└─────────────────────────────────────────────────────────┼───────────────────┘
                                                          │
                            Cross-Chain Callbacks         │
                                                          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                  REACTIVE LAYER (Lasna Network)                              │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                     ReactiveRebalancer.sol                            │   │
│  │  • Event listener (multi-chain)                                       │   │
│  │  • Yield comparison engine                                            │   │
│  │  • Autonomous callback triggering                                     │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Layer Breakdown

#### 1. User Interface Layer
The frontend provides a comprehensive dashboard with:
- **Vault Strategy Monitor** — Real-time visualization of fund allocation across pools
- **Agentic Intent Builder** — Convert natural language ("optimize for stability") into on-chain parameters
- **Automation Lab** — One-click demo preparation, yield chaos simulation, and reactive auditing
- **ZKML Proof Verifier** — Demonstrates AI inference verification

#### 2. Smart Contract Layer (Settlement Chain)
Deployed on Ethereum Sepolia, this layer handles capital management:
- **NexusVault** — The heart of the system, holding user deposits and executing rebalancing
- **LendingAdapters** — Standardized wrappers for different DeFi protocols
- **RemoteHub** — Cross-chain message receiver for Reactive Network callbacks

#### 3. Reactive Layer (Automation Chain)
Deployed on the Reactive Network (Lasna), this layer provides trustless automation:
- **ReactiveRebalancer** — Monitors yield events and triggers optimal rebalancing

---

## 📜 Smart Contracts

### Core Contracts

| Contract | Network | Description |
|----------|---------|-------------|
| `NexusVault.sol` | Sepolia | Central vault managing deposits, withdrawals, and rebalancing |
| `ReactiveNexus.sol` | Sepolia | Local reactive logic for yield threshold monitoring |
| `RemoteHub.sol` | Sepolia | Cross-chain callback receiver from Reactive Network |
| `MockAdapter.sol` | Sepolia | Standardized lending pool adapters |
| `ReactiveRebalancer.sol` | Lasna | Autonomous event listener and rebalancer |

### NexusVault.sol — The Capital Hub

The `NexusVault` is the central point of all capital in the system:

```solidity
contract NexusVault is Ownable {
    IERC20 public immutable asset;           // The underlying token (mUSDC)
    ILendingAdapter[] public adapters;        // Array of lending pool connections
    mapping(address => bool) public authorizedCallers; // Reactive Network permissions

    // Core functions
    function deposit(uint256 amount) external;
    function withdraw(uint256 amount) external;
    function rebalance(uint256 fromIdx, uint256 toIdx, uint256 amount) public onlyAuthorized;
    function checkYieldAndRebalance() external onlyAuthorized;
}
```

**Key Features:**
- **Adapter-Based Architecture**: Supports unlimited lending pools through standardized adapters
- **Authorization System**: Only owner or authorized Reactive contracts can trigger rebalancing
- **Cap-to-Physical Logic**: Prevents reverts from dust/rounding discrepancies

### ReactiveNexus.sol — The Local Brain

Handles on-chain yield analysis and threshold-based decision making:

```solidity
contract ReactiveNexus is Ownable {
    INexusVault public nexusVault;
    uint256 public yieldThreshold = 100;  // 1% basis points

    function checkYieldAndRebalance(uint256 amountToMove) external;
    function setYieldThreshold(uint256 _threshold) external onlyOwner;
}
```

**Key Features:**
- **Configurable Thresholds**: Users set the minimum yield difference to trigger rebalancing
- **Multi-Pool Optimization**: Automatically finds the highest-yielding pool and consolidates

### RemoteHub.sol — Cross-Chain Bridge

Receives authorized callbacks from the Reactive Network:

```solidity
contract RemoteHub is Ownable {
    address public reactiveNetwork;  // Authorized callback source
    address public vault;            // Target NexusVault

    function callback(string calldata action, bytes calldata params) external;
    function _executeOptimize() internal;  // Triggers vault.checkYieldAndRebalance()
}
```

**Supported Actions:**
| Action | Description |
|--------|-------------|
| `LEND` | Deposit into configured lending pool |
| `WITHDRAW` | Withdraw from lending pool |
| `SWAP` | Execute token swap (future) |
| `OPTIMIZE` | Run yield optimization on vault |

---

## 🔄 How Reactive Automation Works

Gravity Nexus eliminates the need for centralized keepers through the Reactive Network:

### Traditional Keeper Model (Centralized)
```
User → Deposit → Vault
                   ↑
         [Gelato/Chainlink Bot]
                   │
            (Polling every X blocks)
                   │
            "Should I rebalance?"
                   │
             Execute if yes
```

### Gravity Nexus Model (Decentralized)
```
User → Deposit → Vault → Emit YieldShift Event
                              │
                              ▼
                   [Reactive Network Listens]
                              │
                   (Real-time event processing)
                              │
               ReactiveRebalancer Evaluates
                              │
                   Threshold Met? → Cross-Chain Callback
                              │
                              ▼
                    RemoteHub.callback()
                              │
                    NexusVault.checkYieldAndRebalance()
                              │
                    Funds Moved Automatically ✓
```

### The Inversion of Control

| Aspect | Before Reactive | After Reactive |
|--------|-----------------|----------------|
| Who initiates? | External bot | Contract itself |
| Who pays gas? | Bot operator | Reactive Network |
| Trust model | Trust the keeper | Trustless |
| Latency | Block-by-block polling | Real-time events |

---

## 🧠 ZKML: Trustless AI Integration

DeFi users are rightfully skeptical of "black box" AI. Gravity Nexus demonstrates a **Proof-Backed Inference Pipeline**:

### The Problem with AI in DeFi
- Traditional AI: "I predict yields will rise" — *How do I know you ran the model correctly?*
- ZKML Solution: "Here's my prediction AND a zero-knowledge proof that I executed model weights correctly"

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     AI Prediction Pipeline                       │
│                                                                  │
│  ┌───────────┐    ┌───────────┐    ┌───────────┐               │
│  │   LSTM    │    │   EZKL    │    │  On-Chain │               │
│  │   Model   │ → │  Prover   │ → │  Verifier │               │
│  └───────────┘    └───────────┘    └───────────┘               │
│       │                │                  │                     │
│  Historical      ZK-SNARK Proof      Proof Valid?              │
│  Yield Data                          → Execute Strategy         │
└─────────────────────────────────────────────────────────────────┘
```

### Model Details
- **Model Type**: LSTM (Long Short-Term Memory) neural network
- **Training Data**: Historical yield volatility across lending protocols
- **Prediction**: Next-period optimal allocation strategy
- **Verification**: SNARK proof that model weights and inference were executed correctly

---

## 💬 Agentic Intent Builder

Traditional DeFi vaults require complex parameter configuration. Gravity Nexus introduces **natural language strategy definition**:

### Example Intents

| User Says | System Interprets | On-Chain Action |
|-----------|------------------|-----------------|
| "Optimize for stability" | Low risk tolerance, prefer stable pools | `yieldThreshold = 300` (3% min diff) |
| "Maximize yield aggressively" | High risk tolerance, chase any opportunity | `yieldThreshold = 50` (0.5% min diff) |
| "Set rebalance threshold to 1%" | Explicit parameter setting | `yieldThreshold = 100` |
| "Prioritize Pool A" | Weight preference for specific adapter | Adjust allocation ratios |

### How It Works

1. **User Input**: Natural language string via frontend
2. **Intent Parsing**: Off-chain NLP extracts parameters
3. **On-Chain Update**: `ReactiveNexus.setYieldThreshold()` called
4. **Reactive Subscription**: Reactive Network uses new threshold for all future evaluations

---

## 🚀 Quick Start Demo

### Prerequisites
- Node.js v18+
- MetaMask browser extension
- Sepolia testnet ETH (from faucet)

### Local Development

```bash
# 1. Clone and install
git clone <repository-url>
cd gravity_nexus
npm install

# 2. Start local Hardhat node
npx hardhat node

# 3. Deploy contracts (new terminal)
npx hardhat run scripts/deploy.ts --network localhost

# 4. Start frontend server
npx serve -p 3000 frontend

# 5. Open browser
# Navigate to http://localhost:3000
```

### Testnet Deployment

```bash
# Configure environment
cp .env.example .env
# Edit .env with your private key and RPC URLs

# Deploy to Sepolia
npx hardhat run scripts/deploy.ts --network sepolia

# Deploy Reactive contracts to Lasna
npx hardhat run scripts/deploy-reactive.ts --network kopli
```

---

## 🎮 Automation Lab (Zero-CLI Demo)

For frictionless hackathon demos, Gravity Nexus includes an **Automation Lab** directly in the UI:

### Demo Prep (1-Click)
- **Faucet**: Mints 1,000,000 mUSDC to your wallet
- **Approval**: Sets max approval for seamless deposits

### Yield Chaos Simulator
- **Simulate Market Shift**: Manually changes mock adapter rates
- Forces rebalancing opportunities for live demonstration

### Reactive Auditor
- **Trigger Audit**: Manually fires the Reactive callback
- See real-time capital movement in the Strategy Monitor

### Pro Tips
> 💡 **Hard Refresh**: Always use `Ctrl+F5` after redeployment — the browser caches `contracts.js`

> 💡 **Signatures Required**: Clicking "Simulate" or "Audit" requires MetaMask signatures — these are state-changing transactions

---

## 🌐 Deployed Contracts

### Production (Sepolia + Lasna)

| Network | Contract | Address |
|---------|----------|---------|
| **Sepolia** | NexusVault | `0xa86a6F197921DA06Cb2EEFc65370192B0405b40E` |
| **Sepolia** | ReactiveNexus | `0x7ac42cD47A469AF1E3e38bFE3e93A57Edd0f7791` |
| **Sepolia** | RemoteHub | `0x34bEAb876000C2FF44a22AF1E5346369cF696B9A` |
| **Sepolia** | MockToken | `0xF31A2A4Fd1462A00E565868B4771D30104eE9647` |
| **Lasna** | ReactiveRebalancer | `0x6cAf861524582c21967Ddbd66b2Fb32E1ef574aA` |

### Verification

1. **On-Chain Events**: All rebalancing logged as `ActionTriggered` (Lasna) and `Rebalanced` (Sepolia)
2. **Live Dashboard**: Built-in terminal shows Reactive Node execution logs
3. **Block Explorers**: 
   - Sepolia: [etherscan.io/sepolia](https://sepolia.etherscan.io)
   - Lasna: [Reactive Explorer](https://lasna.reactives.network)

---

## 📁 Project Structure

```
gravity_nexus/
├── contracts/                    # Solidity smart contracts
│   ├── NexusVault.sol           # Core vault logic
│   ├── ReactiveNexus.sol        # Yield monitoring brain
│   ├── RemoteHub.sol            # Cross-chain callback receiver
│   ├── adapters/                # Lending pool adapters
│   │   └── MockAdapter.sol      # Simulated lending pools
│   ├── interfaces/              # Contract interfaces
│   └── test/                    # Test mock contracts
├── scripts/                      # Deployment & demo scripts
│   ├── deploy.ts                # Main deployment script
│   ├── deploy-reactive.ts       # Reactive Network deployment
│   ├── simulate-automation.ts   # Automation demo script
│   └── ...                      # Various utility scripts
├── frontend/                     # Web dashboard
│   ├── index.html               # Main HTML structure
│   ├── index.js                 # Application logic
│   ├── index.css                # Styling
│   └── contracts.js             # Contract addresses & ABIs
├── test/                         # Hardhat tests
├── hardhat.config.ts            # Hardhat configuration
└── package.json                  # Dependencies
```

---

## 🛠️ Technology Stack

| Category | Technology |
|----------|------------|
| **Smart Contracts** | Solidity 0.8.24 |
| **Framework** | Hardhat 2.22 |
| **Libraries** | OpenZeppelin Contracts 5.4 |
| **Blockchain** | Ethereum Sepolia, Reactive Lasna |
| **Frontend** | Vanilla JS, CSS |
| **Testing** | Chai, Mocha |
| **Cross-Chain** | Reactive Network Native Callbacks |

---

## 🔐 Security Considerations

### Access Control
- **Vault Operations**: Public `deposit()` and `withdraw()` for users
- **Rebalancing**: Only `owner` or `authorizedCallers` (Reactive contracts)
- **Configuration**: Only `owner` can add adapters or change thresholds

### Safety Mechanisms
- **Cap-to-Physical Withdrawals**: Prevents reverts from rounding errors
- **Authorization Mapping**: Explicit allowlist for callback sources
- **No External Calls in Loops**: Gas-efficient rebalancing logic

### Audit Status
> ⚠️ This project is for hackathon demonstration purposes. It has not undergone a formal security audit. Do not use with real funds.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Reactive Network](https://reactive.network) — For pioneering reactive smart contracts
- [OpenZeppelin](https://openzeppelin.com) — For secure contract libraries
- [EZKL](https://ezkl.xyz) — For ZKML proof infrastructure inspiration

---

<div align="center">

**Gravity Nexus: Moving liquidity at the speed of thought, secured by the power of math.**

🌐 [Website](#) • 📖 [Docs](#) • 🐦 [Twitter](#) • 💬 [Discord](#)

</div>
