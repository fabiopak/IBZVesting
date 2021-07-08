const {
    BN,
    constants,
    ether,
    time,
    balance,
    expectEvent,
    expectRevert,
    days
} = require('@openzeppelin/test-helpers');
const {
    expect
} = require('chai');

const timeMachine = require('ganache-time-traveler');

const Web3 = require('web3');
// Ganache UI on 8545
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));

const IbizaToken = artifacts.require("IbizaToken");
const IbizaVesting = artifacts.require("IBZVesting");

//const releaseTime = 1611588600000;
const oneDay = 86400000;
const releaseTime = (Date.now() / 1000).toFixed(0) * 1000 + oneDay;  // release date is set to one day after the starting of the test
const month = 60 * 60 * 24 * 30;
//const _oneDay = 86400000;

//Allocation Amount
const amount1 = process.env.AMOUNT_1
const amount2 = process.env.AMOUNT_2
const amount3 = process.env.AMOUNT_3
const amount4 = process.env.AMOUNT_4
const amount5 = process.env.AMOUNT_5
const amount6 = process.env.AMOUNT_6
const amount7 = process.env.AMOUNT_7

const advanceBlockAtTime = (time) => {
    return new Promise((resolve, reject) => {
        web3.currentProvider.send(
            {
                jsonrpc: "2.0",
                method: "evm_mine",
                params: [time / 1000],
                id: new Date().getTime() / 1000,
            },
            (err, _) => {
                if (err) {
                    return reject(err);
                }

                const newBlockHash = web3.eth.getBlock("latest").hash;

                return resolve(newBlockHash);
            },
        );
    });
};

before(async () => {
    await advanceBlockAtTime(releaseTime);
});


let ibzVestingContract, ibzTokenContract;

