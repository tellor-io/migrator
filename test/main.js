const { expect } = require("chai");

let UniPairTrbEth = "0x70258aa9830c2c84d855df1d61e12c256f6448b4"
let trbPrice = "38582000000000000000" // This many TRBs equal 1eth.
describe("All tests", function () {

  // Addresses taken from the uniswap token pool holders
  // https://etherscan.io/token/0x70258aa9830c2c84d855df1d61e12c256f6448b4#balances
  it("Check Uniswap balance", async function () {
    let pair = await ethers.getContractAt("contracts/Interfaces.sol:IUniswapV2Pair", UniPairTrbEth);


    let calcUniPrice = async (addr) => {

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

    // Wallet with 29TRB total(ETH is converted into TRB).
    // Can check that the result is correct at zerion.
    // https://app.zerion.io/0x68e22efdcdbf59d077ff87e777b414b7ae333f0b/overview
    {
      let addr = "0x68e22efdcdbf59d077ff87e777b414b7ae333f0b"

      let actualBalance = Number(await calcUniPrice(addr))
      let expBalance = Number(await uniswap.connect(addr).trbBalance())

      // This is only very small precision error 13 digits after the point.
      expect(expBalance).to.be.closeTo(actualBalance, 30000)
    }

    // Wallet with 2246TRB total(ETH is converted into TRB).
    // Can check that the result is correct at zerion.
    // https://app.zerion.io/0xf7a9ac9abe8e38ec6c30584081de1edf51a0e9b8/overview
    {
      let addr = "0x68e22efdcdbf59d077ff87e777b414b7ae333f0b"

      let actualBalance = Number(await calcUniPrice(addr))
      let expBalance = Number(await uniswap.connect(addr).trbBalance())

      // This is only very small precision error 13 digits after the point.
      expect(expBalance).to.be.closeTo(actualBalance, 30000)
    }

  });

});

// `beforeEach` will run before each test, re-deploying the contract every
// time. It receives a callback, which can be async.
beforeEach(async function () {
  // [owner, acc1, acc2, acc3, acc4, acc5] = await ethers.getSigners();

  let fact = await ethers.getContractFactory("Main");
  testee = await fact.deploy("0x0Ba45A8b5d5575935B8158a88C631E9F9C95a2e5", "0x0Ba45A8b5d5575935B8158a88C631E9F9C95a2e5");
  await testee.deployed();

  fact = await ethers.getContractFactory("Uniswap");
  uniswap = await fact.deploy(UniPairTrbEth, trbPrice);
  await uniswap.deployed();

});
