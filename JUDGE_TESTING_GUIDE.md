# ⚖️ Judge Testing Guide: Nexus Galaxy

Welcome to the **Nexus Galaxy** hackathon evaluation guide. This document outlines how to test the application's core features on the **Ethereum Sepolia** testnet.

---

## 🚀 Quick Connect

1.  **Network**: Connect MetaMask to **Ethereum Sepolia**.
2.  **Faucet**: If you need Sepolia ETH, use the [Enzyme Faucet](https://faucet.enzyme.finance/) or [Alchemy Faucet](https://sepoliafaucet.com/).
3.  **App URL**: [Insert Vercel URL Here]

---

## 🧪 Core Test Workflows

### 1. The Automation Lab (Demonstrating Reactivity)
The fastest way to see the magic of Reactive Smart Contracts is the **Automation Lab** at the bottom of the dashboard.

*   **Step A: "Authorize Account"**
    *   Click this to mint 1,000,000 **mUSDC** (test token) and grant approval to the Vault.
    *   *Why?* This simulates a production-ready user state in one click.
*   **Step B: "Run Rebalance Demo"**
    *   This triggers a sequence:
        1.  Initial deposit into the best pool.
        2.  A "Market Shock" simulation (Pool yields are flipped).
        3.  The **Reactive Network** detects the shift and automatically moves the capital.
    *   **Watch**: The **Vault Strategy Monitor** bars shift automatically without you clicking anything else!

### 2. Agentic Intent Builder (Natural Language DeFi)
Try type-tuning the strategy using natural language:
*   **Try typing**: `"Set rebalance threshold to 2%"`
*   **Result**: The "Update Policy" button will configure the `ReactiveNexus` contract on-chain to be less aggressive.

### 3. ZKML Verified AI
Navigate to the **AI Analytics** section:
*   Click **"Run AI Prediction"**.
*   Once computed, click **"Verify ZK Proof"**.
*   This demonstrates how AI inference can be cryptographically verified on-chain, ensuring the model wasn't tampered with.

---

## 🔐 Security Hardening (v1.1)
All contracts have been audited and hardened for this submission:
- **Reentrancy Protection**: All vault operations are protected.
- **Emergency Pausing**: Owner can pause the vault in case of anomalies.
- **SafeERC20**: Robust handling of token transfers.
- **Access Control**: Strict authorization for Reactive callbacks.

---

## 📊 Verification Links

*   **NexusVault (Sepolia)**: [`0xB7cd5b44Fcd3646ec08954Ecc6FDe43f334dF18f`](https://sepolia.etherscan.io/address/0xB7cd5b44Fcd3646ec08954Ecc6FDe43f334dF18f)
*   **ReactiveRebalancer (Lasna)**: [`0x760FBf81b2FE506dEc35dA1385E65C79A8fD12FB`](https://lasna.reactives.network/address/0x760FBf81b2FE506dEc35dA1385E65C79A8fD12FB)

---

## 💡 Troubleshooting
*   **Transactions Reverting?** Ensure you have enough Sepolia ETH for gas.
*   **UI Stale?** The app auto-refreshes, but a manual refresh (`Ctrl+R`) clears browser cache of ABIs.
*   **No Wallet?** The app will run in **Read-Only Mode**, fetching real-time data from Sepolia for your review.
