const { deployProxy, upgradeProxy } = require('@openzeppelin/truffle-upgrades');
require('dotenv').config();
// handle migrations
const IBZVesting = artifacts.require("IBZVesting");

//Allocation Accounts
const allocation1 = process.env.ALLOCATION_1
const allocation2 = process.env.ALLOCATION_2
const allocation3 = process.env.ALLOCATION_3
const allocation4 = process.env.ALLOCATION_4
const allocation5 = process.env.ALLOCATION_5
const allocation6 = process.env.ALLOCATION_6
const allocation7 = process.env.ALLOCATION_7
//const allocation8 = process.env.ALLOCATION_8
//Initial Accounts
const account1 = process.env.ACCOUNT_1
const account2 = process.env.ACCOUNT_2
const account3 = process.env.ACCOUNT_3

module.exports = async function (deployer) {

  const existing = await IBZVesting.deployed();
  const instance = await upgradeProxy(existing.address , IBZVesting, [account1, account2, account3] ,{ deployer });

  const wallets = [
    allocation1,
    allocation2,
    allocation3,
    allocation4,
    allocation5,
    allocation6,
    allocation7/*,
    allocation8*/
  ]

  for (const i in wallets) {
		console.log(wallets[i]);
    await instance.addAllocations([wallets[i]], ['1000000000000000000000000'], i.toString());
  }

};
