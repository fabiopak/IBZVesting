const {
    BN,
    constants,
    ether,
    time,
    balance,
    expectEvent,
    expectRevert
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
const releaseTime = 1626351658000;  // future date
const oneDay = 86400000;
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
    const allocation1 = accounts[3]
    const allocation2 = accounts[4]
    const allocation3 = accounts[5]
    const allocation4 = accounts[6]
    const allocation5 = accounts[7]
    const allocation6 = accounts[8]
    const allocation7 = accounts[9]
    
    // it('upgrade', async () => {
    //   const IbizaVesting = await deployProxy(IbizaVesting);
    //   assert.equal(await IbizaVesting.getReleaseTime(), 1611588600, "not same")
    // });

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

    // it("shouldn't set wallets", () => {
    //     const wallets = [accounts[0]];
    //     const totalAmounts = ['10000000000000000000000000000'];

    //     return IbizaVesting.deployed()
    //         .then(async instance => {

    //             try {
    //                 await instance.addAllocations(wallets, totalAmounts, '0', {from: accounts[0]})
    //             } catch (err) {
    //                 assert.equal(err.reason, 'Max total supply over');
    //             }
    //         })
    // });
    // it("should set wallets", async () => {
    //     const instance = await IbizaVesting.deployed();

    //     for (const i in wallets) {
    //         const wallet = wallets[i]
    //         const amount = totalAmounts[i]

    //         const a = await instance.addAllocations([wallet], [amount], i.toString(), {from: '0x67F5B9e57EaE4f5f32E98BB7D7D1fb8F90AcFb45'});
    //     }
    // });

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
        await ibzTokenContract.approve(ibzVestingContract.address, web3.utils.toWei('100000000'), {from: tokenOwner});
        await ibzVestingContract.depositPerVestingType([allocation1], [web3.utils.toWei('1000000')], 0, {from: tokenOwner});
        bal = await ibzTokenContract.balanceOf(allocation1)
        expect(web3.utils.fromWei(bal.toString())).to.be.equal('1000000')
        await ibzVestingContract.depositPerVestingType([allocation2], [web3.utils.toWei('1000000')], 1, {from: tokenOwner});
        bal = await ibzTokenContract.balanceOf(allocation2)
        expect(web3.utils.fromWei(bal.toString())).to.be.equal('1000000')
        await ibzVestingContract.depositPerVestingType([allocation3], [web3.utils.toWei('1000000')], 2, {from: tokenOwner});
        bal = await ibzTokenContract.balanceOf(allocation3)
        expect(web3.utils.fromWei(bal.toString())).to.be.equal('1000000')
        await ibzVestingContract.depositPerVestingType([allocation4], [web3.utils.toWei('1000000')], 3, {from: tokenOwner});
        bal = await ibzTokenContract.balanceOf(allocation4)
        expect(web3.utils.fromWei(bal.toString())).to.be.equal('1000000')
        await ibzVestingContract.depositPerVestingType([allocation5], [web3.utils.toWei('1000000')], 4, {from: tokenOwner});
        bal = await ibzTokenContract.balanceOf(allocation5)
        expect(web3.utils.fromWei(bal.toString())).to.be.equal('1000000')
        await ibzVestingContract.depositPerVestingType([allocation6], [web3.utils.toWei('1000000')], 5, {from: tokenOwner});
        bal = await ibzTokenContract.balanceOf(allocation6)
        expect(web3.utils.fromWei(bal.toString())).to.be.equal('1000000')
        await ibzVestingContract.depositPerVestingType([allocation7], [web3.utils.toWei('1000000')], 6, {from: tokenOwner});
        bal = await ibzTokenContract.balanceOf(allocation7)
        expect(web3.utils.fromWei(bal.toString())).to.be.equal('1000000')
    });
