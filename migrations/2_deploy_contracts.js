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
//const amount8 = process.env.AMOUNT_8

//Initial Accounts
// const account1 = process.env.ACCOUNT_1
// const account2 = process.env.ACCOUNT_2
// const account3 = process.env.ACCOUNT_3

module.exports = async function (deployer,  network, accounts) {

  if (network == "development") {
    const tokenInstance = await deployProxy(IbizaToken, [1000000000], { from: accounts[0] });
    console.log("Ibiza Token Address: " + tokenInstance.address);

    // Testnet Approach Stage #1
    const vestingInstance = await deployProxy(IbizaVesting, [tokenInstance.address], { from: accounts[0] });
    console.log("Ibiza Token Vesting Address: " + vestingInstance.address);

    await vestingInstance.setReleaseTime(1625235658, { from: accounts[0] });

    // console.log(accounts)

    // Mainnet Approach Stage #2
    //const instance = await deployProxy(IbizaVesting, [account1, account2, account3], { deployer });
  /*
    const wallets = [
      allocation1,
      allocation2,
      allocation3,
      allocation4,
      allocation5,
      allocation6,
      allocation7,
      allocation8
    ]
  */
    // const amounts = [
    //   amount1,
    //   amount2,
    //   amount3,
    //   amount4,
    //   amount5,
    //   amount6,
    //   amount7/*,
    //   amount8*/
    // ]

    // await tokenInstance.approve(vestingInstance.address, 10 * (1e18))
    // //for (const i in wallets) {
    // for(i = 0; i < 7; i++) {
    //   //console.log(accounts[i]);
    //   await vestingInstance.depositPerVestingType([accounts[i+3]], [amounts[i]], (i).toString());
    //   //console.log(i)
    // }

    // const mt2 = await upgradeProxy(instance.address, IbizaVesting, [], {from: accounts[0]});
    // console.log('Ibiza Token Updated address: ' + mt2.address)
  /*
    for (const i in wallets) {
      console.log(wallets[i]);
      await instance.addAllocations([wallets[i]], [amounts[i]], i.toString());
      //console.log(i)
    }
  */
    //console.log("deploy ends")
  } else if (network == "kovan") {
  } else if (network == "mainnet") {
  }
};
