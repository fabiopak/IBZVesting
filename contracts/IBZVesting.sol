// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;
pragma experimental ABIEncoderV2;

import "../lib/@openzeppelin/contracts-upgradeable/token/ERC20/ERC20PausableUpgradeable.sol";
import "../lib/@openzeppelin/contracts-upgradeable/token/ERC20/SafeERC20Upgradeable.sol";
import "../lib/@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "../lib/@openzeppelin/contracts-upgradeable/proxy/Initializable.sol";
import "./IBZVestingStorage.sol";

contract IBZVesting is IBZVestingStorage, Initializable, OwnableUpgradeable, ERC20PausableUpgradeable {

    function initialize(address _tokenToVest) initializer public {
        __Ownable_init();
        // __ERC20_init('Ibiza token', 'IBZ');
        // __ERC20Pausable_init();

	    // // Mint All TotalSuply in the Account OwnerShip
        // _mint(owner(), getMaxTotalSupply());
        tokenToBeVested = _tokenToVest;

        vestingTypes.push(VestingType(100000000000000000000, 100000000000000000000, 0, 1, true)); // 0 Days 100%
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

    function getReleaseTime() public pure returns (uint) {
        return 1624266486; // "Mon Jun 21 2021 09:08:06 GMT"
    }

    // function getMaxTotalSupply() public pure returns (uint) {
    //     return uint(400000000).mul(1e18);
    // }

    function mulDiv(uint x, uint y, uint z) public pure returns (uint) {
        return x.mul(y).div(z);
    }

    function addAllocations(address[] memory addresses, uint[] memory totalAmounts, uint vestingTypeIndex) public payable onlyOwner returns (bool) {
        require(addresses.length == totalAmounts.length, "Address and totalAmounts length must be same");
        require(vestingTypes[vestingTypeIndex].vesting, "Vesting type isn't found");

        VestingType memory vestingType = vestingTypes[vestingTypeIndex];

        for(uint i = 0; i < addresses.length; i++) {
            address _address = addresses[i];
            uint totalAmount = totalAmounts[i];
            uint monthlyAmount = mulDiv(totalAmounts[i], vestingType.monthlyRate, 100000000000000000000);  // amount * MonthlyRate / 100
            uint initialAmount = mulDiv(totalAmounts[i], vestingType.initialRate, 100000000000000000000);  // amount * MonthlyRate / 100
            uint afterDay = vestingType.afterDays;
            uint monthsDelay = vestingType.monthsDelay;

            addFrozenWallet(_address, totalAmount, monthlyAmount, initialAmount, afterDay, monthsDelay);
        }

        return true;
    }
/*
    function _mint(address account, uint amount) internal override {
        uint totalSupply = super.totalSupply();
        require(getMaxTotalSupply() >= totalSupply.add(amount), "Max total supply over");

        super._mint(account, amount);
    }
*/
    function depositPerVestingType(address[] memory addresses, uint[] memory totalAmounts, uint vestingTypeIndex) public onlyOwner {
        uint totalAmount;
        for (uint i = 0; i < totalAmounts.length; i++) {
            totalAmount = totalAmount + totalAmounts[i];
        }
        SafeERC20Upgradeable.safeTransferFrom(IERC20Upgradeable(tokenToBeVested), msg.sender, address(this), totalAmount);
        addAllocations(addresses, totalAmounts, vestingTypeIndex);
    }

    function addFrozenWallet(address wallet, uint totalAmount, uint monthlyAmount, uint initialAmount, uint afterDays, uint monthsDelay) internal {
        uint releaseTime = getReleaseTime();

        if (!frozenWallets[wallet].scheduled) {
            super._transfer(msg.sender, wallet, totalAmount);
        }

        // Create frozen wallets
        FrozenWallet memory frozenWallet = FrozenWallet(
            wallet,
            totalAmount,
            monthlyAmount,
            initialAmount,
            releaseTime.add(afterDays),
            afterDays,
            true,
            monthsDelay
        );

        // Add wallet to frozen wallets
        frozenWallets[wallet] = frozenWallet;
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

    function getTransferableAmount(address sender) public view returns (uint) {
        uint months = getMonths(frozenWallets[sender].afterDays, frozenWallets[sender].monthsDelay);
        uint monthlyTransferableAmount = frozenWallets[sender].monthlyAmount.mul(months);
        uint transferableAmount = monthlyTransferableAmount.add(frozenWallets[sender].initialAmount);

        if (transferableAmount > frozenWallets[sender].totalAmount) {
            return frozenWallets[sender].totalAmount;
        }

        return transferableAmount;
    }


    function transferMany(address[] calldata recipients, uint[] calldata amounts) external onlyOwner {
        require(recipients.length == amounts.length, "PAID Token: Wrong array length");

        uint total = 0;
        for (uint i = 0; i < amounts.length; i++) {
            total = total.add(amounts[i]);
        }

	    _balances[msg.sender] = _balances[msg.sender].sub(total, "ERC20: transfer amount exceeds balance");

        for (uint i = 0; i < recipients.length; i++) {
            address recipient = recipients[i];
            uint amount = amounts[i];
            require(recipient != address(0), "ERC20: transfer to the zero address");

            _balances[recipient] = _balances[recipient].add(amount);
            emit Transfer(msg.sender, recipient, amount);
        }
    }


    function getRestAmount(address sender) public view returns (uint) {
        uint transferableAmount = getTransferableAmount(sender);
        uint restAmount = frozenWallets[sender].totalAmount.sub(transferableAmount);

        return restAmount;
    }

    // Transfer control
    function canTransfer(address sender, uint amount) public view returns (bool) {
        // Control is scheduled wallet
        if (!frozenWallets[sender].scheduled) {
            return true;
        }

        uint balance = balanceOf(sender);
        uint restAmount = getRestAmount(sender);

        if (balance > frozenWallets[sender].totalAmount && balance.sub(frozenWallets[sender].totalAmount) >= amount) {
            return true;
        }

        if (!isStarted(frozenWallets[sender].startDay) || balance.sub(amount) < restAmount) {
            return false;
        }

        return true;
    }

    // @override
    function _beforeTokenTransfer(address sender, address recipient, uint amount) internal virtual override {
        require(canTransfer(sender, amount), "Wait for vesting day!");
        super._beforeTokenTransfer(sender, recipient, amount);
    }

    function withdraw(uint amount) public onlyOwner {
        require(address(this).balance >= amount, "Address: insufficient balance");

        // solhint-disable-next-line avoid-low-level-calls, avoid-call-value
        (bool success, ) = _msgSender().call{ value: amount }("");
        require(success, "Address: unable to send value, recipient may have reverted");
    }

    function pause(bool status) public onlyOwner {
        if (status) {
            _pause();
        } else {
            _unpause();
        }
    }
}