/*
    it("should put 1000000 token account 1", () => {
        return IbizaVesting.deployed()
            .then(async instance => instance.balanceOf.call(allocation1))
            .then((balance) => {
                assert.equal(balance.toString(), web3.utils.toWei('1000000'), "test problem");
            });
    });

    it("should put 1000000 token account 2", () => {
        return IbizaVesting.deployed()
            .then(instance => instance.balanceOf.call(allocation2))
            .then((balance) => {
                assert.equal(balance.toString(), web3.utils.toWei('1000000'), "test problem");
            });
    });
*/
    it("shouldn't send token", async function () {
        // console.log((await web3.eth.getBlock()).timestamp)

        await ibzTokenContract.approve(accounts[0], web3.utils.toWei('1000000'), {from: allocation1})

        try {
            await ibzTokenContract.transfer(allocation3, web3.utils.toWei('1000000'), {from: allocation2});
        } catch (err) {
            assert.equal(err.reason, 'Wait for vesting day!');
        }
        
        // console.log((await instance.balanceOf(allocation2)).toString())
        // console.log((await instance.balanceOf(allocation3)).toString())

        try {
            await ibzTokenContract.transfer(allocation2, web3.utils.toWei('1000000'), {from: allocation3});
        } catch (err) {
            assert.equal(err.reason, 'Wait for vesting day!');
        }

        // console.log((await instance.balanceOf(allocation2)).toString())
        // console.log((await instance.balanceOf(allocation3)).toString())
    });

    it("should put 1000000 token account 3", () => {
        return IbizaToken.deployed()
            .then(instance => instance.balanceOf.call(allocation3))
            .then((balance) => {
                assert.equal(balance.toString(), web3.utils.toWei('1000000'), "test problem");
            });
    });

    it("should put 1000000 token account 4", () => {
        return IbizaToken.deployed()
            .then(instance => instance.balanceOf.call(allocation4))
            .then((balance) => {
                assert.equal(balance.toString(), web3.utils.toWei('1000000'), "test problem");
            });
    });

    it("should put 1000000 token account 5", () => {
        return IbizaToken.deployed()
            .then(instance => instance.balanceOf.call(allocation5))
            .then((balance) => {
                assert.equal(balance.toString(), web3.utils.toWei('1000000'), "test problem");
            });
    });

    it("should put 1000000 token account 6", () => {
        return IbizaToken.deployed()
            .then(instance => instance.balanceOf.call(allocation6))
            .then((balance) => {
                assert.equal(balance.toString(), web3.utils.toWei('1000000'), "test problem");
            });
    });

    it("should put 1000000 token account 7", () => {
        return IbizaToken.deployed()
            .then(instance => instance.balanceOf.call(allocation7))
            .then((balance) => {
                assert.equal(balance.toString(), web3.utils.toWei('1000000'), "test problem");
            });
    });

    it("should get months", () => {
        return IbizaVesting.deployed()
            .then(async (instance) => instance.getMonths.call(0, 0))
            .then((months) => {
                assert.equal(months.toNumber(), 1, "test problem"); // current month release time
            })
    });

    it("should increase 30 days", async () => {
        await advanceBlockAtTime(releaseTime + 30 * oneDay);

        return IbizaVesting.deployed()
            .then(async (instance) =>  instance.getMonths.call(0, 0))
            .then((months) => {
                assert.equal(months.toNumber(), 2, "test problem");
            })
    });

    it("should increase 45 days", async () => {
        await advanceBlockAtTime(releaseTime + 45 * oneDay);

        return IbizaVesting.deployed()
            .then(async (instance) =>  instance.getMonths.call(0, 0))
            .then((months) => {
                assert.equal(months.toNumber(), 2, "test problem");
            })
    });

    it("should increase 60 days", async () => {
        await advanceBlockAtTime(releaseTime + 60 * oneDay);

        return IbizaVesting.deployed()
            .then(instance => instance.getMonths.call(0, 0))
            .then((months) => {
                assert.equal(months.toNumber(), 3, "test problem");
            })
    });

    it("transfer logs", async () => {
        const instance = await IbizaVesting.deployed();
        await advanceBlockAtTime(releaseTime + (2 * 30) * oneDay);

        const types = {
            0: '0 Days 100%',
            1: '12% TGE + 8% every 30 days',
            2: '10% TGE + 6% every 30 days',
            3: '10% TGE + 6% every 30 days',
            4: '4 months delay + 5% every 30 Days',
            5: '4 months delay + 2% every 30 days',
            6: '14 months delay + 4% every 30 days'
        };

        for (let x = 3; x < 10; x ++) {
            let lastTransferableAmount = '';
            for (let i = 0; i < 70; i ++) {
                //const day = 1613347200000 + (i * 30) * _oneDay;
                const day = 1625389686000 + (i * 30) * oneDay;  // 15 days after release time

                await advanceBlockAtTime(releaseTime + (i * 30) * oneDay);

                let timestamp = await instance.getTimestamp.call()
                let transferable = await instance.getTransferableAmount.call(accounts[x])
                let rest = await instance.getRestAmount.call(accounts[x])
                let canTransfer = await instance.canTransfer.call(accounts[x], transferable)

                if (lastTransferableAmount !== transferable.toString()) {
                    console.log(`${types[x-3]} ${x}. account`, new Date(day), new Date(timestamp.toNumber() * 1000), (i + 1) + '. month', (i * 30) + '. day', 
                            'Transferable amount: ' + web3.utils.fromWei(transferable.toString()), 'Rest: ' + web3.utils.fromWei(rest.toString()), 
                            'Can transfer: ' + canTransfer.toString());
                    lastTransferableAmount = transferable.toString();
                } else {
                    continue;
                }
            }
        }
    });
});
