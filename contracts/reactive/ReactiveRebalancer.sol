// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IReactive
 * @notice Interface for Reactive Network contracts
 */
interface IReactive {
    struct EventLog {
        uint256 chainId;
        address logAddress;
        uint256 selector;
        bytes32 topic1;
        bytes32 topic2;
        bytes32 topic3;
        bytes data;
    }

    /**
     * @notice This function is called by the Reactive Network when a matching event is found
     * @param log The event log details
     * @return callbacks A list of callbacks to execute on destination chains (chainId, address, data)
     */
    function react(EventLog calldata log) external returns (bytes[] memory callbacks);
}

/**
 * @title ReactiveRebalancer
 * @notice Automated rebalancer triggered by events on Sepolia
 */
contract ReactiveRebalancer is IReactive {
    address public owner;
    address public sepVault;
    address public sepRemoteHub;
    uint256 public constant SEPOLIA_CHAIN_ID = 11155111;

    // Selector for RateUpdated(uint256)
    // keccak256("RateUpdated(uint256)")
    uint256 public constant RATE_UPDATED_SELECTOR = 0xe65c987b2e4668e09ba867026921588005b2b2063607a1e7e7d91683c8f91b7b; 
    
    event CallbackConstructed(address destination, string action);
    event SubscriptionRefreshed(address indexed service, address indexed logAddress);
    
    constructor(address _sepVault, address _sepRemoteHub) {
        owner = msg.sender;
        sepVault = _sepVault;
        sepRemoteHub = _sepRemoteHub;
    }

    /**
     * @notice Manually trigger/refresh the subscription
     * @param service The Reactive System Contract address
     * @param chainId The chain to monitor
     * @param logAddress The contract to monitor
     * @param selector The event selector
     */
    function rsync(address service, uint256 chainId, address logAddress, uint256 selector) external {
        require(msg.sender == owner, "Only owner");
        (bool success, ) = service.call(
            abi.encodeWithSignature(
                "subscribe(uint256,address,uint256,bytes32,bytes32,bytes32)",
                chainId,
                logAddress,
                selector,
                bytes32(0),
                bytes32(0),
                bytes32(0)
            )
        );
        require(success, "Subscription failed");
        emit SubscriptionRefreshed(service, logAddress);
    }

    /**
     * @notice Reactive function called on every matching event log
     */
    function react(EventLog calldata log) external override returns (bytes[] memory callbacks) {
        // 1. Verify source chain (Sepolia)
        if (log.chainId != SEPOLIA_CHAIN_ID) {
            return new bytes[](0);
        }

        // 2. We are looking for triggers:
        // Case A: ActionTriggered from ReactiveNexus (Manual Audit Trigger)
        // Case B: RateUpdated from MockAdapter (Automatic Chaos Trigger)
        
        bool shouldTrigger = false;
        
        if (log.selector == RATE_UPDATED_SELECTOR) {
             shouldTrigger = true;
        }

        if (!shouldTrigger) {
            return new bytes[](0);
        }

        bytes[] memory result = new bytes[](1);
        
        // Construct the callback to RemoteHub on Sepolia
        // RemoteHub.callback(string action, bytes params)
        bytes memory callbackData = abi.encodeWithSignature(
            "callback(string,bytes)",
            "OPTIMIZE",
            ""
        );

        emit CallbackConstructed(sepRemoteHub, "OPTIMIZE");

        result[0] = abi.encode(SEPOLIA_CHAIN_ID, sepRemoteHub, 0, callbackData);
        
        return result;
    }
}
