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
        // 2.083333% every month (48 months) - Community
        vestingTypes.push(VestingType(2083333333333333334, 0, 0, true));
        addFrozenBox(0);
        // 16.66667% every month (6 months) - Farming & Co.
        vestingTypes.push(VestingType(16666666666666666667, 0, 0, true));
        addFrozenBox(0);
        // 3.57142857142857% every month (28 months) - Strategic investor
        vestingTypes.push(VestingType(3571428571428571429, 0, 0, true));
        addFrozenBox(0);
        // 4.1666667% every month (24 months) - Core team and advisor
        vestingTypes.push(VestingType(4166666666666666667, 0, 0, true));
        addFrozenBox(0);
        // 100% after 6 months
        vestingTypes.push(VestingType(100000000000000000000, 0, 6, true));
        addFrozenBox(6);
        // 100% after 12 months
        vestingTypes.push(VestingType(100000000000000000000, 0, 12, true));
        addFrozenBox(12);
    }

    function setReleaseTime(uint _relTime) public onlyOwner {
        releaseTimeFixed = _relTime; 
    }

    function getReleaseTime() public view returns (uint) {
        return releaseTimeFixed;
    }

    function mulDiv(uint x, uint y, uint z) public pure returns (uint) {
        return x.mul(y).div(z);
    }

    function addVestingType(uint _perc0Days,    // initial percentage at time 0 + delay (scaled 1e18)
            uint _percMonth,                    // following month percentage (scaled 1e18)
            uint _delayMonth                    // months delay (in month)
            ) external onlyOwner {
        vestingTypes.push(VestingType(_perc0Days, _percMonth, _delayMonth, true)); 
    }

    function depositPerVestingType(uint totalAmounts, uint vestingTypeIndex) public onlyOwner {
        SafeERC20Upgradeable.safeTransferFrom(IERC20Upgradeable(tokenToBeVested), msg.sender, address(this), totalAmounts);
        addAllocations(totalAmounts, vestingTypeIndex);
    }

    function addAllocations(uint totalAmounts, uint vestingTypeIndex) public payable onlyOwner returns (bool) {
        require(vestingTypes[vestingTypeIndex].vesting, "Vesting type isn't found");

        VestingType memory vestingType = vestingTypes[vestingTypeIndex];

        uint monthlyAmount = mulDiv(totalAmounts, vestingType.monthlyRate, 100000000000000000000);  // amount * MonthlyRate / 100
        uint initialAmount = mulDiv(totalAmounts, vestingType.initialRate, 100000000000000000000);  // amount * MonthlyRate / 100
        uint monthsDelay = vestingType.monthsDelay;

        //addFrozenBox(totalAmounts, monthlyAmount, initialAmount, monthsDelay);

        //vestingCounter = vestingCounter.add(1);
        
        frozenBoxes[vestingTypeIndex].totalAmount = totalAmounts;
        frozenBoxes[vestingTypeIndex].monthlyAmount = monthlyAmount;
        frozenBoxes[vestingTypeIndex].initialAmount = initialAmount;
        frozenBoxes[vestingTypeIndex].monthsDelay = monthsDelay;

        return true;
    }

    function addFrozenBox(uint monthsDelay) internal {
        uint releaseTime = getReleaseTime();

        // Create frozen wallets
        FrozenBox memory frozenBox = FrozenBox(
            vestingCounter,
            0, // totalAmount
            0, // monthlyAmount,
            0, // initialAmount,
            releaseTime.add(monthsDelay * (30 days)),
            0, //monthsDelay,
            0
        );

        // Add wallet to frozen wallets
        frozenBoxes[vestingCounter] = frozenBox;
        
        vestingCounter = vestingCounter.add(1);
    }

    function getTimestamp() external view returns (uint) {
        return block.timestamp;
    }

    function getMonths(uint monthsDelay) public view returns (uint) {
        uint releaseTime = getReleaseTime();

        if (block.timestamp < releaseTime) {
            return 0;
        }

        uint diff = block.timestamp.sub(releaseTime);
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
        uint months = getMonths(frozenBoxes[idxVest].monthsDelay);
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

        if (amount > 0 && amount <= transfAmount && isStarted(frozenBoxes[idxVest].startDay)) {
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
