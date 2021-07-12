const { deployProxy, upgradeProxy } = require('@openzeppelin/truffle-upgrades');
require('dotenv').config();

const IbizaToken = artifacts.require("IbizaToken");
const IbizaVesting = artifacts.require("IBZVesting");

module.exports = async function (deployer, network, accounts) {

  if (network == "development") {
    const tokenInstance = await deployProxy(IbizaToken, [1000000000], { from: accounts[0] });
    console.log("Ibiza Token Address: " + tokenInstance.address);

    // Testnet Approach Stage #1
    const vestingInstance = await deployProxy(IbizaVesting, [tokenInstance.address], { from: accounts[0] });
    console.log("Ibiza Token Vesting Address: " + vestingInstance.address);

    // const oneDay = 86400;
    const releaseTime = (Date.now() / 1000).toFixed(0) + 1;
    console.log(releaseTime)
    await vestingInstance.setReleaseTime(releaseTime, { from: accounts[0] });  // time in the future!!!

  } else if (network == "kovan") {
  } else if (network == "mainnet") {
  }
};
