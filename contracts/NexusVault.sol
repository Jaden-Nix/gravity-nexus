// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./interfaces/ILendingAdapter.sol";

contract NexusVault is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;
    
    IERC20 public immutable asset;
    ILendingAdapter[] public adapters;
    mapping(address => bool) public authorizedCallers;
    uint256 public yieldThresholdBps = 50; // 0.5% in basis points (100 = 1%)
    uint256 public constant MAX_ADAPTERS = 20; // Prevent DoS via excessive loops

    event Deposited(address indexed user, uint256 amount, uint256 indexed adapterIdx);
    event Withdrawn(address indexed user, uint256 amount);
    event Rebalanced(uint256 indexed fromIdx, uint256 indexed toIdx, uint256 amount);
    event AdapterAdded(address indexed adapter, uint256 index);
    event AuthorizationUpdated(address indexed caller, bool status);
    event ThresholdUpdated(uint256 newThreshold);
    event EmergencyPaused(address indexed by);
    event EmergencyUnpaused(address indexed by);

    constructor(address _asset) Ownable(msg.sender) {
        asset = IERC20(_asset);
    }

    modifier onlyAuthorized() {
        require(authorizedCallers[msg.sender] || msg.sender == owner(), "Vault: Unauthorized caller");
        _;
    }

    function setAuthorization(address _caller, bool _status) external onlyOwner {
        authorizedCallers[_caller] = _status;
        emit AuthorizationUpdated(_caller, _status);
    }

    function setYieldThreshold(uint256 _thresholdBps) external onlyOwner {
        require(_thresholdBps <= 10000, "Vault: Threshold too high");
        yieldThresholdBps = _thresholdBps;
        emit ThresholdUpdated(_thresholdBps);
    }

    function addAdapter(address _adapter) external onlyOwner {
        require(_adapter != address(0), "Vault: Invalid adapter address");
        require(adapters.length < MAX_ADAPTERS, "Vault: Max adapters reached");
        adapters.push(ILendingAdapter(_adapter));
        emit AdapterAdded(_adapter, adapters.length - 1);
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
     * @notice Find the current highest yielding adapter
     */
    function getBestAdapterIdx() public view returns (uint256 bestIdx, uint256 highestRate) {
        uint256 count = adapters.length;
        if (count == 0) return (0, 0);
        
        for (uint256 i; i < count; ++i) {
            uint256 rate = adapters[i].getSupplyRate();
            if (rate > highestRate) {
                highestRate = rate;
                bestIdx = i;
            }
        }
    }

    /**
     * @notice Deposit into the highest yielding pool automatically
     * @param amount Amount of tokens to deposit
     */
    function deposit(uint256 amount) external nonReentrant whenNotPaused {
        require(amount > 0, "Vault: Amount must be > 0");
        require(adapters.length > 0, "Vault: No adapters added");
        
        asset.safeTransferFrom(msg.sender, address(this), amount);
        
        (uint256 bestIdx, ) = getBestAdapterIdx();
        
        // Approve only the amount needed for this deposit
        asset.safeIncreaseAllowance(address(adapters[bestIdx]), amount);
        adapters[bestIdx].deposit(amount);
        
        emit Deposited(msg.sender, amount, bestIdx);
    }

    /**
     * @notice Intelligent withdrawal that scans all adapters for liquidity
     * @param amount Amount of tokens to withdraw
     */
    function withdraw(uint256 amount) external nonReentrant whenNotPaused {
        require(amount > 0, "Vault: Amount must be > 0");
        require(adapters.length > 0, "Vault: No adapters added");
        
        uint256 count = adapters.length;
        uint256 remaining = amount;
        
        // Simple scan: withdraw from any pool that has funds
        for (uint256 i; i < count && remaining > 0; ++i) {
            uint256 poolBalance = adapters[i].totalAssets();
            if (poolBalance > 0) {
                uint256 toWithdraw = remaining > poolBalance ? poolBalance : remaining;
                adapters[i].withdraw(toWithdraw);
                remaining -= toWithdraw;
            }
        }
        
        require(remaining == 0, "Vault: Insufficient liquidity");
        asset.safeTransfer(msg.sender, amount);
        emit Withdrawn(msg.sender, amount);
    }

    function rebalance(uint256 fromIdx, uint256 toIdx, uint256 amount) public onlyAuthorized nonReentrant whenNotPaused {
        _rebalance(fromIdx, toIdx, amount);
    }

    function _rebalance(uint256 fromIdx, uint256 toIdx, uint256 amount) internal {
        require(fromIdx < adapters.length && toIdx < adapters.length, "Vault: Invalid adapter index");
        require(fromIdx != toIdx, "Vault: Cannot rebalance to same adapter");
        
        uint256 sourceBalance = adapters[fromIdx].totalAssets();
        uint256 actualWithdraw = amount > sourceBalance ? sourceBalance : amount;
        
        require(actualWithdraw > 0, "Vault: No assets to rebalance from source");

        adapters[fromIdx].withdraw(actualWithdraw);
        
        // Approve only the amount needed for this rebalance
        asset.safeIncreaseAllowance(address(adapters[toIdx]), actualWithdraw);
        adapters[toIdx].deposit(actualWithdraw);
        
        emit Rebalanced(fromIdx, toIdx, actualWithdraw);
    }

    /**
     * @notice Optimized rebalance engine with churn protection (threshold check)
     * @dev AUTHORIZED ONLY - Called by RemoteHub via Reactive Network automation
     *      This keeps rebalancing trustless (automated) but not public (MEV-protected)
     */
    function checkYieldAndRebalance() external onlyAuthorized nonReentrant whenNotPaused {
        uint256 count = adapters.length;
        if (count < 2) return;

        (uint256 bestIdx, uint256 highestRate) = getBestAdapterIdx();

        // Check every other pool
        for (uint256 i; i < count; ++i) {
            if (i == bestIdx) continue;
            
            uint256 balance = adapters[i].totalAssets();
            if (balance > 0) {
                uint256 currentRate = adapters[i].getSupplyRate();
                // Only move if benefit > threshold (prevents gas waste for minor gains)
                if (highestRate > currentRate && (highestRate - currentRate) >= yieldThresholdBps) {
                    _rebalance(i, bestIdx, balance);
                }
            }
        }
    }

    /**
     * @notice Total assets managed by this vault across all pools
     */
    function totalAssets() external view returns (uint256 total) {
        uint256 length = adapters.length;
        for (uint256 i; i < length; ++i) {
            total += adapters[i].totalAssets();
        }
    }

    function getAdaptersCount() external view returns (uint256) {
        return adapters.length;
    }
}
