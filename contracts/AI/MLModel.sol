// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

contract MLModel is Ownable {
    string public modelId;
    bytes32 public modelHash;

    event ModelUpdated(string newModelId, bytes32 newModelHash);

    constructor(string memory _modelId, bytes32 _modelHash) Ownable(msg.sender) {
        modelId = _modelId;
        modelHash = _modelHash;
    }

    function updateModel(string memory _newModelId, bytes32 _newModelHash) external onlyOwner {
        modelId = _newModelId;
        modelHash = _newModelHash;
        emit ModelUpdated(_newModelId, _newModelHash);
    }
}
