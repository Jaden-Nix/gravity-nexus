// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

interface ILendingPool {
    function deposit(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external;
    function withdraw(address asset, uint256 amount, address to) external returns (uint256);
}

contract RemoteHub is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    ILendingPool public lendingPool;
    address public vault;
    address public reactiveNetwork;
    
    event ActionExecuted(string actionType, bool success, bytes data);
    event LendingPoolUpdated(address indexed newPool);
    event ReactiveNetworkUpdated(address indexed newNetwork);
    event FundsRecovered(address indexed token, address indexed to, uint256 amount);
    event ReactiveCallbackReceived(string action, bytes params);
    event EmergencyPaused(address indexed by);
    event EmergencyUnpaused(address indexed by);

    constructor() Ownable(msg.sender) {}

    /**
     * @notice Set the lending pool address for cross-chain lending operations
     * @param _pool Address of the Aave-compatible lending pool
     */
    function setLendingPool(address _pool) external onlyOwner {
        require(_pool != address(0), "RemoteHub: Invalid pool address");
        lendingPool = ILendingPool(_pool);
        emit LendingPoolUpdated(_pool);
    }

    /**
     * @notice Set the vault address
     * @param _vault Address of the NexusVault
     */
    function setVault(address _vault) external onlyOwner {
        require(_vault != address(0), "RemoteHub: Invalid vault address");
        vault = _vault;
    }

    /**
     * @notice Set the authorized Reactive Network callback address
     * @param _network The address of the Reactive Network relayer/contract
     */
    function setReactiveNetwork(address _network) external onlyOwner {
        require(_network != address(0), "RemoteHub: Invalid network address");
        reactiveNetwork = _network;
        emit ReactiveNetworkUpdated(_network);
    }
    
    /**
     * @notice Emergency pause mechanism
     */
    function pause() external onlyOwner {
        _pause();
        emit EmergencyPaused(msg.sender);
    }
    
    /**
     * @notice Unpause the contract
     */
    function unpause() external onlyOwner {
        _unpause();
        emit EmergencyUnpaused(msg.sender);
    }

    /**
     * @notice Callback for Reactive Network to trigger rebalancing or other actions
     * @param action The action type
     * @param params ABI-encoded parameters
     */
    function callback(string calldata action, bytes calldata params) external whenNotPaused {
        require(msg.sender == reactiveNetwork, "RemoteHub: Unauthorized callback source");
        
        emit ReactiveCallbackReceived(action, params);
        
        bytes32 actionHash = keccak256(bytes(action));
        if (actionHash == keccak256(bytes("REBALANCE"))) {
            // Decodes rebalance params: (fromIndex, toIndex, amount)
            (uint256 fromIdx, uint256 toIdx, uint256 amount) = abi.decode(params, (uint256, uint256, uint256));
            
            // For now, rebalance is handled by the vault. RemoteHub might need to bridge 
            // or just trigger local rebalance if it's the vault manager.
            // In our current setup, RemoteHub handles LEND/WITHDRAW.
            // A "REBALANCE" at this level usually means WITHDRAW + LEND sequence.
            
            // For demo, we'll route to specific execution logic if needed.
            // But usually the Reactive Network calls specific functions or executeAction.
            _executeAction(action, params);
        } else {
            _executeAction(action, params);
        }
    }

    /**
     * @notice Internal action executor shared by owner and callback
     */
    function _executeAction(string memory action, bytes memory params) internal {
        bytes32 actionHash = keccak256(bytes(action));
        
        if (actionHash == keccak256(bytes("LEND"))) {
            _executeLend(params);
        } else if (actionHash == keccak256(bytes("WITHDRAW"))) {
            _executeWithdraw(params);
        } else if (actionHash == keccak256(bytes("SWAP"))) {
            _executeSwap(params);
        } else if (actionHash == keccak256(bytes("OPTIMIZE"))) {
            _executeOptimize();
        } else {
            emit ActionExecuted(action, false, params);
        }
    }

    /**
     * @notice Entry point for Reactive Network or automation to trigger actions
     * @param action The action type ("LEND", "WITHDRAW", "SWAP")
     * @param params ABI-encoded parameters for the action
     */
    function executeAction(string calldata action, bytes calldata params) external onlyOwner {
        _executeAction(action, params);
    }

