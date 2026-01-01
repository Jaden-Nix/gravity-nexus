// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MLModel
 * @notice On-chain registry for machine learning model metadata
 * @dev Stores model identifiers and hashes for verification purposes.
 *      In production, this would integrate with off-chain ML inference
 *      and potentially ZK-ML verification systems.
 */
contract MLModel is Ownable {
    string public modelId;
    bytes32 public modelHash;
    uint256 public lastUpdated;

    event ModelUpdated(string indexed newModelId, bytes32 newModelHash, uint256 timestamp);

    /**
     * @notice Initialize the ML model registry
     * @param _modelId Unique identifier for the model (e.g., IPFS CID)
     * @param _modelHash Hash of the model weights for verification
     */
    constructor(string memory _modelId, bytes32 _modelHash) Ownable(msg.sender) {
        require(bytes(_modelId).length > 0, "MLModel: Model ID cannot be empty");
        require(_modelHash != bytes32(0), "MLModel: Model hash cannot be zero");
        
        modelId = _modelId;
        modelHash = _modelHash;
        lastUpdated = block.timestamp;
    }

    /**
     * @notice Update the model metadata (owner only)
     * @param _newModelId New model identifier
     * @param _newModelHash New model hash
     */
    function updateModel(string memory _newModelId, bytes32 _newModelHash) external onlyOwner {
        require(bytes(_newModelId).length > 0, "MLModel: Model ID cannot be empty");
        require(_newModelHash != bytes32(0), "MLModel: Model hash cannot be zero");
        require(_newModelHash != modelHash, "MLModel: Same hash as current model");
        
        modelId = _newModelId;
        modelHash = _newModelHash;
        lastUpdated = block.timestamp;
        
        emit ModelUpdated(_newModelId, _newModelHash, block.timestamp);
    }
    
    /**
     * @notice Get the current model information
     * @return id The model identifier
     * @return hash The model hash
     * @return updated Timestamp of last update
     */
    function getModelInfo() external view returns (string memory id, bytes32 hash, uint256 updated) {
        return (modelId, modelHash, lastUpdated);
    }
}
