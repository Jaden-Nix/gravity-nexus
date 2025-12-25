// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract MockPyth {
    struct Price {
        int64 price;
        uint64 conf;
        int32 expo;
        uint256 publishTime;
    }

    mapping(bytes32 => Price) private prices;

    function updatePrice(bytes32 id, int64 price, uint64 conf, int32 expo) external {
        prices[id] = Price(price, conf, expo, block.timestamp);
    }

    function getPriceUnsafe(bytes32 id) external view returns (Price memory) {
        return prices[id];
    }
}
