// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

contract IBZVestingStorage {
    struct FrozenWallet {
        address wallet;
        uint totalAmount;
        uint monthlyAmount;
        uint initialAmount;
        uint startDay;
        uint afterDays;
        bool scheduled;
        uint monthsDelay;
    }

    struct VestingType {
        uint monthlyRate;
        uint initialRate;
        uint afterDays;
        uint monthsDelay;
        bool vesting;
    }

    mapping (address => FrozenWallet) public frozenWallets;
    VestingType[] public vestingTypes;
}