// SPDX-License-Identifier: MIT

pragma solidity ^0.6.12;

import "../../lib/@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "../../lib/@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "../../lib/@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol";

contract IbizaToken is OwnableUpgradeable, ERC20Upgradeable {
    using SafeMathUpgradeable for uint256;

    function initialize(uint256 _initialSupply) public initializer {
        OwnableUpgradeable.__Ownable_init();
        ERC20Upgradeable.__ERC20_init_unchained("Ibiza token", "IBZ");
        _mint(msg.sender, _initialSupply.mul(uint(1e18)));
    }

}
