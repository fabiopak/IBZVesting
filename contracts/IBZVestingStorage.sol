// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

contract IBZVestingStorage {
    struct FrozenBox {
        uint frozenId;
        uint totalAmount;
        uint unitPeriodAmount;
        uint initialAmount;
        uint startDay;
        uint afterDays;
        uint unitPeriodDelay;
        uint transferred;
    }

    struct VestingType {
        uint unitPeriodRate;
        uint initialRate;
        uint afterDays;
        uint unitPeriodDelay;
        bool vesting;
        uint unitPeriod;
    }

    uint public releaseTime;
    uint public vestingCounter;
    address public tokenToBeVested;

    mapping (uint256 => FrozenBox) public frozenBoxes;
    VestingType[] public vestingTypes;
}