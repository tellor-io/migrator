const { expect } = require("chai");

let UniPairTrbEth = "0x70258aa9830c2c84d855df1d61e12c256f6448b4"
let trbPrice = "38582000000000000000" // This many TRBs equal 1ETH.


// Small Uniswap wallet with 29 TRB(ETH is converted into TRB).
// https://app.zerion.io/0x68e22efdcdbf59d077ff87e777b414b7ae333f0b/overview
let wallet_Small_Uniswap = "0x68e22efdcdbf59d077ff87e777b414b7ae333f0b";
// Big Uniswap wallet with 2246 TRB(ETH is converted into TRB).
// https://app.zerion.io/0xf7a9ac9abe8e38ec6c30584081de1edf51a0e9b8/overview
let wallet_Big_Uniswap = "0xf7a9ac9abe8e38ec6c30584081de1edf51a0e9b8"

// Small TRB wallet with 0.1276683 TRB
// https://app.zerion.io/0x2e3381202988d535e8185e7089f633f7c9998e83/overview
let wallet_Big = "0x2e3381202988d535e8185e7089f633f7c9998e83"
// Big TRB wallet with 16095 TRB
// https://app.zerion.io/0x3a05689137b23c136744799735867da74e9b9d75/overview
let wallet_Big = "0x3a05689137b23c136744799735867da74e9b9d75"

describe("All tests", function () {

  // Addresses taken from the uniswap token pool holders
  // https://etherscan.io/token/0x70258aa9830c2c84d855df1d61e12c256f6448b4#balances
  it("Check Uniswap balance", async function () {

    {
      let actualBalance = Number(await calcUniPrice(wallet_Small_Uniswap))
      let expBalance = Number(await uniswap.connect(wallet_Small_Uniswap).trbBalance())

      // This is only very small precision error 13 digits after the point.
      expect(expBalance).to.be.closeTo(actualBalance, 30000)
    }

    {
      let actualBalance = Number(await calcUniPrice(wallet_Big_Uniswap))
      let expBalance = Number(await uniswap.connect(wallet_Big_Uniswap).trbBalance())

      // This is only very small precision error 13 digits after the point.
      expect(expBalance).to.be.closeTo(actualBalance, 30000)
    }

  });
});

it("Full simulated migrations", async function () {
  balance = testee.trbBalance(wallet_Big)

  testee.migrate
  expect(1).to.equal(0) // Just a reminder that need to write a test for this.
})

it("No double migrations", async function () {
  expect(1).to.equal(0) // Just a reminder that need to write a test for this.
})

it("View migrated totals", async function () {
  expect(1).to.equal(0) // Just a reminder that need to write a test for this.
})



// `beforeEach` will run before each test, re-deploying the contract every
// time. It receives a callback, which can be async.
beforeEach(async function () {
  // [owner, acc1, acc2, acc3, acc4, acc5] = await ethers.getSigners();

  // TODO remove this when we have a running oracle version on mainnet and use it directly.
  let fact = await ethers.getContractFactory("contracts/testing/Mintable.sol:Mintable");
  mintable = await fact.deploy("Tellor Tribute", "TRB");
  await mintable.deployed();

  fact = await ethers.getContractFactory("Main");
  testee = await fact.deploy(mintable.address, "0x0Ba45A8b5d5575935B8158a88C631E9F9C95a2e5");
  await testee.deployed();

  fact = await ethers.getContractFactory("Uniswap");
  uniswap = await fact.deploy(UniPairTrbEth, trbPrice);
  await uniswap.deployed();

});

let calcUniPrice = async (addr) => {
  let pair = await ethers.getContractAt("contracts/Interfaces.sol:IUniswapV2Pair", UniPairTrbEth);

  let userBalance = ethers.FixedNumber.from(await pair.balanceOf(addr))
  let totalSupply = ethers.FixedNumber.from(await pair.totalSupply())

  let poolShare = userBalance.divUnsafe(totalSupply);

  let [t1Reserve, t2Reserve,] = await pair.getReserves();

  t1Reserve = ethers.FixedNumber.from(t1Reserve)
  t2Reserve = ethers.FixedNumber.from(t2Reserve)
  let t1Balance = t1Reserve.mulUnsafe(poolShare);
  let t2Balance = t2Reserve.mulUnsafe(poolShare);


  let tPrice = ethers.FixedNumber.from(trbPrice)


  let devider = ethers.FixedNumber.from("1000000000000000000")
  let t2TokenCount = t2Balance.mulUnsafe(tPrice).divUnsafe(devider)
  let t1TotalBalance = t1Balance.addUnsafe(t2TokenCount);

  return t1TotalBalance
}
