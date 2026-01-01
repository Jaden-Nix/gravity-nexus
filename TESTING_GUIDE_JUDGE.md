# 🚀 Gravity Nexus: Judge Testing Guide

Welcome to the **Gravity Nexus** testing suite. This guide will walk you through verifying our **Autonomous Cross-Chain Rebalancing** system powered by the **Reactive Network**.

---

## 🛠️ Prerequisites
Before starting, ensure you have:
1.  **MetaMask** installed and connected to the **Ethereum Sepolia** network.
2.  **Sepolia ETH** for gas (get some at [Sepolia Faucet](https://sepoliafaucet.com/)).
3.  **Access Token**: Our contracts use a mock USDC/tETH on Sepolia. You will claim these in the first step!

---

## 🧪 Path A: The Automated Showcase (Fastest)
*Best for a quick end-to-end proof of concept.*

1.  **Connect Wallet**: Click the **"Connect Wallet"** button and ensure you are on Sepolia.
2.  **Demo Prep**: Click **"1. Demo Prep"**. This will:
    - Mint mock assets to your wallet.
    - Set **Pool A** to a high yield (20% / 2000 bps).
    - Authorize the Vault to manage your funds.
3.  **Run Full Demo**: Click **"Run Rebalance Demo"**.
    - Watch the terminal logs as it deposits, simulates a market shift, and triggers an autonomous rebalance.
    - **Success**: You should see your funds move from Pool A to the new highest-yield pool automatically.

---

## 🏗️ Path B: The Manual Interactive Path (Deep Dive)
*Best for understanding the granularity of the system.*

### Step 1: Initialize
- Click **"1. Demo Prep"**. This sets the environment to a "Clean State" with **Pool A (Safe)** as the yield leader at **20%**.

### Step 2: Manual Deposit
- Scroll to **Vault Management**.
- Enter `100` and click **"Deposit USDC"**.
- Confirm in MetaMask. Your funds are now working in **Pool A**.
- **Verify**: In the **Strategy Monitor**, you should see the bar for Pool A grow.

### Step 3: Inject Market Chaos
- Navigate to the **Simulation Terminal**.
- Click **"Yield Chaos Simulator"**. 
- **What happens?**: Pool A's yield drops to 2%, while **Pool C (Morpho)** spikes to **30%**. 
- The **Reactive Network** autonomous listener detects this "Yield Gap" > 1%.

### Step 4: Observer Rebalance
- The simulator will trigger the rebalance.
- **Verification**: Refresh the **Strategy Monitor**. You will see the funds have moved from Pool A (now 2%) to Pool C (now 30%).

### Step 5: Agentic Strategy Control
- Scroll to the **Agentic Intent Builder** (the command bar).
- Type: `Set threshold to 2%` and click **"Send Intent"**.
- **Observation**: A MetaMask transaction will pop up to update the `ReactiveNexus` contract. Once confirmed, the dashboard's "Rebalance Threshold" (in the Strategy Monitor) will update to **2%**.
- This demonstrates how complex on-chain parameters are managed via simple natural language intents.

## 📊 Technical Context for Judges

### 1. Units: Basis Points (bps)
To ensure extreme precision and avoid decimal errors, all protocol yields are handled in **bps**:
- `100 bps = 1.00%`
- Our `yieldThreshold` is set to `100 bps`. The system will *only* rebalance if it finds a pool at least **1%** better than the current one, preventing "yield chasing" through high-gas volatility.

### 2. The Reactive Advantage (Demo Honest Note)
While our architecture is fully automated, cross-chain relays on the **Lasna Network** typically take 30–60 seconds to execute:
- **Production**: The Rebalancer is a persistent, autonomous actor. No user input is required.
- **This Demo (Fast-track)**: To ensure a smooth presentation, clicking the "Simulator" or "Demo" buttons triggers the rebalance logic *immediately*. This demonstrates the **logic and state movement** without making you wait in front of a loading spinner.

---

## 🏁 Expected Results
- **Seamless Interaction**: Zero friction for the user after the initial deposit.
- **Efficiency**: Capital always migrates to the highest-yielding adapter.
- **Transparency**: Every step is logged in the on-site terminal and verifiable on Sepolia Etherscan.

**Need Help?** Check the developer logs in the browser console for detailed transaction receipts.
