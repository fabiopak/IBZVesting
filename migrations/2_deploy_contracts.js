const { deployProxy, upgradeProxy } = require('@openzeppelin/truffle-upgrades');
require('dotenv').config();

const IbizaToken = artifacts.require("IbizaToken");
const IbizaVesting = artifacts.require("IBZVesting");

//Allocation Accounts
const allocation1 = process.env.ALLOCATION_1
const allocation2 = process.env.ALLOCATION_2
const allocation3 = process.env.ALLOCATION_3
const allocation4 = process.env.ALLOCATION_4
const allocation5 = process.env.ALLOCATION_5
const allocation6 = process.env.ALLOCATION_6
const allocation7 = process.env.ALLOCATION_7
//const allocation8 = process.env.ALLOCATION_8
//Allocation Amount
const amount1 = process.env.AMOUNT_1
const amount2 = process.env.AMOUNT_2
const amount3 = process.env.AMOUNT_3
const amount4 = process.env.AMOUNT_4
const amount5 = process.env.AMOUNT_5
const amount6 = process.env.AMOUNT_6
const amount7 = process.env.AMOUNT_7


module.exports = async function (deployer, network, accounts) {

  if (network == "development") {
    const tokenInstance = await deployProxy(IbizaToken, [1000000000], { from: accounts[0] });
    console.log("Ibiza Token Address: " + tokenInstance.address);

    // Testnet Approach Stage #1
    const vestingInstance = await deployProxy(IbizaVesting, [tokenInstance.address], { from: accounts[0] });
    console.log("Ibiza Token Vesting Address: " + vestingInstance.address);

    await vestingInstance.setReleaseTime(1625245658, { from: accounts[0] });  // time in the future!!!

  } else if (network == "kovan") {
  } else if (network == "mainnet") {
  }
};
