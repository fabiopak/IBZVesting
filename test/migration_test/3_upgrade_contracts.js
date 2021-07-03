const { deployProxy, upgradeProxy } = require('@openzeppelin/truffle-upgrades');
require('dotenv').config();
// handle migrations
const IBZVesting = artifacts.require("IBZVesting");
const IbizaToken = artifacts.require("IbizaToken");


module.exports = async function (deployer) {

  const existingToken = await IbizaToken.deployed();
  const tokenInstance =  await upgradeProxy(existingToken.address , IbizaToken, [2000000000] ,{ deployer });

  const existingVesting = await IBZVesting.deployed();
  const vestingInstance = await upgradeProxy(existingVesting.address , IBZVesting, [tokenInstance.address] ,{ deployer });

  await vestingInstance.setReleaseTime(1625245658, { from: accounts[0] });  // time in the future!!!

};
