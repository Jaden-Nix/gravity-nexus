// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/ILendingAdapter.sol";

interface INexusVault {
    function rebalance(uint256 fromIdx, uint256 toIdx, uint256 amount) external;
    function adapters(uint256 index) external view returns (address);
    function getAdaptersCount() external view returns (uint256);
}

contract ReactiveNexus is Ownable, ReentrancyGuard {
    INexusVault public nexusVault;
    uint256 public yieldThreshold = 100; // 1% difference in basis points (100 = 1%)
    mapping(address => bool) public authorizedCallers;

    event ActionTriggered(string action, uint256 fromIdx, uint256 toIdx, uint256 amount);
    event ActionExecuted(string result);
    event YieldThresholdUpdated(uint256 newThreshold);
    event AuthorizationUpdated(address indexed caller, bool status);

    constructor() Ownable(msg.sender) {}
    
    modifier onlyAuthorized() {
        require(authorizedCallers[msg.sender] || msg.sender == owner(), "ReactiveNexus: Unauthorized caller");
        _;
    }
    
    /**
     * @notice Set authorization for a caller
     * @param _caller Address to authorize/deauthorize
     * @param _status Authorization status
     */
    function setAuthorization(address _caller, bool _status) external onlyOwner {
        require(_caller != address(0), "ReactiveNexus: Invalid caller address");
        authorizedCallers[_caller] = _status;
        emit AuthorizationUpdated(_caller, _status);
    }

    /**
     * @notice Checks yields across all adapters and rebalances if a better opportunity is found.
     * @dev This can be called by a Reactive Network "react" entry point or a periodic automation.
     * @param amountToMove Maximum amount to move in a single rebalance
     */
    function checkYieldAndRebalance(uint256 amountToMove) external onlyAuthorized nonReentrant {
        require(address(nexusVault) != address(0), "ReactiveNexus: Vault not set");
        require(amountToMove > 0, "ReactiveNexus: Amount must be > 0");
        uint256 count = nexusVault.getAdaptersCount();
        require(count >= 2, "ReactiveNexus: Need at least 2 adapters");

        uint256 bestAdapterIdx = 0;
        uint256 highestYield = 0;
        
        // 1. Find the absolute best yielding pool
        for (uint256 i; i < count; ++i) {
            uint256 rate = ILendingAdapter(nexusVault.adapters(i)).getSupplyRate();
            if (rate > highestYield) {
                highestYield = rate;
                bestAdapterIdx = i;
            }
        }

        // 2. Iterate through all pools and move sub-optimal funds
        for (uint256 i; i < count; ++i) {
            if (i == bestAdapterIdx) continue;
            
            ILendingAdapter sourceAdapter = ILendingAdapter(nexusVault.adapters(i));
            uint256 balance = sourceAdapter.totalAssets();
            
            if (balance > 0) {
                uint256 currentYield = sourceAdapter.getSupplyRate();
                // If this pool is sub-optimal by at least the threshold
                if (highestYield > currentYield + yieldThreshold) {
                    uint256 actualAmount = amountToMove > balance ? balance : amountToMove;
                    
                    emit ActionTriggered("REBALANCE", i, bestAdapterIdx, actualAmount);
                    
                    try nexusVault.rebalance(i, bestAdapterIdx, actualAmount) {
                        emit ActionExecuted("Rebalance Success");
                        return; // Successfully rebalanced one leg
                    } catch (bytes memory reason) {
                        emit ActionExecuted(string(abi.encodePacked("Rebalance Failed: ", reason)));
                    }
                }
            }
        }
        emit ActionExecuted("No Rebalance Needed");
    }

    function setVault(address _vault) external onlyOwner {
        require(_vault != address(0), "ReactiveNexus: Invalid vault address");
        nexusVault = INexusVault(_vault);
    }

    function setYieldThreshold(uint256 _threshold) external onlyOwner {
        require(_threshold <= 10000, "ReactiveNexus: Threshold too high");
        yieldThreshold = _threshold;
        emit YieldThresholdUpdated(_threshold);
    }

    // Reactive entry point for Reactive Network (simplified)
    struct LogRecord {
        address source;
        bytes32 topic0;
        bytes data;
    }

    function react(LogRecord calldata /* log */) external {
        // Logic to parse log and trigger checkYieldAndRebalance
        // For the manual demo/deployment, we'll call checkYieldAndRebalance directly
    }
}
