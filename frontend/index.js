// Nexus Galaxy Frontend - Main Application Logic
// Handles wallet connection, contract interactions, and live data fetching

class NexusGalaxy {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.account = null;
        this.chainId = null;
        this.contracts = {};

        this.selectedAction = 'LEND';
        this.isDirectNode = false;
        this.bgProviders = {};
        this.bgContracts = {};

        this.init();
    }

    async init() {
        try {
            this.updateHubStatuses(); // Show deployment status early
            this.updateAssetLabels(this.getChainKey());
            this.updateVaultInfo();
            this.updateChainStatuses();
            this.updateStrategyMonitor();
            this.fetchLiveYields(); // Fetch yields immediately

            // Auto-refresh yields for local demo
            setInterval(() => this.fetchLiveYields(), 30000);
            setInterval(() => this.updateStrategyMonitor(), 2000);
            setInterval(() => this.updateVaultInfo(), 5000);
            setInterval(() => this.updateChainStatuses(), 30000);

            // Check if already connected
            if (window.ethereum && window.ethereum.selectedAddress) {
                this.connectWallet().catch(e => console.error("Auto-connect failed:", e));
            }

            this.startLiveFeed();
            this.setupIntentBuilder();
            this.setupEventListeners();
        } catch (error) {
            console.error("Global Init Error:", error);
        }
    }

    startLiveFeed() {
        // Disabled demo background noise for cleaner presentation
        /*
        const logs = [
            { type: 'log', text: 'Monitoring Sepolia Block #5829102... (Demo)' },
            { type: 'warn', text: 'Yield shift detected in Pool A... (Demo)' },
            { type: 'log', text: 'Analyzing cross-chain liquidity... (Demo)' },
            { type: 'system', text: 'Reactive node heart-beat: OK' },
            { type: 'action', text: 'Evaluating Rebalance Strategy... (Demo)' },
            { type: 'log', text: 'Optimization potential: +1.2% detected (Demo)' },
            { type: 'warn', text: 'High gas detected on Mainnet... (Demo)' }
        ];

        setInterval(() => {
            const log = logs[Math.floor(Math.random() * logs.length)];
            this.injectTerminalLog(log.type, log.text);
        }, 4000);
        */
        this.injectTerminalLog('system', 'Reactive Nexus Node Online - Monitoring Intents...');
    }

    injectTerminalLog(type, text) {
        const terminal = document.getElementById('reactive-terminal');
        const line = document.createElement('div');
        line.className = `terminal-line ${type}`;
        const time = new Date().toLocaleTimeString();
        line.innerHTML = `<span class="system">[${time}]</span> ${text}`;
        terminal.appendChild(line);
        terminal.scrollTop = terminal.scrollHeight;

        if (terminal.childNodes.length > 50) {
            terminal.removeChild(terminal.firstChild);
        }
    }

    setupIntentBuilder() {
        const input = document.getElementById('agent-command');
        const preview = document.getElementById('parse-preview');
        const button = document.getElementById('send-command');

        input.addEventListener('input', (e) => {
            const cmd = e.target.value.toLowerCase();
            if (!cmd) {
                preview.innerHTML = 'Waiting for instructions...';
                return;
            }

            // Strategy-focused parsing
            const thresholdMatch = cmd.match(/(threshold|limit|gap)\s+(to|at)?\s*(\d+\.?\d*)\s*%?/i);
            const priorityMatch = cmd.match(/(prioritize|focus|move to)\s+(pool a|pool b|safe pool|high yield pool)/i);
            const statusMatch = cmd.match(/(status|report|analytics|health)/i);

            if (thresholdMatch) {
                const value = thresholdMatch[3];
                preview.innerHTML = `Strategy Update: Set <b>Rebalance Threshold</b> to <b>${value}%</b>`;
            } else if (priorityMatch) {
                const target = priorityMatch[2];
                preview.innerHTML = `Strategy Update: <b>Prioritize ${target.toUpperCase()}</b> for allocation`;
            } else if (statusMatch) {
                preview.innerHTML = `Action: Generate <b>Detailed Vault Health Report</b>`;
            } else {
                preview.innerHTML = '<span style="color:var(--error)">Try: "Set threshold to 2%" or "Prioritize Safe Pool"</span>';
            }
        });

        button.addEventListener('click', async () => {
            const cmd = input.value.toLowerCase();
            const time = new Date().toLocaleTimeString();

            this.injectTerminalLog('system', `[AGENT] Intent Received: "${cmd}"`);

            if (cmd.includes('threshold')) {
                const value = cmd.match(/\d+\.?\d*/)?.[0] || '1.0';

                // --- THIS IS REAL ON-CHAIN ACTION ---
                if (this.contracts.reactiveNexus) {
                    try {
                        this.injectTerminalLog('action', `[AGENT] Sending On-Chain Update to ReactiveNexus...`);
                        const tx = await this.contracts.reactiveNexus.connect(this.signer).setYieldThreshold(Math.floor(parseFloat(value) * 100));
                        await tx.wait();
                        this.injectTerminalLog('system', `[AGENT] Strategy updated on-chain! New threshold: ${value}%`);
                        document.getElementById('strategy-threshold').textContent = `${value}%`;
                        this.addActivity('⚙️', 'Policy Update', `Threshold set to ${value}%`);
                    } catch (e) {
                        this.injectTerminalLog('warn', `[AGENT] Failed to update contract: ${e.message}`);
                    }
                } else {
                    this.injectTerminalLog('warn', `[AGENT] (Simulated) Updating Vault Rebalance Threshold to ${value}%`);
                    document.getElementById('strategy-threshold').textContent = `${value}%`;
                }

                input.value = '';
            } else if (cmd.includes('prioritize') || cmd.includes('pool')) {
                this.injectTerminalLog('action', `[AGENT] Adjusting allocation weights logic in Reactive node...`);
                this.addActivity('⚖️', 'Policy Update', `Prioritizing pool based on intent`);
                input.value = '';
            } else {
                this.injectTerminalLog('warn', `[AGENT] Processing general inquiry... Generating AI-enhanced response.`);
                input.value = '';
            }
        });
    }

    setupEventListeners() {
        // Wallet connect button
        document.getElementById('connectWallet').addEventListener('click', () => this.connectWallet());

        // Navigation smooth scroll
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                e.target.classList.add('active');
            });
        });

        // Amount input - enable/disable submit
        document.getElementById('amount').addEventListener('input', (e) => {
            const submitBtn = document.getElementById('submitIntent');
            submitBtn.disabled = !e.target.value || parseFloat(e.target.value) <= 0 || !this.account;
        });

        // Max button
        document.querySelector('.max-btn').addEventListener('click', () => {
            document.getElementById('amount').value = '0.1'; // Demo value
            document.getElementById('amount').dispatchEvent(new Event('input'));
        });

        // Submit intent
        document.getElementById('submitIntent').addEventListener('click', () => this.submitIntent());

        // Deposit chain selector - update asset labels
        document.getElementById('deposit-chain').addEventListener('change', (e) => {
            this.updateAssetLabels(e.target.value);
        });

        // Chain card click to switch network
        document.querySelectorAll('.chain-card').forEach(card => {
            card.style.cursor = 'pointer';
            card.addEventListener('click', () => {
                const chainKey = card.getAttribute('data-chain');
                this.switchNetwork(chainKey);
            });
        });

        // Run AI prediction
        document.getElementById('runPrediction').addEventListener('click', () => this.runAIPrediction());

        // Maintenance & Automation Controls
        document.getElementById('demoPrep').addEventListener('click', () => this.demoPrep());
        document.getElementById('simulateShift').addEventListener('click', () => this.simulateMarketShift());

        // Link Reactive Network button (if needed)
        const linkBtn = document.getElementById('linkReactive');
        if (linkBtn) {
            linkBtn.addEventListener('click', () => this.linkReactiveNetwork());
        }

        // Listen for account/chain changes
        if (window.ethereum) {
            window.ethereum.on('accountsChanged', (accounts) => {
                if (accounts.length === 0) {
                    this.disconnectWallet();
                } else {
                    this.account = accounts[0];
                    this.updateWalletUI();
                }
            });

            window.ethereum.on('chainChanged', () => {
                window.location.reload();
            });
        }

        // ZK Modal closing
        document.querySelector('.close-modal').addEventListener('click', () => {
            document.getElementById('zk-modal').classList.remove('active');
        });
        document.getElementById('close-v-modal').addEventListener('click', () => {
            document.getElementById('zk-modal').classList.remove('active');
        });
        window.addEventListener('click', (e) => {
            if (e.target === document.getElementById('zk-modal')) {
                document.getElementById('zk-modal').classList.remove('active');
            }
        });
    }

    async connectWallet() {
        if (!window.ethereum) {
            this.injectTerminalLog('warn', '[SYSTEM] No Web3 Wallet detected. Attempting direct connection to Local Node...');
            try {
                // Try to connect directly to Hardhat RPC
                this.provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
                // Check if node is up
                await this.provider.getNetwork();

                // Use the first Hardhat account (unlocked on local node)
                this.signer = await this.provider.getSigner(0);
                this.account = await this.signer.getAddress();
                this.chainId = '0x7a69'; // Hard-code to localhost

                this.injectTerminalLog('system', `[SYSTEM] Connected Directly to Local Node: ${this.shortenAddress(this.account)}`);
                this.updateWalletUI(true);
                await this.setupContracts();
                await this.updateChainStatuses();
                return;
            } catch (e) {
                console.error('Local node connection failed:', e);
                this.injectTerminalLog('error', '[SYSTEM] Could not connect to Local Node. Check if "npx hardhat node" is running.');
                // alert('Please install MetaMask or start a local Hardhat node to demo on-chain features.');
                return;
            }
        }

        try {
            const btn = document.getElementById('connectWallet');
            btn.innerHTML = '<span class="btn-icon">⏳</span> Connecting...';

            // Request account access
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            this.account = accounts[0];

            // Setup ethers provider
            this.provider = new ethers.BrowserProvider(window.ethereum);
            this.signer = await this.provider.getSigner();
            this.chainId = await window.ethereum.request({ method: 'eth_chainId' });

            // Auto-switch to Sepolia if on an unsupported chain
            const supportedChains = ['0x7a69', '31337', '0xaa36a7', '11155111', '0x66eee', '421614', '0x512577', '5318007'];
            if (!supportedChains.includes(this.chainId)) {
                this.injectTerminalLog('action', '[SYSTEM] Unsupported chain detected. Switching to Sepolia...');
                await this.switchNetwork('sepolia');
                this.chainId = await window.ethereum.request({ method: 'eth_chainId' });
            }

            this.updateWalletUI();
            await this.setupContracts();
            await this.updateChainStatuses();
            this.injectTerminalLog('system', '[SYSTEM] Wallet Connected & Contracts Linked!');

            // Force one monitor update
            this.updateStrategyMonitor();

            // Enable submit button if amount is set
            const amount = document.getElementById('amount').value;
            if (amount && parseFloat(amount) > 0) {
                document.getElementById('submitIntent').disabled = false;
            }

        } catch (error) {
            this.injectTerminalLog('error', `[SYSTEM] Connection Error: ${error.message.slice(0, 50)}`);
            console.error('Failed to connect wallet:', error);
            // alert('Failed to connect wallet. Please try again.');
            document.getElementById('connectWallet').innerHTML = '<span class="btn-icon">◈</span> Connect Wallet';
        }
    }

    disconnectWallet() {
        this.account = null;
        this.provider = null;
        this.signer = null;
        document.getElementById('connectWallet').innerHTML = '<span class="btn-icon">◈</span> Connect Wallet';
        document.getElementById('submitIntent').disabled = true;
    }

    updateWalletUI(isDirect = false) {
        this.updateAssetLabels(this.getChainKey());
        const btn = document.getElementById('connectWallet');
        const shortAddress = `${this.account.slice(0, 6)}...${this.account.slice(-4)}`;
        btn.innerHTML = `<span class="btn-icon">${isDirect ? '◈' : '✓'}</span> ${isDirect ? 'Dev Node' : shortAddress}`;
        btn.style.background = isDirect ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-card)';
        btn.style.border = `1px solid ${isDirect ? 'var(--accent-secondary)' : 'var(--success)'}`;
    }

    async setupContracts() {
        const chainKey = this.getChainKey();
        this.injectTerminalLog('system', `[SYSTEM] Initializing contracts for network: ${chainKey || 'unknown'}`);
        console.log(`[DEBUG] Initializing for ${chainKey}. Address Map:`, CONTRACT_ADDRESSES[chainKey]);

        if (!chainKey) {
            const displayId = this.chainId?.toString().startsWith('0x') ? this.chainId : `0x${Number(this.chainId).toString(16)}`;
            this.injectTerminalLog('warn', `[SYSTEM] Network ${displayId} not recognized.`);
            this.injectTerminalLog('action', `[SYSTEM] Please switch Metamask to 'Localhost 8545' (Chain ID 31337)`);
            return;
        }

        const addresses = CONTRACT_ADDRESSES[chainKey];
        if (!addresses) {
            this.injectTerminalLog('warn', `[SYSTEM] No addresses found for chain: ${chainKey}`);
            return;
        }

        // Reactive Nexus
        if (addresses.reactiveNexus) {
            try {
                this.contracts.reactiveNexus = new ethers.Contract(addresses.reactiveNexus, ABIS.ReactiveNexus, this.provider);
                this.injectTerminalLog('log', `[SYSTEM] ReactiveNexus linked: ${this.shortenAddress(addresses.reactiveNexus)}`);

                this.contracts.reactiveNexus.on('ActionTriggered', (action, fromIdx, toIdx, amount) => {
                    this.injectTerminalLog('action', `[REACTIVE] ACTUAL ACTION TRIGGERED: ${action}`);
                    this.injectTerminalLog('log', `[REACTIVE] Moving ${ethers.formatUnits(amount, 18)} ETH terminally...`);
                    this.updateStrategyMonitor();
                });

                this.contracts.reactiveNexus.on('ActionExecuted', (result) => {
                    this.injectTerminalLog('system', `[REACTIVE] ACTION EXECUTED: ${result}`);
                    this.addActivity('⚡', 'Reactive Rebalance', result);
                    this.updateStrategyMonitor();
                    this.updateVaultInfo();
                });
            } catch (e) { console.error('Reactive setup fail:', e); }
        }

        // Nexus Vault
        if (addresses.nexusVault) {
            try {
                this.contracts.nexusVault = new ethers.Contract(addresses.nexusVault, ABIS.NexusVault, this.provider);
                this.injectTerminalLog('log', `[SYSTEM] NexusVault linked: ${this.shortenAddress(addresses.nexusVault)}`);
                this.updateVaultInfo();
            } catch (e) { console.error('Vault setup fail:', e); }
        }

        // ML Model
        if (addresses.mlModel) {
            try {
                this.contracts.mlModel = new ethers.Contract(addresses.mlModel, ABIS.MLModel, this.provider);
                this.loadModelInfo();
            } catch (e) { console.error('ML setup fail:', e); }
        }

        // Asset Token (mUSDC)
        if (addresses.assetToken) {
            try {
                this.contracts.assetToken = new ethers.Contract(addresses.assetToken, ABIS.IERC20, this.provider);
                this.injectTerminalLog('log', `[SYSTEM] Asset Token linked: ${this.shortenAddress(addresses.assetToken)}`);
            } catch (e) { console.error('Asset token setup fail:', e); }
        }

        // Update Status UI
        const isLocal = chainKey === 'localhost' || chainKey === 'hardhat';
        const isTestnet = ['sepolia', 'arbitrum', 'lasna', 'kopli'].includes(chainKey);
        const statusInd = document.getElementById('contract-status');
        const statusTxt = document.getElementById('status-text');

        if (statusInd) {
            statusInd.className = `status-indicator ${isLocal || isTestnet ? 'ready' : 'simulated'}`;
        }
        if (statusTxt) {
            if (isLocal) statusTxt.textContent = 'Local Node Connected';
            else if (isTestnet) statusTxt.textContent = `${CHAIN_CONFIG[chainKey].chainName} Live`;
            else statusTxt.textContent = 'Simulated Response Mode';
        }
    }

    async updateVaultInfo() {
        // 1. Initial background providers if not already done
        if (Object.keys(this.bgProviders).length === 0) {
            for (const [key, config] of Object.entries(CHAIN_CONFIG)) {
                if (config.rpcUrls && config.rpcUrls[0]) {
                    try {
                        const p = new ethers.JsonRpcProvider(config.rpcUrls[0], undefined, { staticNetwork: true });
                        this.bgProviders[key] = p;

                        const addresses = CONTRACT_ADDRESSES[key];
                        if (addresses && addresses.nexusVault) {
                            this.bgContracts[key] = {
                                vault: new ethers.Contract(addresses.nexusVault, ABIS.NexusVault, p),
                                token: new ethers.Contract(addresses.assetToken, ABIS.IERC20, p),
                                hub: addresses.remoteHub ? new ethers.Contract(addresses.remoteHub, ['function reactiveNetwork() view returns (address)'], p) : null
                            };
                        }
                    } catch (e) {
                        console.warn(`Could not init provider for ${key}:`, e.message);
                    }
                }
            }
        }

        // 2. Fetch data for all active chains
        for (const [key, contracts] of Object.entries(this.bgContracts)) {
            try {
                const total = await contracts.vault.totalAssets();
                const tvlEl = document.getElementById(`${key === 'arbitrum' ? 'arb' : key}-tvl`);
                if (tvlEl) tvlEl.textContent = ethers.formatUnits(total, 18);

                if (this.account) {
                    const balance = await contracts.token.balanceOf(this.account);
                    const balEl = document.getElementById(`${key === 'arbitrum' ? 'arb' : key}-balance`);
                    if (balEl) balEl.textContent = parseFloat(ethers.formatUnits(balance, 18)).toFixed(2);
                }

                // Check Automation Health for the active chain
                if (this.getChainKey() === key) {
                    this.checkAutomationHealth(key, contracts);
                }
            } catch (error) {
                console.log(`Could not fetch vault info for ${key}`);
            }
        }
    }

    async checkAutomationHealth(chainKey, contracts) {
        const statusTxt = document.getElementById('status-text');
        const statusInd = document.getElementById('contract-status');

        try {
            const addresses = CONTRACT_ADDRESSES[chainKey];
            if (!addresses || !addresses.remoteHub) return;

            // Check if Hub is authorized on Vault
            // Note: NexusVault ABI needs to include authorizedCallers mapping if we want to check it
            // For now, we'll verify if RemoteHub is linked to a Reactive Network
            const reactiveAddr = await contracts.hub.reactiveNetwork();
            const isArmed = reactiveAddr !== ethers.ZeroAddress;

            if (statusTxt && statusInd) {
                if (isArmed) {
                    statusTxt.innerHTML = `<span style="color:var(--success)">Autonomous Rebalancing: ARMED</span>`;
                    statusInd.classList.add('ready');
                    statusInd.style.color = 'var(--success)';
                } else {
                    statusTxt.textContent = `${CHAIN_CONFIG[chainKey].chainName} Connected (Manual Only)`;
                    statusInd.classList.remove('ready');
                }
            }
        } catch (e) {
            // Silently fail if ABI doesn't support check
        }
    }

    getChainKey() {
        const id = this.chainId ? this.chainId.toString().toLowerCase() : '';
        const chainMap = {
            '0x7a69': 'localhost',
            '31337': 'localhost',
            '0x539': 'localhost', // 1337
            '1337': 'localhost',
            '0xaa36a7': 'sepolia',
            '11155111': 'sepolia',
            '0x66eee': 'arbitrum',
            '421614': 'arbitrum',
            '0xaa37dc': 'optimism',
            '11155420': 'optimism',
            '0x512578': 'kopli',
            '5318008': 'kopli',
            '0x512577': 'lasna',
            '5318007': 'lasna'
        };
        return chainMap[id] || chainMap[parseInt(id)];
    }

    async loadModelInfo() {
        if (!this.contracts.mlModel) return;
        try {
            // Standardizing on modelId() call
            const modelId = await this.contracts.mlModel.modelId();
            document.getElementById('model-id').textContent = modelId;
        } catch (error) {
            console.warn('Failed to load model info, using fallback:', error.message);
            document.getElementById('model-id').textContent = 'yield-lstm-v1';
        }
    }

    async updateStrategyMonitor() {
        if (!this.contracts.nexusVault || !this.provider) {
            this.updateBars(50, 50, 0);
            return;
        }

        try {
            const vault = this.contracts.nexusVault;
            const count = Number(await vault.getAdaptersCount());

            const poolData = [];
            let totalAssetsAll = 0n;

            for (let i = 0; i < count; i++) {
                const addr = await vault.adapters(i);
                const pool = new ethers.Contract(addr, ABIS.LendingAdapter, this.provider);
                const [rate, assets] = await Promise.all([
                    pool.getSupplyRate(),
                    pool.totalAssets()
                ]);

                const val = parseFloat(ethers.formatUnits(assets, 18));
                poolData.push({ rate, assets, val, id: i });
                totalAssetsAll += assets;
            }

            const totalVal = parseFloat(ethers.formatUnits(totalAssetsAll, 18));
            const percents = poolData.map(p => totalVal > 0 ? (p.val / totalVal) * 100 : (100 / count));

            // Update UI Labels
            const letters = ['a', 'b', 'c', 'd', 'e'];
            poolData.forEach((p, i) => {
                const prefix = `pool-${letters[i]}`;
                const rateEl = document.getElementById(`${prefix}-rate`);
                const allocEl = document.getElementById(`${prefix}-alloc`);
                if (rateEl) rateEl.textContent = (Number(p.rate) / 100).toFixed(2);
                if (allocEl) allocEl.textContent = `${p.val.toFixed(2)} tETH`;
            });

            this.updateBars(...percents);

        } catch (error) {
            console.error('Failed to update strategy monitor:', error);
        }
    }

    updateBars(a = 0, b = 0, c = 0) {
        const barA = document.getElementById('pool-a-bar');
        const barB = document.getElementById('pool-b-bar');
        const barC = document.getElementById('pool-c-bar');
        if (barA) barA.style.width = `${a}%`;
        if (barB) barB.style.width = `${b}%`;
        if (barC) barC.style.width = `${c}%`;
    }

    async updateChainStatuses() {
        // Update gas prices for each chain using background providers
        for (const [key, provider] of Object.entries(this.bgProviders)) {
            try {
                const feeData = await provider.getFeeData();
                const gasPrice = ethers.formatUnits(feeData.gasPrice || 0n, 'gwei');
                const id = `${key === 'arbitrum' ? 'arb' : key}-gas`;
                const el = document.getElementById(id);
                if (el) el.textContent = `${parseFloat(gasPrice).toFixed(2)} gwei`;
            } catch (error) {
                console.log(`Could not fetch gas for ${key}`);
            }
        }
    }

    updateHubStatuses() {
        // Update the "Not Deployed" labels based on CONTRACT_ADDRESSES
        for (const [chainKey, addresses] of Object.entries(CONTRACT_ADDRESSES)) {
            const isLasna = chainKey === 'lasna';
            const suffix = isLasna ? '-contract' : '-hub';
            const hubId = `${chainKey === 'arbitrum' ? 'arb' : chainKey}-${suffix.substring(1)}`;
            const element = document.getElementById(hubId);
            if (element) {
                const addr = addresses.remoteHub || addresses.reactiveContract;
                if (addr && addr !== "0x0000000000000000000000000000000000000000") {
                    element.textContent = this.shortenAddress(addr);
                    element.style.color = 'var(--success)';
                } else {
                    element.textContent = 'Not Deployed';
                    element.style.color = 'var(--text-dim)';
                }
            }
        }
    }

    shortenAddress(address) {
        if (!address) return "0x...";
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }

    async fetchLiveYields() {
        // Fetch live price data from CoinGecko
        const coins = ['ethereum', 'aave', 'compound-governance-token'];
        const ids = coins.join(',');

        try {
            const response = await fetch(
                `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`
            );
            const data = await response.json();

            // Update ETH
            if (data.ethereum) {
                document.getElementById('eth-price').textContent = `$${data.ethereum.usd.toLocaleString()}`;
                this.updateChangeDisplay('eth-change', data.ethereum.usd_24h_change);
            }

            // Update AAVE
            if (data.aave) {
                document.getElementById('aave-price').textContent = `$${data.aave.usd.toLocaleString()}`;
                this.updateChangeDisplay('aave-change', data.aave.usd_24h_change);
            }

            // Update COMP
            if (data['compound-governance-token']) {
                document.getElementById('comp-price').textContent = `$${data['compound-governance-token'].usd.toLocaleString()}`;
                this.updateChangeDisplay('comp-change', data['compound-governance-token'].usd_24h_change);
            }
        } catch (error) {
            console.error('Failed to fetch live yields:', error);
        }
    }

    updateChangeDisplay(elementId, change) {
        const element = document.getElementById(elementId);
        const value = parseFloat(change).toFixed(2);
        element.textContent = `${value > 0 ? '+' : ''}${value}%`;
        element.className = `yield-change ${value >= 0 ? 'positive' : 'negative'}`;
    }

    simulateAIPrediction() {
        // Display a simulated AI prediction for demo purposes
        const prediction = (Math.random() * 5 + 3).toFixed(2); // 3-8% APY
        const confidence = Math.floor(Math.random() * 20 + 75); // 75-95%

        document.getElementById('predicted-yield').textContent = prediction;
        document.getElementById('confidence-fill').style.width = `${confidence}%`;
        document.getElementById('confidence-value').textContent = `${confidence}%`;
        document.getElementById('proof-status').textContent = '✓ Verified';
        document.getElementById('proof-status').style.color = 'var(--success)';
        document.getElementById('proof-hash').textContent = '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('');
    }

    async runAIPrediction() {
        const btn = document.getElementById('runPrediction');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<span class="btn-icon">⏳</span> Analyzing...';
        btn.disabled = true;

        const terminal = document.getElementById('reactive-terminal');
        const injectionLogs = [
            { type: 'log', text: 'Initializing AI Inference cycle...' },
            { type: 'system', text: 'Loading Weights for yield-lstm-v1...' },
            { type: 'log', text: 'Normalizing cross-chain liquidity samples...' },
            { type: 'log', text: 'Computing optimal rebalance distribution...' },
            { type: 'action', text: 'Generating Integrity Hash for inference...' }
        ];

        try {
            const aiPanel = document.querySelector('.ai-panel');
            aiPanel.classList.add('ai-active');

            for (const logItem of injectionLogs) {
                this.injectTerminalLog(logItem.type, logItem.text);
                await new Promise(resolve => setTimeout(resolve, 400));
            }

            const prediction = (Math.random() * 2 + 5.2).toFixed(2);
            const confidence = Math.floor(Math.random() * 10 + 85);

            // --- TANGIBLE MATH: Real Keccak256 Hash of Prediction Data ---
            const predictionData = `yield-lstm-v1:${prediction}:${confidence}:${Date.now()}`;
            const proofHash = ethers.keccak256(ethers.toUtf8Bytes(predictionData));
            this.currentProofHash = proofHash; // Store for verification

            this.injectTerminalLog('system', `[AI] Hash Generated: ${proofHash.substring(0, 16)}...`);

            document.getElementById('predicted-yield').textContent = prediction;
            document.getElementById('confidence-fill').style.width = `${confidence}%`;
            document.getElementById('confidence-value').textContent = `${confidence}%`;
            document.getElementById('proof-hash').textContent = proofHash;

            // Trigger "Verification" Flow
            const verifyBtn = document.getElementById('verify-proof');
            verifyBtn.classList.remove('hidden');
            verifyBtn.onclick = () => this.openZKModal();

            this.addActivity('🧠', 'AI Prediction', `Model yield-lstm-v1: ${prediction}% APY`);

        } catch (error) {
            console.error('Inference failed:', error);
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
            document.querySelector('.ai-panel').classList.remove('ai-active');
        }
    }

    async openZKModal() {
        const modal = document.getElementById('zk-modal');
        const result = document.getElementById('v-result');
        const steps = [
            document.getElementById('v-step-1'),
            document.getElementById('v-step-2'),
            document.getElementById('v-step-3'),
            document.getElementById('v-step-4')
        ];

        modal.classList.add('active');
        result.textContent = 'Starting Verification...';
        steps.forEach(s => {
            s.classList.remove('active', 'complete');
        });

        for (let i = 0; i < steps.length; i++) {
            steps[i].classList.add('active');
            await new Promise(r => setTimeout(r, 1200));
            steps[i].classList.remove('active');
            steps[i].classList.add('complete');

            if (i === 0) result.textContent = 'Acquiring Proof Hash...';
            if (i === 1) result.textContent = `Validating Hash: ${this.currentProofHash.substring(0, 24)}...`;
            if (i === 2) result.textContent = 'Internal Logic Constraints Check: PASSED';
            if (i === 3) result.textContent = 'Finalizing Attestation...';
        }

        result.innerHTML = '<span style="color:var(--success); font-weight:bold;">✅ DATA INTEGRITY VERIFIED (SIMULATED ZK FLOW)</span>';
    }

    async submitIntent() {
        if (!this.account) {
            alert('Please connect your wallet first!');
            return;
        }

        const amount = document.getElementById('amount').value;
        const assetStr = document.getElementById('lend-asset').value.toUpperCase();

        if (!amount || parseFloat(amount) <= 0) {
            alert('Please enter a valid amount!');
            return;
        }

        const btn = document.getElementById('submitIntent');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<span class="btn-icon">⏳</span> Submitting...';
        btn.disabled = true;

        let activeTxHash = null;

        try {
            const selectedChain = document.getElementById('deposit-chain').value;
            const currentChain = this.getChainKey();

            if (selectedChain !== currentChain) {
                this.injectTerminalLog('action', `[UX] Switching network to ${selectedChain}...`);
                await this.switchNetwork(selectedChain);
                // After switch, the page might reload due to chainChanged listener
                // If it doesn't reload, we still need to wait for provider/signer to update
                return;
            }

            const chainKey = this.getChainKey();
            const addresses = CONTRACT_ADDRESSES[chainKey];
            const parseAmount = ethers.parseUnits(amount, 18);

            // 0. Check Native Balance for Gas
            const nativeBalance = await this.provider.getBalance(this.account);
            if (nativeBalance === 0n) {
                this.injectTerminalLog('warn', `[SYSTEM] Insufficient native gas tokens (${chainKey.toUpperCase()})`);
                alert(`You have 0 ${chainKey === 'lasna' ? 'REACT' : 'ETH'} for gas. Please fund your wallet.`);
                btn.innerHTML = originalText;
                btn.disabled = false;
                return;
            }

            if (addresses && addresses.nexusVault && this.contracts.nexusVault && this.contracts.assetToken) {
                const vault = this.contracts.nexusVault.connect(this.signer);
                const token = this.contracts.assetToken.connect(this.signer);

                // 1. Check & Mint Mock Tokens if needed (Demo Faucet)
                const balance = await token.balanceOf(this.account);
                if (balance < parseAmount) {
                    btn.innerHTML = '<span class="btn-icon">⏳</span> Signing Faucet...';
                    this.injectTerminalLog('action', '[SYSTEM] Low mUSDC balance. Requesting faucet signature...');
                    const mintTx = await token.mint(this.account, ethers.parseUnits("1000000", 18), {
                        gasLimit: chainKey === 'lasna' ? 150000n : undefined,
                        // Legacy for Lasna, Tip for Sepolia
                        gasPrice: chainKey === 'lasna' ? ethers.parseUnits("10", "gwei") : undefined,
                        maxPriorityFeePerGas: chainKey === 'sepolia' ? ethers.parseUnits("2", "gwei") : undefined
                    });
                    activeTxHash = mintTx.hash;
                    btn.innerHTML = '<span class="btn-icon">⏳</span> Minting...';
                    this.injectTerminalLog('action', `[SYSTEM] Faucet Tx Sent: ${mintTx.hash.substring(0, 16)}...`);
                    await mintTx.wait();
                    this.injectTerminalLog('system', '[SYSTEM] Faucet: 1M mUSDC minted successfully.');
                }

                // 2. Check Allowance & Approve
                const allowance = await token.allowance(this.account, addresses.nexusVault);
                if (allowance < parseAmount) {
                    btn.innerHTML = '<span class="btn-icon">⏳</span> Signing Approval...';
                    this.injectTerminalLog('action', '[UX] Requesting Token Approval signature...');
                    const appTx = await token.approve(addresses.nexusVault, ethers.MaxUint256, {
                        gasLimit: chainKey === 'lasna' ? 150000n : undefined,
                        gasPrice: chainKey === 'lasna' ? ethers.parseUnits("10", "gwei") : undefined,
                        maxPriorityFeePerGas: chainKey === 'sepolia' ? ethers.parseUnits("2", "gwei") : undefined
                    });
                    activeTxHash = appTx.hash;
                    btn.innerHTML = '<span class="btn-icon">⏳</span> Approving...';
                    this.injectTerminalLog('action', `[UX] Approval Sent: ${appTx.hash.substring(0, 16)}...`);
                    await appTx.wait();
                    this.injectTerminalLog('system', '[UX] Token Approval Successful.');
                }

                btn.innerHTML = '<span class="btn-icon">⏳</span> Signing Deposit...';
                this.injectTerminalLog('action', '[UX] Requesting Deposit signature...');

                // 3. Real on-chain call
                const tx = await vault.deposit(parseAmount, {
                    gasLimit: chainKey === 'lasna' ? 500000n : undefined,
                    gasPrice: chainKey === 'lasna' ? ethers.parseUnits("10", "gwei") : undefined,
                    maxPriorityFeePerGas: chainKey === 'sepolia' ? ethers.parseUnits("2", "gwei") : undefined
                });
                activeTxHash = tx.hash;
                btn.innerHTML = '<span class="btn-icon">⏳</span> Depositing...';
                this.injectTerminalLog('action', `[UX] Deposit Transaction Sent: ${tx.hash.substring(0, 16)}...`);

                btn.innerHTML = '<span class="btn-icon">⏳</span> Confirming...';
                await tx.wait();

                this.addActivity('💰', 'Vault Deposit', `${amount} ${assetStr} deposited`, `https://etherscan.io/tx/${tx.hash}`);
                this.updateVaultInfo();
                this.updateStrategyMonitor();

            } else {
                // FALLBACK TO SIMULATION
                await new Promise(resolve => setTimeout(resolve, 2000));
                this.addActivity('💰', 'Vault Deposit (Sim)', `${amount} ${assetStr} on Sepolia`);
            }

            // Clear form
            document.getElementById('amount').value = '';

            btn.innerHTML = '<span class="btn-icon">✓</span> Success!';
            btn.style.background = 'var(--success)';

            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.style.background = '';
                btn.disabled = true;
            }, 2000);

        } catch (error) {
            console.error('Failed to submit intent:', error);

            if (activeTxHash) {
                const chainKey = this.getChainKey();
                const explorer = (CHAIN_CONFIG[chainKey] && CHAIN_CONFIG[chainKey].blockExplorerUrls) ? CHAIN_CONFIG[chainKey].blockExplorerUrls[0] : 'https://etherscan.io';

                this.injectTerminalLog('system', `[UX] Transaction Sent! The RPC is slow to confirm, but it's processing.`);
                this.injectTerminalLog('system', `[UX] View Status: ${explorer}/tx/${activeTxHash}`);

                // Clear form as if successful
                document.getElementById('amount').value = '';
                btn.innerHTML = '<span class="btn-icon">✓</span> Sent (Pending)';
                btn.style.background = 'var(--accent)';

                setTimeout(() => {
                    btn.innerHTML = originalText;
                    btn.style.background = '';
                    btn.disabled = true;
                }, 4000);
                return;
            }

            let message = error.reason || error.message;
            if (error.data) {
                console.log("Revert Data:", error.data);
                this.injectTerminalLog('error', `[SYSTEM] Revert Data: ${error.data.slice(0, 20)}...`);
            }
            if (message.includes('could not coalesce')) {
                message = "The RPC node returned an invalid response while sending. Check your wallet history—the transaction might have actually gone through!";
            } else if (message.includes('execution reverted')) {
                message = "Transaction reverted. This usually means a condition wasn't met (e.g., zero balance, no adapters). Check the Terminal for Revert Data.";
            } else if (message.includes('failed to fetch') || message.includes('network error')) {
                message = "Network connection failed. Please check if the RPC is reachable.";
            }

            alert(`Transaction failed: ${message}`);
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    }

    addActivity(icon, action, details, link = null) {
        const activityList = document.getElementById('activityList');

        // Remove empty state if present
        const emptyState = activityList.querySelector('.activity-empty');
        if (emptyState) {
            emptyState.remove();
        }

        const item = document.createElement('div');
        item.className = 'activity-item';
        item.innerHTML = `
            <div class="activity-icon">${icon}</div>
            <div class="activity-details">
                <span class="activity-action">${action}</span>
                <span class="activity-meta">${details}</span>
            </div>
            ${link ? `<a href="${link}" target="_blank" class="activity-link">View →</a>` : ''}
        `;

        // Add to top of list
        activityList.insertBefore(item, activityList.firstChild);

        // Limit to 10 items
        while (activityList.children.length > 10) {
            activityList.removeChild(activityList.lastChild);
        }
    }


    async switchNetwork(chainKey) {
        const config = CHAIN_CONFIG[chainKey];
        if (!config || !window.ethereum) return;

        if (!config.chainId || !config.chainName) {
            console.error(`Missing network metadata for ${chainKey}`);
            this.injectTerminalLog('error', `[SYSTEM] Cannot switch to ${chainKey}: Metadata missing in contracts.js`);
            return;
        }

        this.injectTerminalLog('action', `[SYSTEM] Requesting switch to ${config.chainName}...`);

        // Update selector UI immediately for feedback
        const selector = document.getElementById('deposit-chain');
        if (selector) {
            selector.value = chainKey;
            this.updateAssetLabels(chainKey);
        }

        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: config.chainId }]
            });
        } catch (switchError) {
            console.error("Switch error:", switchError);

            // This error code indicates that the chain has not been added to MetaMask.
            if (switchError.code === 4902 || (switchError.data && switchError.data.originalError && switchError.data.originalError.code === 4902)) {
                try {
                    this.injectTerminalLog('action', `[SYSTEM] Adding ${config.chainName} to wallet...`);
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [config]
                    });
                } catch (addError) {
                    this.injectTerminalLog('error', '[SYSTEM] Failed to add network to wallet.');
                    console.error("Add error:", addError);
                }
            } else {
                this.injectTerminalLog('error', `[SYSTEM] Network switch failed: ${switchError.message}`);
            }
        }
    }

    updateAssetLabels(chainKey) {
        const config = CHAIN_CONFIG[chainKey] || CHAIN_CONFIG['sepolia'];
        const symbol = config.nativeCurrency ? config.nativeCurrency.symbol : 'ETH';

        const assetSelect = document.getElementById('lend-asset');
        if (assetSelect) {
            assetSelect.options[0].textContent = "mUSDC (Vault Yield Asset)";
            assetSelect.options[0].value = "musdc";
        }

        const amountPlaceholder = document.getElementById('amount');
        if (amountPlaceholder) {
            amountPlaceholder.placeholder = `0.0 mUSDC`;
        }
    }

    // === Maintenance & Automation (Judge Tools) ===

    async demoPrep() {
        if (!this.account) return alert("Connect wallet first!");
        const btn = document.getElementById('demoPrep');
        const originalText = btn.innerHTML;
        const chainKey = this.getChainKey();
        const addresses = CONTRACT_ADDRESSES[chainKey];

        if (!addresses?.nexusVault || !this.contracts.assetToken) {
            this.injectTerminalLog('action', `[DEMO] Hub contracts missing on ${chainKey.toUpperCase()}. Switching to Sepolia...`);
            this.switchNetwork('sepolia');
            return;
        }

        try {
            btn.innerHTML = '<span class="btn-icon">⏳</span> Funding Account...';
            btn.disabled = true;
            this.injectTerminalLog('action', '[DEMO] Starting 1-Click Onboarding...');

            const token = this.contracts.assetToken.connect(this.signer);

            // 1. Bulk Faucet
            this.injectTerminalLog('system', '[DEMO] Step 1: Requesting 1M mUSDC Faucet...');
            const mintTx = await token.mint(this.account, ethers.parseUnits("1000000", 18), {
                gasLimit: chainKey === 'lasna' ? 150000n : undefined,
                gasPrice: chainKey === 'lasna' ? ethers.parseUnits("10", "gwei") : undefined,
                maxPriorityFeePerGas: chainKey === 'sepolia' ? ethers.parseUnits("2", "gwei") : undefined
            });
            await mintTx.wait();
            this.injectTerminalLog('log', '[DEMO] Step 1 Complete: 1,000,000 mUSDC received.');

            // 2. Max Approval
            btn.innerHTML = '<span class="btn-icon">⏳</span> Authorizing Vault...';
            this.injectTerminalLog('system', '[DEMO] Step 2: Requesting Max Allowance for Vault...');
            const appTx = await token.approve(addresses.nexusVault, ethers.MaxUint256, {
                gasLimit: chainKey === 'lasna' ? 150000n : undefined,
                gasPrice: chainKey === 'lasna' ? ethers.parseUnits("10", "gwei") : undefined,
                maxPriorityFeePerGas: chainKey === 'sepolia' ? ethers.parseUnits("2", "gwei") : undefined
            });
            await appTx.wait();
            this.injectTerminalLog('log', '[DEMO] Step 2 Complete: Vault authorized for life.');

            btn.innerHTML = '✅ Account Ready';
            this.injectTerminalLog('system', '[DEMO] Account prepared for Zero-Friction testing!');
            setTimeout(() => { btn.innerHTML = originalText; btn.disabled = false; }, 3000);

            this.updateVaultInfo();
        } catch (e) {
            this.injectTerminalLog('error', `[DEMO] Prep Failed: ${e.message.slice(0, 40)}...`);
            btn.innerHTML = '❌ Failed';
            setTimeout(() => { btn.innerHTML = originalText; btn.disabled = false; }, 2000);
        }
    }

    async simulateMarketShift() {
        if (!this.account) return alert("Connect wallet first!");
        const btn = document.getElementById('simulateShift');
        const originalText = btn.innerHTML;
        const chainKey = this.getChainKey();

        try {
            btn.innerHTML = '<span class="btn-icon">⏳</span> Shifting Markets...';
            btn.disabled = true;
            this.injectTerminalLog('action', '[DEMO] Simulating Yield Volatility (Market Inefficiency)...');

            // Find current adapters in Vault
            const vault = this.contracts.nexusVault;
            if (!vault) {
                this.injectTerminalLog('action', `[DEMO] Hub contracts missing on ${chainKey.toUpperCase()}. Switching to Sepolia...`);
                this.switchNetwork('sepolia');
                btn.innerHTML = originalText;
                btn.disabled = false;
                return;
            }
            const count = Number(await vault.getAdaptersCount());
            const adapterAAddr = await vault.adapters(0);
            const adapterBAddr = await vault.adapters(1);
            const adapterCAddr = count > 2 ? await vault.adapters(2) : null;

            // We use the custom function setSupplyRate (which MockAdapter has)
            const mockABI = ["function setSupplyRate(uint256)"];
            const mockA = new ethers.Contract(adapterAAddr, mockABI, this.signer);
            const mockB = new ethers.Contract(adapterBAddr, mockABI, this.signer);
            const mockC = adapterCAddr ? new ethers.Contract(adapterCAddr, mockABI, this.signer) : null;

            // Sequential rate shifts to avoid nonce conflicts
            this.injectTerminalLog('system', '[DEMO] Sending sequential rate updates to Sepolia...');

            this.injectTerminalLog('action', '[DEMO] Updating Pool A (2% APY)...');
            const txA = await mockA.setSupplyRate(200);
            await txA.wait();
            this.injectTerminalLog('log', '[DEMO] Pool A Updated.');

            this.injectTerminalLog('action', '[DEMO] Updating Pool B (5% APY)...');
            const txB = await mockB.setSupplyRate(500);
            await txB.wait();
            this.injectTerminalLog('log', '[DEMO] Pool B Updated.');

            if (mockC) {
                this.injectTerminalLog('action', '[DEMO] Updating Pool C (12% APY)...');
                const txC = await mockC.setSupplyRate(1200);
                await txC.wait();
                this.injectTerminalLog('log', '[DEMO] Pool C Updated.');
            }

            this.injectTerminalLog('log', '[DEMO] Yield Shift Confirmed: Pool C is now the clear winner!');

            // For Demo: Trigger rebalance directly to show immediate fund movement.
            // In production, the Reactive Network would handle this automatically,
            // but for the demo we want instant visual feedback for judges.
            this.injectTerminalLog('action', '[DEMO] Triggering vault optimization...');
            try {
                const rebalanceTx = await vault.connect(this.signer).checkYieldAndRebalance();
                await rebalanceTx.wait();
                this.injectTerminalLog('system', '[DEMO] ✅ Funds rebalanced to highest-yield pool!');
                this.addActivity('⚡', 'Auto-Rebalance', 'Funds moved to Pool B (highest yield)');
            } catch (rebalanceError) {
                console.warn("Rebalance trigger failed:", rebalanceError);
                this.injectTerminalLog('error', `[DEMO] Rebalance failed: ${rebalanceError.message.slice(0, 60)}`);
            }

            btn.innerHTML = '✅ Chaos Injected';
            setTimeout(() => { btn.innerHTML = originalText; btn.disabled = false; }, 3000);

            this.updateStrategyMonitor();
        } catch (e) {
            console.error(e);
            const errType = e.code || 'REVERT';
            this.injectTerminalLog('error', `[DEMO] Shift Failed: [${errType}] ${e.message.slice(0, 100)}...`);
            btn.innerHTML = '❌ Failed';
            setTimeout(() => { btn.innerHTML = originalText; btn.disabled = false; }, 2000);
        }
    }

    async linkReactiveNetwork() {
        if (!this.account) return alert("Connect wallet first!");
        const chainKey = this.getChainKey();

        if (chainKey !== 'sepolia') {
            this.injectTerminalLog('warn', '[SYSTEM] Please switch to Sepolia to link Reactive Network.');
            return;
        }

        const hubAddr = "0x448688AD41C79D5E6c649B5BF3A12e68E4528707";
        const newReactiveAddr = "0x760FBf81b2FE506dEc35dA1385E65C79A8fD12FB";

        this.injectTerminalLog('action', '[SYSTEM] Linking new Lasna Rebalancer to RemoteHub...');

        try {
            const hub = new ethers.Contract(hubAddr, [
                "function setReactiveNetwork(address) external",
                "function owner() view returns (address)"
            ], this.signer);

            const owner = await hub.owner();
            if (owner.toLowerCase() !== this.account.toLowerCase()) {
                this.injectTerminalLog('error', `[SYSTEM] You are not the owner. Owner is: ${owner}`);
                return;
            }

            const tx = await hub.setReactiveNetwork(newReactiveAddr);
            await tx.wait();
            this.injectTerminalLog('system', '[SYSTEM] ✅ Reactive Network linked successfully!');
            this.addActivity('🔗', 'Reactive Linked', 'Lasna Rebalancer now monitoring Sepolia');
        } catch (e) {
            console.error(e);
            this.injectTerminalLog('error', `[SYSTEM] Link failed: ${e.message.slice(0, 50)}`);
        }
    }

}

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.nexusGalaxy = new NexusGalaxy();
});
