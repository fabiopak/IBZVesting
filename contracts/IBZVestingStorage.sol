// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

contract IBZVestingStorage {
    struct FrozenBox {
        uint frozenId;
        uint totalAmount;
        uint monthlyAmount;
        uint initialAmount;
        uint startDay;
        uint afterDays;
        uint monthsDelay;
        uint transferred;
    }

    struct VestingType {
        uint periodRate;
        uint initialRate;
        uint afterDays;
        uint monthsDelay;
        // uint frequency;
        bool vesting;
        uint monthLength;
    }

    uint public releaseTime;
    uint public vestingCounter;
    address public tokenToBeVested;

    mapping (uint256 => FrozenBox) public frozenBoxes;
    VestingType[] public vestingTypes;
}