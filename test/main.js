const { expect } = require("chai");

let UniPairTrbEth = "0x70258Aa9830C2C84d855Df1D61E12C256F6448b4"

// Small wallet with only TRB Uniswap tokens - less than 1 TRB(ETH is converted into TRB)..
// https://app.zerion.io/0x974896e96219dd508100f2ad58921290655072ad
let wallet_Small_Uniswap = "0x974896e96219dd508100f2ad58921290655072ad";
// Big wallet with only TRB Uniswap tokens - more than 2k TRB(ETH is converted into TRB)..
// https://app.zerion.io/0xf7a9ac9abe8e38ec6c30584081de1edf51a0e9b8
let wallet_Big_Uniswap = "0xf7a9ac9abe8e38ec6c30584081de1edf51a0e9b8"

describe("All tests", function () {
  it("Full simulated migrations", async function () {

    let migrate = async (addrToMigrate) => {
      let originalBalance = Number(await uniBalance(addrToMigrate))
      let balanceToMigrate = Number(await testee.trbBalanceOfAll(addrToMigrate))

      // This is only very small precision error - 12 digits after the point.
      expect(originalBalance).to.be.closeTo(balanceToMigrate, 200000)

      await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [addrToMigrate]
      }
      )

      let uniswap = await ethers.getContractAt("contracts/Interfaces.sol:IUniswapV2Pair", UniPairTrbEth);
      const walletOwner = await ethers.provider.getSigner(addrToMigrate)
      // Migrate should fail without an approval of spending the uniswap tokens.
      await expect(testee.connect(walletOwner).migrate()).to.be.reverted

      console.log('approve testee.address', testee.address);

      // Approve the contract to spend the uniswap tokens as these need to be burned during the migration to avoid double spending.
      await uniswap.connect(walletOwner).approve(testee.address, await uniswap.balanceOf(addrToMigrate))
      await testee.connect(walletOwner).migrate()

      let migratedBalance = Number(await newTellor.balanceOf(addrToMigrate))
      expect(migratedBalance).to.be.closeTo(originalBalance, 200000)


      // Uniswap balance should be zero after the migration to avoid double spending.
      expect(await uniswap.balanceOf(addrToMigrate)).to.equal(0)

    }

    await migrate(wallet_Small_Uniswap)
    await migrate(wallet_Big_Uniswap)

  })

  // it("No double migrations", async function () {
  //   expect(1).to.equal(0) // Just a reminder that need to write a test for this.
  // })

  // it("Migration only own tokens ", async function () {
  //   expect(1).to.equal(0) // Just a reminder that need to write a test for this.
  // })

  // it("View migrated totals", async function () {
  //   expect(1).to.equal(0) // Just a reminder that need to write a test for this.
  // })

  // `beforeEach` will run before each test, re-deploying the contract every
  // time. It receives a callback, which can be async.
  beforeEach(async function () {

    // TODO remove this when we have a running oracle version on mainnet and use it directly.
    let fact = await ethers.getContractFactory("contracts/testing/Token.sol:Token");
    newTellor = await fact.deploy("Tellor Tribute", "TRB");
    await newTellor.deployed();

    fact = await ethers.getContractFactory("Main");
    testee = await fact.deploy(newTellor.address);
    await testee.deployed();
  });
});

let uniBalance = async (addr) => {
  let pair = await ethers.getContractAt("contracts/Interfaces.sol:IUniswapV2Pair", UniPairTrbEth);

  let userBalance = ethers.FixedNumber.from(await pair.balanceOf(addr))
  let totalSupply = ethers.FixedNumber.from(await pair.totalSupply())

  let poolShare = userBalance.divUnsafe(totalSupply);

  let [t1Reserve, t2Reserve,] = await pair.getReserves();

  t1Reserve = ethers.FixedNumber.from(t1Reserve)
  t2Reserve = ethers.FixedNumber.from(t2Reserve)
  return 2 * t1Reserve.mulUnsafe(poolShare);
}