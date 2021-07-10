// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;
pragma experimental ABIEncoderV2;

import "../lib/@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "../lib/@openzeppelin/contracts-upgradeable/token/ERC20/SafeERC20Upgradeable.sol";
import "../lib/@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "../lib/@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol";
import "../lib/@openzeppelin/contracts-upgradeable/proxy/Initializable.sol";
import "./IBZVestingStorage.sol";

contract IBZVesting is IBZVestingStorage, Initializable, OwnableUpgradeable, PausableUpgradeable {
    using SafeMathUpgradeable for uint;

    function initialize(address _tokenToVest) initializer public {
        __Ownable_init();
        __Pausable_init();

        tokenToBeVested = _tokenToVest;

        // all percentages are multiplied by 1e18
        // 430M, 2.083333% every month (48 months), 8.958.333,33 tokens/month - Community
        vestingTypes.push(VestingType(2083333333333333334, 2083333333333333333, 30 days, 0, true));
        // 150M, 16.66667% every month (6 months), 25.000.000 tokens/month - Farming & Co.
        vestingTypes.push(VestingType(16666666666666666667, 16666666666666666667, 30 days, 0, true));
        // 140M, 3.57142857142857% every month (28 months), 5.000.000 tokens/month - Strategic investor
        vestingTypes.push(VestingType(3571428571428571429, 3571428571428571429, 30 days, 0, true));
        // 100M, 4.1666667% every month (24 months), 4.166.666,67 token/month - Core team and advisor
        vestingTypes.push(VestingType(4166666666666666667, 4166666666666666667, 30 days, 0, true));
        
    }

    function setReleaseTime(uint _relTime) public onlyOwner {
        releaseTime = _relTime; 
    }

    function getReleaseTime() public view returns (uint) {
        return releaseTime;
    }

    function mulDiv(uint x, uint y, uint z) public pure returns (uint) {
        return x.mul(y).div(z);
    }

    function addVestingType(uint _perc0Days,    // percentage (scaled 1e18)
            uint _percMonth,                    // month percentage (scaled 1e18)
            uint _freqRelease,                  // distribution frequency (in days)
            uint _delayMonth,                   // months delay (in month)
            bool _vesting) external onlyOwner {
        vestingTypes.push(VestingType(_perc0Days, _percMonth, _freqRelease, _delayMonth, _vesting)); 
    }

    function depositPerVestingType(uint[] memory totalAmounts, uint vestingTypeIndex) public onlyOwner {
        uint totalAmount;
        for (uint i = 0; i < totalAmounts.length; i++) {
            totalAmount = totalAmount + totalAmounts[i];
        }
        SafeERC20Upgradeable.safeTransferFrom(IERC20Upgradeable(tokenToBeVested), msg.sender, address(this), totalAmount);
        addAllocations(totalAmounts, vestingTypeIndex);
    }

    function addAllocations(uint[] memory totalAmounts, uint vestingTypeIndex) public payable onlyOwner returns (bool) {
        require(vestingTypes[vestingTypeIndex].vesting, "Vesting type isn't found");

        VestingType memory vestingType = vestingTypes[vestingTypeIndex];

        for(uint i = 0; i < totalAmounts.length; i++) {
            uint totalAmount = totalAmounts[i];
            uint monthlyAmount = mulDiv(totalAmounts[i], vestingType.monthlyRate, 100000000000000000000);  // amount * MonthlyRate / 100
            uint initialAmount = mulDiv(totalAmounts[i], vestingType.initialRate, 100000000000000000000);  // amount * MonthlyRate / 100
            uint afterDay = vestingType.afterDays;
            uint monthsDelay = vestingType.monthsDelay;

            addFrozenBox(totalAmount, monthlyAmount, initialAmount, afterDay, monthsDelay);

            vestingCounter = vestingCounter.add(1);
        }

        return true;
    }

    function addFrozenBox(uint totalAmount, uint monthlyAmount, uint initialAmount, uint afterDays, uint monthsDelay) internal {
        uint releaseTime = getReleaseTime();

        // Create frozen wallets
        FrozenBox memory frozenBox = FrozenBox(
            vestingCounter,
            totalAmount,
            monthlyAmount,
            initialAmount,
            releaseTime.add(monthsDelay * (30 days)),
            // releaseTime.add(afterDays),
            afterDays,
            monthsDelay,
            0
        );

        // Add wallet to frozen wallets
        frozenBoxes[vestingCounter] = frozenBox;
    }

    function getTimestamp() external view returns (uint) {
        return block.timestamp;
    }

    function getMonths(uint afterDays, uint monthsDelay) public view returns (uint) {
        uint releaseTime = getReleaseTime();
        uint time = releaseTime.add(afterDays);

        if (block.timestamp < time) {
            return 0;
        }

        uint diff = block.timestamp.sub(time);
        uint tmpdiff = diff.div(30 days).add(1);
        uint months;
        if (tmpdiff >= monthsDelay)
            months = diff.div(30 days).add(1).sub(monthsDelay);

        return months;
    }

    function isStarted(uint startDay) public view returns (bool) {
        uint releaseTime = getReleaseTime();

        if (block.timestamp < releaseTime || block.timestamp < startDay) {
            return false;
        }

        return true;
    }

    function getTransferableAmount(uint idxVest) public view returns (uint) {
        uint months = getMonths(frozenBoxes[idxVest].afterDays, frozenBoxes[idxVest].monthsDelay);
        uint monthlyTransferableAmount = frozenBoxes[idxVest].monthlyAmount.mul(months);
        uint transferableAmount = monthlyTransferableAmount.add(frozenBoxes[idxVest].initialAmount).sub(frozenBoxes[idxVest].transferred);

        if (transferableAmount > frozenBoxes[idxVest].totalAmount) {
            return frozenBoxes[idxVest].totalAmount;
        }

        return transferableAmount;
    }

    function transferFromFrozenBox(uint idxVest, address[] calldata recipients, uint[] calldata amounts) external onlyOwner {
         require(recipients.length == amounts.length, "IBZVesting: Wrong array length");

        uint total = 0;
        for (uint i = 0; i < amounts.length; i++) {
            total = total.add(amounts[i]);
        }
        
        require (canTransfer(idxVest, total), "IBZVesting: can not transfer yet");

        for (uint i = 0; i < recipients.length; i++) {
            address recipient = recipients[i];
            uint amount = amounts[i];
            require(recipient != address(0), "recipients cannot be zero address");
            frozenBoxes[idxVest].totalAmount = frozenBoxes[idxVest].totalAmount.sub(amount);
            frozenBoxes[idxVest].transferred = frozenBoxes[idxVest].transferred.add(amount);
            SafeERC20Upgradeable.safeTransfer(IERC20Upgradeable(tokenToBeVested), recipient, amount);
        }
    }

    function getRestAmount(uint idxVest) public view returns (uint) {
        uint transferableAmount = getTransferableAmount(idxVest);
        uint restAmount = frozenBoxes[idxVest].totalAmount.sub(transferableAmount);

        return restAmount;
    }

    // Transfer control
    function canTransfer(uint idxVest, uint amount) public view returns (bool) {
        uint transfAmount = getTransferableAmount(idxVest);

        if (amount <= transfAmount && isStarted(frozenBoxes[idxVest].startDay)) {
            return true;
        }

        return false;
    }

    function emergencyWithdraw(address _token, uint amount) public onlyOwner {
        SafeERC20Upgradeable.safeTransfer(IERC20Upgradeable(_token), msg.sender, amount);
    }

    function pause(bool status) public onlyOwner {
        if (status) {
            _pause();
        } else {
            _unpause();
        }
    }
}
