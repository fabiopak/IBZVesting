// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;
pragma experimental ABIEncoderV2;

// import "../lib/@openzeppelin/contracts-upgradeable/token/ERC20/ERC20PausableUpgradeable.sol";
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
        vestingTypes.push(VestingType(100000000000000000000, 100000000000000000000, 0, 1, true)); // 0 Days 100% (100 * 1e18)
        vestingTypes.push(VestingType(8000000000000000000, 12000000000000000000, 30 days, 0, true)); // 12% TGE + 8% every 30 days
        vestingTypes.push(VestingType(6000000000000000000, 10000000000000000000, 30 days, 0, true)); // 10% TGE + 6% every 30 days
        vestingTypes.push(VestingType(5000000000000000000, 10000000000000000000, 30 days, 0, true)); // 10% TGE + 6% every 30 days
        vestingTypes.push(VestingType(5000000000000000000, 0, 30 days, 4, true)); // 4 months delay + 5% every 30 Days 
        vestingTypes.push(VestingType(2000000000000000000, 0, 30 days, 4, true)); // 4 months delay + 2% every 30 days
        vestingTypes.push(VestingType(4000000000000000000, 0, 30 days, 14, true)); // 14 months delay + 4% every 30 days
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

    function depositPerVestingType(/*address[] memory addresses, */uint[] memory totalAmounts, uint vestingTypeIndex) public onlyOwner {
        uint totalAmount;
        for (uint i = 0; i < totalAmounts.length; i++) {
            totalAmount = totalAmount + totalAmounts[i];
        }
        SafeERC20Upgradeable.safeTransferFrom(IERC20Upgradeable(tokenToBeVested), msg.sender, address(this), totalAmount);
        addAllocations(/*addresses,*/ totalAmounts, vestingTypeIndex);
    }

    function addAllocations(/*address[] memory addresses,*/ uint[] memory totalAmounts, uint vestingTypeIndex) public payable onlyOwner returns (bool) {
        // require(addresses.length == totalAmounts.length, "Address and totalAmounts length must be same");
        require(vestingTypes[vestingTypeIndex].vesting, "Vesting type isn't found");

        VestingType memory vestingType = vestingTypes[vestingTypeIndex];

        for(uint i = 0; i < totalAmounts.length; i++) {
            // address _address = addresses[i];
            uint totalAmount = totalAmounts[i];
            uint monthlyAmount = mulDiv(totalAmounts[i], vestingType.monthlyRate, 100000000000000000000);  // amount * MonthlyRate / 100
            uint initialAmount = mulDiv(totalAmounts[i], vestingType.initialRate, 100000000000000000000);  // amount * MonthlyRate / 100
            uint afterDay = vestingType.afterDays;
            uint monthsDelay = vestingType.monthsDelay;

            addFrozenWallet(/*_address,*/ totalAmount, monthlyAmount, initialAmount, afterDay, monthsDelay);

            vestingCounter = vestingCounter.add(1);
        }

        return true;
    }

    function addFrozenWallet(/*address wallet,*/ uint totalAmount, uint monthlyAmount, uint initialAmount, uint afterDays, uint monthsDelay) internal {
        uint releaseTime = getReleaseTime();

        // if (!frozenWallets[wallet].scheduled) {
            //SafeERC20Upgradeable.safeTransfer(IERC20Upgradeable(tokenToBeVested), wallet, totalAmount);
        // }

        // Create frozen wallets
        FrozenWallet memory frozenWallet = FrozenWallet(
            vestingCounter,
            totalAmount,
            monthlyAmount,
            initialAmount,
            releaseTime.add(afterDays),
            afterDays,
            monthsDelay,
            0
        );

        // Add wallet to frozen wallets
        frozenWallets[vestingCounter] = frozenWallet;
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
        uint months = getMonths(frozenWallets[idxVest].afterDays, frozenWallets[idxVest].monthsDelay);
        uint monthlyTransferableAmount = frozenWallets[idxVest].monthlyAmount.mul(months);
        uint transferableAmount = monthlyTransferableAmount.add(frozenWallets[idxVest].initialAmount).sub(frozenWallets[idxVest].transferred);

        if (transferableAmount > frozenWallets[idxVest].totalAmount) {
            return frozenWallets[idxVest].totalAmount;
        }

        return transferableAmount;
    }

    function transferFromFrozenWallet(uint idxVest, address[] calldata recipients, uint[] calldata amounts) external onlyOwner {
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
            frozenWallets[idxVest].totalAmount = frozenWallets[idxVest].totalAmount.sub(amount);
            frozenWallets[idxVest].transferred = frozenWallets[idxVest].transferred.add(amount);
            SafeERC20Upgradeable.safeTransfer(IERC20Upgradeable(tokenToBeVested), recipient, amount);
            // emit Transfer(address(this), recipient, amount);
        }
    }
/*
    function transferMany(address[] calldata recipients, uint[] calldata amounts) external onlyOwner {
        require(recipients.length == amounts.length, "IBZVesting: Wrong array length");

        uint total = 0;
        for (uint i = 0; i < amounts.length; i++) {
            total = total.add(amounts[i]);
        }

        for (uint i = 0; i < recipients.length; i++) {
            address recipient = recipients[i];
            uint amount = amounts[i];
            require(recipient != address(0), "ERC20: transfer to the zero address");
            
            SafeERC20Upgradeable.safeTransfer(IERC20Upgradeable(tokenToBeVested), recipient, amount);
            // emit Transfer(address(this), recipient, amount);
        }
    }
*/

    function getRestAmount(uint idxVest) public view returns (uint) {
        uint transferableAmount = getTransferableAmount(idxVest);
        uint restAmount = frozenWallets[idxVest].totalAmount.sub(transferableAmount);

        return restAmount;
    }

    // Transfer control
    function canTransfer(uint idxVest, uint amount) public view returns (bool) {
        // Control is scheduled wallet
        // if (!frozenWallets[sender].scheduled) {
        //     return true;
        // }

        // uint balance = frozenWallets[idxVest].totalAmount;
        // uint restAmount = getRestAmount(idxVest);
        uint transfAmount = getTransferableAmount(idxVest);
        uint transferred = frozenWallets[idxVest].transferred;

        if (amount <= transfAmount) {
            return true;
        }

        return false;
    }

    // @override
    // function _beforeTokenTransfer(address sender, address recipient, uint amount) internal virtual override {
    //     require(canTransfer(sender, amount), "Wait for vesting day!");
    //     super._beforeTokenTransfer(sender, recipient, amount);
    // }

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
