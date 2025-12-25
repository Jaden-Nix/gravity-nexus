// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/ILendingAdapter.sol";

contract NexusVault is Ownable {
    IERC20 public immutable asset;
    ILendingAdapter[] public adapters;
    mapping(address => bool) public authorizedCallers;

    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event Rebalanced(uint256 fromIdx, uint256 toIdx, uint256 amount);
    event AdapterAdded(address indexed adapter);
    event AuthorizationUpdated(address indexed caller, bool status);

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

    function addAdapter(address _adapter) external onlyOwner {
        adapters.push(ILendingAdapter(_adapter));
        emit AdapterAdded(_adapter);
    }

    function deposit(uint256 amount) external {
        asset.transferFrom(msg.sender, address(this), amount);
        // Default: deposit into the first adapter
        require(adapters.length > 0, "No adapters added");
        asset.approve(address(adapters[0]), amount);
        adapters[0].deposit(amount);
        emit Deposited(msg.sender, amount);
    }

    function withdraw(uint256 amount) external {
        // Simple logic for demo: withdraw from the first adapter
        require(adapters.length > 0, "No adapters added");
        adapters[0].withdraw(amount);
        asset.transfer(msg.sender, amount);
        emit Withdrawn(msg.sender, amount);
    }

    function rebalance(uint256 fromIdx, uint256 toIdx, uint256 amount) public onlyAuthorized {
        require(fromIdx < adapters.length && toIdx < adapters.length, "Vault: Invalid adapter index");
        
        uint256 sourceBalance = adapters[fromIdx].totalAssets();
        uint256 actualWithdraw = amount > sourceBalance ? sourceBalance : amount;
        
        require(actualWithdraw > 0, "Vault: No assets to rebalance from source");

        // 1. Withdraw from Pool A
        adapters[fromIdx].withdraw(actualWithdraw);
        
        // 2. Deposit into Pool B
        asset.approve(address(adapters[toIdx]), actualWithdraw);
        adapters[toIdx].deposit(actualWithdraw);
        
        emit Rebalanced(fromIdx, toIdx, actualWithdraw);
    }

    /**
     * @notice Checks yields across all adapters and rebalances everything to the best pool
     * @dev Main optimization engine. Moves funds from ALL sub-optimal pools to the winner.
     */
    function checkYieldAndRebalance() external onlyAuthorized {
        uint256 count = adapters.length;
        if (count < 2) return;

        uint256 bestAdapterIdx = 0;
        uint256 highestRate = 0;

        // 1. Identify the highest yielding pool
        for (uint256 i = 0; i < count; i++) {
            uint256 rate = adapters[i].getSupplyRate();
            if (rate > highestRate) {
                highestRate = rate;
                bestAdapterIdx = i;
            }
        }

        // 2. Move funds from every other pool into the best pool
        for (uint256 i = 0; i < count; i++) {
            if (i == bestAdapterIdx) continue;
            
            uint256 balance = adapters[i].totalAssets();
            if (balance > 0) {
                rebalance(i, bestAdapterIdx, balance);
            }
        }
    }

    function totalAssets() external view returns (uint256 total) {
        for (uint256 i = 0; i < adapters.length; i++) {
            total += adapters[i].totalAssets();
        }
    }

    function getAdaptersCount() external view returns (uint256) {
        return adapters.length;
    }
}
