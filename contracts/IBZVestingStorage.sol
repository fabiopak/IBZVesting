// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

contract IBZVestingStorage {
    struct FrozenWallet {
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
        uint monthlyRate;
        uint initialRate;
        uint afterDays;
        uint monthsDelay;
        bool vesting;
    }

    uint public releaseTime;
    uint public vestingCounter;
    address public tokenToBeVested;

    mapping (uint256 => FrozenWallet) public frozenWallets;
    VestingType[] public vestingTypes;
}