    /**
     * @notice Execute a lending deposit to the configured lending pool
     * @param params ABI-encoded (asset, amount) tuple
     */
    function _executeLend(bytes memory params) internal nonReentrant {
        require(address(lendingPool) != address(0), "RemoteHub: Lending pool not set");
        
        (address asset, uint256 amount) = abi.decode(params, (address, uint256));
        require(asset != address(0), "RemoteHub: Invalid asset");
        require(amount > 0, "RemoteHub: Amount must be > 0");
        
        // Ensure we have the funds
        uint256 balance = IERC20(asset).balanceOf(address(this));
        require(balance >= amount, "RemoteHub: Insufficient balance");
        
        // Approve and deposit to lending pool
        IERC20(asset).safeIncreaseAllowance(address(lendingPool), amount);
        
        try lendingPool.deposit(asset, amount, address(this), 0) {
            emit ActionExecuted("LEND", true, params);
        } catch Error(string memory reason) {
            emit ActionExecuted(string(abi.encodePacked("LEND_FAILED: ", reason)), false, params);
        }
    }

    /**
     * @notice Execute a withdrawal from the lending pool
     * @param params ABI-encoded (asset, amount, recipient) tuple
     */
    function _executeWithdraw(bytes memory params) internal nonReentrant {
        require(address(lendingPool) != address(0), "RemoteHub: Lending pool not set");
        
        (address asset, uint256 amount, address recipient) = abi.decode(params, (address, uint256, address));
        require(recipient != address(0), "RemoteHub: Invalid recipient");
        
        try lendingPool.withdraw(asset, amount, recipient) returns (uint256 withdrawn) {
            emit ActionExecuted("WITHDRAW", true, abi.encode(asset, withdrawn, recipient));
        } catch Error(string memory reason) {
            emit ActionExecuted(string(abi.encodePacked("WITHDRAW_FAILED: ", reason)), false, params);
        }
    }

    /**
     * @notice Execute a token swap (placeholder for DEX integration)
     * @param params ABI-encoded swap parameters
     */
    function _executeSwap(bytes memory params) internal {
        // Placeholder: In production, integrate with Uniswap/1inch router
        // (address tokenIn, address tokenOut, uint256 amountIn, uint256 minOut) = abi.decode(params, (address, address, uint256, uint256));
        emit ActionExecuted("SWAP", true, params);
    }

    /**
     * @notice Execute a yield optimization check on the vault
     */
    function _executeOptimize() internal {
        require(vault != address(0), "RemoteHub: Vault not set");
        
        // Call checkYieldAndRebalance on the vault with proper validation
        (bool success, bytes memory returnData) = vault.call(abi.encodeWithSignature("checkYieldAndRebalance()"));
        
        if (!success) {
            // If call failed, check if it was due to revert
            if (returnData.length > 0) {
                // Decode revert reason if available
                emit ActionExecuted("OPTIMIZE_FAILED", false, returnData);
            } else {
                emit ActionExecuted("OPTIMIZE_FAILED", false, "");
            }
        } else {
            emit ActionExecuted("OPTIMIZE", true, "");
        }
    }

    /**
     * @notice Recover stuck funds from the contract
     * @param token The ERC20 token address (or address(0) for native ETH)
     * @param to The recipient address
     */
    function recoverFunds(address token, address to) external onlyOwner {
        require(to != address(0), "RemoteHub: Invalid recipient");
        
        if (token == address(0)) {
            // Recover native ETH
            uint256 balance = address(this).balance;
            require(balance > 0, "RemoteHub: No ETH to recover");
            (bool success, ) = to.call{value: balance}("");
            require(success, "RemoteHub: ETH transfer failed");
            emit FundsRecovered(address(0), to, balance);
        } else {
            // Recover ERC20 tokens
            uint256 balance = IERC20(token).balanceOf(address(this));
            require(balance > 0, "RemoteHub: No tokens to recover");
            IERC20(token).safeTransfer(to, balance);
            emit FundsRecovered(token, to, balance);
        }
    }

    // Allow contract to receive ETH
    receive() external payable {}
}
