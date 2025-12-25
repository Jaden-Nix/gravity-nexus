// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../interfaces/ILendingAdapter.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MockAdapter is ILendingAdapter, Ownable {
    IERC20 public immutable underlying;
    uint256 public supplyRate;
    
    // Simulate protocol holdings
    uint256 private _totalDeposited;

    constructor(address _asset, uint256 _initialRate) Ownable(msg.sender) {
        underlying = IERC20(_asset);
        supplyRate = _initialRate;
    }

    function deposit(uint256 amount) external override returns (uint256) {
        require(amount > 0, "Amount must be > 0");
        
        bool success = underlying.transferFrom(msg.sender, address(this), amount);
        require(success, "Transfer failed");

        _totalDeposited += amount;
        return amount; // 1:1 shares for mock
    }

    function withdraw(uint256 amount) external override returns (uint256) {
        require(amount <= _totalDeposited, "Insufficient liquidity");
        
        _totalDeposited -= amount;
        
        bool success = underlying.transfer(msg.sender, amount);
        require(success, "Transfer failed");
        
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
    
    function setSupplyRate(uint256 _newRate) external {
        supplyRate = _newRate;
        emit RateUpdated(_newRate);
    }
}