contract("IbizaVesting Test", accounts => {
    const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
    const tokenOwner = accounts[0]
    const recipients = [accounts[3], accounts[4], accounts[5], accounts[6], accounts[7], accounts[8], accounts[9]]
    let lastBalanceForRecipientAtIdx = [0, 0, 0, 0, 0, 0, 0]
    
    it('set new release time', async () => {
        return IbizaVesting.deployed()
        .then(async (instance) => {
            await instance.setReleaseTime(releaseTime / 1000);
        })
    });

    it('pause', () => {
        return IbizaVesting.deployed()
            .then(async (instance) => {
                await instance.pause(true)
                console.log(await instance.paused());
            })
    });

    it('unpause', () => {
        return IbizaVesting.deployed()
            .then(async (instance) => {
                await instance.pause(false)
                console.log(await instance.paused());
            })
    });

    // console.log (accounts)
    it("setup", async function () {
        ibzVestingContract = await IbizaVesting.deployed();
        expect(ibzVestingContract.address).to.be.not.equal(ZERO_ADDRESS);
        expect(ibzVestingContract.address).to.match(/0x[0-9a-fA-F]{40}/);

        ibzTokenContract = await IbizaToken.deployed();
        expect(ibzTokenContract.address).to.be.not.equal(ZERO_ADDRESS);
        expect(ibzTokenContract.address).to.match(/0x[0-9a-fA-F]{40}/);
    });

    it("send some tokens to vesting contract", async function () {
        await ibzTokenContract.approve(ibzVestingContract.address, web3.utils.toWei('1000000000'), {from: tokenOwner});

        // 580M, 2.083333% every month - Community
        await ibzVestingContract.depositPerVestingType([web3.utils.toWei('580000000')], 0, {from: tokenOwner});
        frozen = await ibzVestingContract.frozenBoxes(0)
        console.log(frozen[0].toString(), frozen[1].toString(), frozen[2].toString(), frozen[3].toString(), 
            frozen[4].toString(), frozen[5].toString(), frozen[6].toString(), frozen[7].toString())
        console.log((await ibzVestingContract.getTransferableAmount(0)).toString())

        // 140M, 8.3333% every month - Strategic investor
        await ibzVestingContract.depositPerVestingType([web3.utils.toWei('140000000')], 1, {from: tokenOwner});
        frozen = await ibzVestingContract.frozenBoxes(1)
        console.log(frozen[0].toString(), frozen[1].toString(), frozen[2].toString(), frozen[3].toString(), 
            frozen[4].toString(), frozen[5].toString(), frozen[6].toString(), frozen[7].toString())
        console.log((await ibzVestingContract.getTransferableAmount(1)).toString())

        // 100M, 3 months delay, 8.3333% every 90 days, 2.77777% every month - Core team and advisor
        await ibzVestingContract.depositPerVestingType([web3.utils.toWei('100000000')], 2, {from: tokenOwner});
        frozen = await ibzVestingContract.frozenBoxes(2)
        console.log(frozen[0].toString(), frozen[1].toString(), frozen[2].toString(), frozen[3].toString(), 
            frozen[4].toString(), frozen[5].toString(), frozen[6].toString(), frozen[7].toString())
        console.log((await ibzVestingContract.getTransferableAmount(2)).toString())

        // 80M, 0 Days,100% - Reserve Liquidity
        await ibzVestingContract.depositPerVestingType([web3.utils.toWei('80000000')], 3, {from: tokenOwner});
        frozen = await ibzVestingContract.frozenBoxes(3)
        console.log(frozen[0].toString(), frozen[1].toString(), frozen[2].toString(), frozen[3].toString(), 
            frozen[4].toString(), frozen[5].toString(), frozen[6].toString(), frozen[7].toString())
        console.log((await ibzVestingContract.getTransferableAmount(3)).toString())

        // 50M, 0 Days, 100% (100 * 1e18) - LBP
        // await ibzVestingContract.depositPerVestingType([web3.utils.toWei('50000000')], 4, {from: tokenOwner});
        // frozen = await ibzVestingContract.frozenBoxes(4)
        // console.log(frozen[0].toString(), frozen[1].toString(), frozen[2].toString(), frozen[3].toString(), 
        //     frozen[4].toString(), frozen[5].toString(), frozen[6].toString(), frozen[7].toString())
        // console.log((await ibzVestingContract.getTransferableAmount(4)).toString())

        // 50M, 3 months delay, 25% every 90 days - Early investors
        // await ibzVestingContract.depositPerVestingType([web3.utils.toWei('50000000')], 5, {from: tokenOwner});
        // frozen = await ibzVestingContract.frozenBoxes(5)
        // console.log(frozen[0].toString(), frozen[1].toString(), frozen[2].toString(), frozen[3].toString(), 
        //     frozen[4].toString(), frozen[5].toString(), frozen[6].toString(), frozen[7].toString())
        // console.log((await ibzVestingContract.getTransferableAmount(5)).toString())

        // await ibzVestingContract.depositPerVestingType([web3.utils.toWei('1000000')], 6, {from: tokenOwner});
        // frozen = await ibzVestingContract.frozenBoxes(6)
        // console.log(frozen[0].toString(), frozen[1].toString(), frozen[2].toString(), frozen[3].toString(), 
        //     frozen[4].toString(), frozen[5].toString(), frozen[6].toString(), frozen[7].toString())
        // console.log((await ibzVestingContract.getTransferableAmount(6)).toString())
    });

    it("should get months", () => {
        return IbizaVesting.deployed()
            .then(async (instance) => instance.getMonths.call(0, 0, 1 * month))
            .then((months) => {
                assert.equal(months.toNumber(), 1, "test problem"); // current month release time
            })
    });

    it("should increase 30 days", async () => {
        await advanceBlockAtTime(releaseTime + 30 * oneDay);

        return IbizaVesting.deployed()
            .then(async (instance) =>  instance.getMonths.call(0, 0, 1 * month))
            .then((months) => {
                assert.equal(months.toNumber(), 2, "test problem");
            })
    });

    it("should increase 45 days", async () => {
        await advanceBlockAtTime(releaseTime + 45 * oneDay);

        return IbizaVesting.deployed()
            .then(async (instance) =>  instance.getMonths.call(0, 0, 1 * month))
            .then((months) => {
                assert.equal(months.toNumber(), 2, "test problem");
            })
    });

    it("should increase 60 days", async () => {
        await advanceBlockAtTime(releaseTime + 60 * oneDay);

        return IbizaVesting.deployed()
            .then(instance => instance.getMonths.call(0, 0, 1 * month))
            .then((months) => {
                assert.equal(months.toNumber(), 3, "test problem");
            })
    });

    it("call emergency withdraw", async () => {
        await ibzVestingContract.emergencyWithdraw(ibzTokenContract.address, 0);
    });

    it("Vesting simulation", async () => {
        await advanceBlockAtTime(releaseTime + (2 * 30) * oneDay);

        const types = {
            0: '580M, 2.083333% every month - Community',
            1: '140M, 8.3333% every month - Strategic investor',
            2: '100M, 2.7777% every month - Core team and advisor',
            3: '50M, 100%, 0 Days - Reserve Liquidity'
        };

        for (let x = 0; x < 4; x ++) {
            let lastTransferableAmount = '';
            for (let i = 0; i < 70; i ++) {
                //const day = 1613347200000 + (i * 30) * _oneDay;
                const day = releaseTime + (15 * oneDay) + (i * 30) * oneDay;  // 15 days after release time
                if(i == 0)
                    console.log(day, releaseTime)

                await advanceBlockAtTime(releaseTime + (15 * oneDay) + (i * 30) * oneDay);

                let timestamp = await ibzVestingContract.getTimestamp.call()
                let transferable = await ibzVestingContract.getTransferableAmount.call(x)
                let rest = await ibzVestingContract.getRestAmount.call(x)
                let canTransfer = await ibzVestingContract.canTransfer.call(x, transferable)

                if (transferable.toString() == '0' && rest.toString() == '0') {
                    continue;
                }

                // log
                console.log(`${types[x]} ${x}. box`, new Date(day), new Date(timestamp.toNumber() * 1000), (i + 1) + '. month - ', (i * 30) + '. day - ', 
                        'Transferable amount: ' + web3.utils.fromWei(transferable.toString()), ' - Rest: ' + web3.utils.fromWei(rest.toString()), 
                        ' - Can transfer: ' + canTransfer.toString());

                // Test the transfer
                if (canTransfer) {
                    lastBalanceForRecipientAtIdx[x] = await ibzTokenContract.balanceOf(recipients[x]);
                    await ibzVestingContract.transferFromFrozenBox(x, [recipients[x]], [transferable], {from: tokenOwner});
                    let newBalance = await ibzTokenContract.balanceOf(recipients[x]);
                    assert.equal(lastBalanceForRecipientAtIdx[x].add(transferable).toString(), newBalance.toString(), "Recipient did not received IBZ");
                } else {
                    await expectRevert(ibzVestingContract.transferFromFrozenBox(x, [recipients[x]], [transferable], {from: tokenOwner}), "IBZVesting: can not transfer yet");
                }

                // If transferable is greater than 0, also tests for an invalid transfer
                if (transferable > 0) {
                    await expectRevert(ibzVestingContract.transferFromFrozenBox(x, [recipients[x]], [transferable], {from: tokenOwner}), "IBZVesting: can not transfer yet");
                }

                lastTransferableAmount = transferable.toString();
            }
        }
    });
});
