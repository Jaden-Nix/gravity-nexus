// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/ILendingAdapter.sol";

contract NexusVault is Ownable {
    IERC20 public immutable asset;
    ILendingAdapter[] public adapters;
    mapping(address => bool) public authorizedCallers;
    uint256 public yieldThresholdBps = 50; // 0.5% = 50bps

    event Deposited(address indexed user, uint256 amount, uint256 adapterIdx);
    event Withdrawn(address indexed user, uint256 amount);
    event Rebalanced(uint256 fromIdx, uint256 toIdx, uint256 amount);
    event AdapterAdded(address indexed adapter, uint256 index);
    event AuthorizationUpdated(address indexed caller, bool status);
    event ThresholdUpdated(uint256 newThreshold);

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
        yieldThresholdBps = _thresholdBps;
        emit ThresholdUpdated(_thresholdBps);
    }

    function addAdapter(address _adapter) external onlyOwner {
        adapters.push(ILendingAdapter(_adapter));
        // One-time Max Approval for best practice
        asset.approve(_adapter, type(uint256).max);
        emit AdapterAdded(_adapter, adapters.length - 1);
    }

    /**
     * @notice Find the current highest yielding adapter
     */
    function getBestAdapterIdx() public view returns (uint256 bestIdx, uint256 highestRate) {
        uint256 count = adapters.length;
        if (count == 0) return (0, 0);
        
        for (uint256 i = 0; i < count; i++) {
            uint256 rate = adapters[i].getSupplyRate();
            if (rate > highestRate) {
                highestRate = rate;
                bestIdx = i;
            }
        }
    }

    /**
     * @notice Deposit into the highest yielding pool automatically
     */
    function deposit(uint256 amount) external {
        asset.transferFrom(msg.sender, address(this), amount);
        require(adapters.length > 0, "No adapters added");
        
        (uint256 bestIdx, ) = getBestAdapterIdx();
        
        // No need to approve here as we approve MAX in addAdapter
        adapters[bestIdx].deposit(amount);
        emit Deposited(msg.sender, amount, bestIdx);
    }

    /**
     * @notice Intelligent withdrawal that scans all adapters for liquidity
     * Starts with highest yielding pools to minimize opportunity cost
     */
    function withdraw(uint256 amount) external {
        uint256 count = adapters.length;
        require(count > 0, "No adapters added");
        
        uint256 remaining = amount;
        
        // Simple scan: withdraw from any pool that has funds
        for (uint256 i = 0; i < count && remaining > 0; i++) {
            uint256 poolBalance = adapters[i].totalAssets();
            if (poolBalance > 0) {
                uint256 toWithdraw = remaining > poolBalance ? poolBalance : remaining;
                adapters[i].withdraw(toWithdraw);
                remaining -= toWithdraw;
            }
        }
        
        require(remaining == 0, "Vault: Insufficient liquidity");
        asset.transfer(msg.sender, amount);
        emit Withdrawn(msg.sender, amount);
    }

    function rebalance(uint256 fromIdx, uint256 toIdx, uint256 amount) public onlyAuthorized {
        _rebalance(fromIdx, toIdx, amount);
    }

    function _rebalance(uint256 fromIdx, uint256 toIdx, uint256 amount) internal {
        require(fromIdx < adapters.length && toIdx < adapters.length, "Vault: Invalid adapter index");
        
        uint256 sourceBalance = adapters[fromIdx].totalAssets();
        uint256 actualWithdraw = amount > sourceBalance ? sourceBalance : amount;
        
        require(actualWithdraw > 0, "Vault: No assets to rebalance from source");

        adapters[fromIdx].withdraw(actualWithdraw);
        // No need to approve as it's pre-approved to MAX
        adapters[toIdx].deposit(actualWithdraw);
        
        emit Rebalanced(fromIdx, toIdx, actualWithdraw);
    }

    /**
     * @notice Optimized rebalance engine with churn protection (threshold check)
     */
    function checkYieldAndRebalance() external {
        uint256 count = adapters.length;
        if (count < 2) return;

        (uint256 bestIdx, uint256 highestRate) = getBestAdapterIdx();

        // Check every other pool
        for (uint256 i = 0; i < count; i++) {
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
        for (uint256 i = 0; i < adapters.length; i++) {
            total += adapters[i].totalAssets();
        }
    }

    function getAdaptersCount() external view returns (uint256) {
        return adapters.length;
    }
}
