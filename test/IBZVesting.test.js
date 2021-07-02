const IBZVesting = artifacts.require("IBZVesting");

//const releaseTime = 1611588600000;
const releaseTime = 1624266486000;  // future date
const oneDay = 86400000;
//const _oneDay = 86400000;
/*
const allocation1 = process.env.ALLOCATION_1
const allocation2 = process.env.ALLOCATION_2
const allocation3 = process.env.ALLOCATION_3
const allocation4 = process.env.ALLOCATION_4
const allocation5 = process.env.ALLOCATION_5
const allocation6 = process.env.ALLOCATION_6
const allocation7 = process.env.ALLOCATION_7
//const allocation8 = process.env.ALLOCATION_8
*/
const Web3 = require('web3');
// Ganache UI on 8545
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));

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

contract("IBZVesting Test", accounts => {

    const allocation1 = accounts[3]
    const allocation2 = accounts[4]
    const allocation3 = accounts[5]
    const allocation4 = accounts[6]
    const allocation5 = accounts[7]
    const allocation6 = accounts[8]
    const allocation7 = accounts[9]
    
    // it('upgrade', async () => {
    //   const IBZVesting = await deployProxy(IBZVesting);
    //   assert.equal(await IBZVesting.getReleaseTime(), 1611588600, "not same")
    // });

    it('pause', () => {
        return IBZVesting.deployed()
            .then(async (instance) => {
                await instance.pause(true)
                console.log(await instance.paused());
            })
    });

    it('unpause', () => {
        return IBZVesting.deployed()
            .then(async (instance) => {
                await instance.pause(false)
                console.log(await instance.paused());
            })
    });

    // it("shouldn't set wallets", () => {
    //     const wallets = [accounts[0]];
    //     const totalAmounts = ['10000000000000000000000000000'];

    //     return IBZVesting.deployed()
    //         .then(async instance => {

    //             try {
    //                 await instance.addAllocations(wallets, totalAmounts, '0', {from: accounts[0]})
    //             } catch (err) {
    //                 assert.equal(err.reason, 'Max total supply over');
    //             }
    //         })
    // });
    // it("should set wallets", async () => {
    //     const instance = await IBZVesting.deployed();

    //     for (const i in wallets) {
    //         const wallet = wallets[i]
    //         const amount = totalAmounts[i]

    //         const a = await instance.addAllocations([wallet], [amount], i.toString(), {from: '0x67F5B9e57EaE4f5f32E98BB7D7D1fb8F90AcFb45'});
    //     }
    // });

    // console.log (accounts)

    it("should put 1000000 token account 1", () => {
        return IBZVesting.deployed()
            .then(async instance => instance.balanceOf.call(allocation1))
            .then((balance) => {
                assert.equal(balance.toString(), web3.utils.toWei('1000000'), "test problem");
            });
    });

    it("should put 1000000 token account 2", () => {
        return IBZVesting.deployed()
            .then(instance => instance.balanceOf.call(allocation2))
            .then((balance) => {
                assert.equal(balance.toString(), web3.utils.toWei('1000000'), "test problem");
            });
    });

    it("shouldn't send token", async () => {
        const instance = await IBZVesting.deployed();

        // console.log((await web3.eth.getBlock()).timestamp)

        await instance.approve(accounts[0], web3.utils.toWei('1000000'), {from: allocation1})

        try {
            await instance.transferFrom(allocation2, allocation3, web3.utils.toWei('1000000'), {from: accounts[0]});
        } catch (err) {
            assert.equal(err.reason, 'Wait for vesting day!');
        }
        
        // console.log((await instance.balanceOf(allocation2)).toString())
        // console.log((await instance.balanceOf(allocation3)).toString())

        try {
            await instance.transfer(allocation2, web3.utils.toWei('1000000'), {from: allocation2});
        } catch (err) {
            assert.equal(err.reason, 'Wait for vesting day!');
        }

        // console.log((await instance.balanceOf(allocation2)).toString())
        // console.log((await instance.balanceOf(allocation3)).toString())
    });

    it("should put 1000000 token account 3", () => {
        return IBZVesting.deployed()
            .then(instance => instance.balanceOf.call(allocation3))
            .then((balance) => {
                assert.equal(balance.toString(), web3.utils.toWei('1000000'), "test problem");
            });
    });

    it("should put 1000000 token account 4", () => {
        return IBZVesting.deployed()
            .then(instance => instance.balanceOf.call(allocation4))
            .then((balance) => {
                assert.equal(balance.toString(), web3.utils.toWei('1000000'), "test problem");
            });
    });

    it("should put 1000000 token account 5", () => {
        return IBZVesting.deployed()
            .then(instance => instance.balanceOf.call(allocation5))
            .then((balance) => {
                assert.equal(balance.toString(), web3.utils.toWei('1000000'), "test problem");
            });
    });

    it("should put 1000000 token account 6", () => {
        return IBZVesting.deployed()
            .then(instance => instance.balanceOf.call(allocation6))
            .then((balance) => {
                assert.equal(balance.toString(), web3.utils.toWei('1000000'), "test problem");
            });
    });

    it("should put 1000000 token account 7", () => {
        return IBZVesting.deployed()
            .then(instance => instance.balanceOf.call(allocation7))
            .then((balance) => {
                assert.equal(balance.toString(), web3.utils.toWei('1000000'), "test problem");
            });
    });

    it("should get months", () => {
        return IBZVesting.deployed()
            .then(async (instance) => instance.getMonths.call(0, 0))
            .then((months) => {
                assert.equal(months.toNumber(), 1, "test problem"); // current month release time
            })
    });

    it("should increase 30 days", async () => {
        await advanceBlockAtTime(releaseTime + 30 * oneDay);

        return IBZVesting.deployed()
            .then(async (instance) =>  instance.getMonths.call(0, 0))
            .then((months) => {
                assert.equal(months.toNumber(), 2, "test problem");
            })
    });

    it("should increase 45 days", async () => {
        await advanceBlockAtTime(releaseTime + 45 * oneDay);

        return IBZVesting.deployed()
            .then(async (instance) =>  instance.getMonths.call(0, 0))
            .then((months) => {
                assert.equal(months.toNumber(), 2, "test problem");
            })
    });

    it("should increase 60 days", async () => {
        await advanceBlockAtTime(releaseTime + 60 * oneDay);

        return IBZVesting.deployed()
            .then(instance => instance.getMonths.call(0, 0))
            .then((months) => {
                assert.equal(months.toNumber(), 3, "test problem");
            })
    });

    it("transfer logs", async () => {
        const instance = await IBZVesting.deployed();
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
