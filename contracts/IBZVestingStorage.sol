// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

contract IBZVestingStorage {
    struct FrozenBox {
        uint frozenId;
        uint totalAmount;
        uint monthlyAmount;
        uint initialAmount;
        uint startDay;
        // uint afterDays;
        uint monthsDelay;
        uint transferred;
    }

    struct VestingType {
        uint monthlyRate;
        uint initialRate;
        // uint periodLength;
        uint monthsDelay;
        bool vesting;
    }

    uint public releaseTimeFixed;
    uint public vestingCounter;
    address public tokenToBeVested;

    mapping (uint256 => FrozenBox) public frozenBoxes;
    VestingType[] public vestingTypes;
}