// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../interfaces/ILendingAdapter.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract MockAdapter is ILendingAdapter, Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    IERC20 public immutable underlying;
    uint256 public supplyRate; // Current rate in basis points (100 = 1%)
    
    // Simulate protocol holdings
    uint256 private _totalDeposited;

    constructor(address _asset, uint256 _initialRate) Ownable(msg.sender) {
        underlying = IERC20(_asset);
        supplyRate = _initialRate;
    }

    function deposit(uint256 amount) external override nonReentrant returns (uint256) {
        require(amount > 0, "MockAdapter: Amount must be > 0");
        
        underlying.safeTransferFrom(msg.sender, address(this), amount);

        _totalDeposited += amount;
        return amount; // 1:1 shares for mock
    }

    function withdraw(uint256 amount) external override nonReentrant returns (uint256) {
        require(amount <= _totalDeposited, "MockAdapter: Insufficient liquidity");
        
        _totalDeposited -= amount;
        
        underlying.safeTransfer(msg.sender, amount);
        
        return amount;
    }

    function totalAssets() external view override returns (uint256) {
        return _totalDeposited;
    }

    function asset() external view override returns (address) {
        return address(underlying);
    }
    
    event RateUpdated(uint256 newRate);
    
    function getSupplyRate() external view override returns (uint256) {
        return supplyRate;
    }
    
    /**
     * @notice Owner-only demo trigger for Reactive Network automation
     * @dev Only owner can call this to simulate market rate changes.
     *      The emitted RateUpdated event triggers Reactive Network → RemoteHub → Vault rebalance
     *      Usage: mockAdapterB.simulateRateChange(8e16) // 8% APY
     */
    function simulateRateChange(uint256 newRate) external onlyOwner {
        require(newRate <= 100000, "MockAdapter: Rate too high"); // Max 1000% APY
        supplyRate = newRate;
        emit RateUpdated(newRate);
    }
}
