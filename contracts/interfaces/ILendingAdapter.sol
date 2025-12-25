// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface ILendingAdapter {
    /**
     * @notice Deposits the underlying asset into the lending protocol
     * @param amount The amount of underlying asset to deposit
     * @return shares The amount of protocol tokens/shares received
     */
    function deposit(uint256 amount) external returns (uint256 shares);

    /**
     * @notice Withdraws the underlying asset from the lending protocol
     * @param amount The amount of underlying asset to withdraw
     * @return received The actual amount of underlying asset received
     */
    function withdraw(uint256 amount) external returns (uint256 received);

    /**
     * @notice Returns the total value of assets held in the protocol by this adapter
     * @return totalValue The total value in underlying asset terms
     */
    function totalAssets() external view returns (uint256);

    /**
     * @notice Returns the underlying asset address
     */
    function asset() external view returns (address);
    
    /**
     * @notice Returns the current supply rate (APY)
     * @return rate The current supply rate with 18 decimals
     */
    function getSupplyRate() external view returns (uint256);
}
