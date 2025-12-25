// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../interfaces/ILendingAdapter.sol";

contract LendingPoolAdapter is ILendingAdapter {
    IERC20 public immutable underlying;
    uint256 public balance;

    constructor(address _asset) {
        underlying = IERC20(_asset);
    }

    function deposit(uint256 amount) external override returns (uint256) {
        underlying.transferFrom(msg.sender, address(this), amount);
        balance += amount;
        return amount;
    }

    function withdraw(uint256 amount) external override returns (uint256) {
        require(balance >= amount, "Insufficient balance");
        balance -= amount;
        underlying.transfer(msg.sender, amount);
        return amount;
    }

    function totalAssets() external view override returns (uint256) {
        return balance;
    }

    function asset() external view override returns (address) {
        return address(underlying);
    }
    
    function getSupplyRate() external view override returns (uint256) {
        return 0; // Default for this mock
    }
}
