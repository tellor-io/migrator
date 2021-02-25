const { expect } = require("chai");

const UniPairTrbEth = "0x70258Aa9830C2C84d855Df1D61E12C256F6448b4"
const olsTellorContract = "0x0Ba45A8b5d5575935B8158a88C631E9F9C95a2e5"

// Small wallet with only TRB Uniswap tokens - less than 1 TRB(ETH is converted into TRB)..
// https://app.zerion.io/0x974896e96219dd508100f2ad58921290655072ad
const wallet_Small_Uniswap = "0x974896e96219dd508100f2ad58921290655072ad";
// Big wallet with only TRB Uniswap tokens - more than 2k TRB(ETH is converted into TRB)..
// https://app.zerion.io/0xf7a9ac9abe8e38ec6c30584081de1edf51a0e9b8
const wallet_Big_Uniswap = "0xf7a9ac9abe8e38ec6c30584081de1edf51a0e9b8"

describe("All tests", function () {

  it("Uniswap migrations", async function () {
    const uniswapInstance = await ethers.getContractAt("contracts/Interfaces.sol:IUniswapV2Pair", UniPairTrbEth)

    let migrate = async (addrToMigrate) => {
      let originalBalance = Number(await uniBalance(addrToMigrate))
      let balanceToMigrate = Number(await testee.trbBalanceOfUniswap(addrToMigrate))

      // This is only very small precision error - 12 digits after the point.
      expect(originalBalance).to.be.closeTo(balanceToMigrate, 200000)

      await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [addrToMigrate]
      })

      const walletOwner = await ethers.provider.getSigner(addrToMigrate)
      // Migrate should fail without an approval of spending the uniswap tokens.
      await expect(testee.connect(walletOwner).migrateUniswap()).to.be.reverted

      // Approve the contract to spend the uniswap tokens as these need to be burned during the migration to avoid double spending.
      await uniswapInstance.connect(walletOwner).approve(await testee.uniswapMigrator(), await uniswapInstance.balanceOf(addrToMigrate))
      await testee.connect(walletOwner).migrateUniswap()

      let migratedBalance = Number(await newTellor.balanceOf(addrToMigrate))
      expect(migratedBalance).to.be.closeTo(originalBalance, 200000)

      // Uniswap balance should be zero after the migration to avoid double spending.
      expect(await uniswapInstance.balanceOf(addrToMigrate)).to.equal(0)

    }

    await migrate(wallet_Small_Uniswap)
    await migrate(wallet_Big_Uniswap)



    // Ensure the migration of an address with 0 balance reverts.
    let addrToMigrate = "0xbe0eb53f46cd790cd13851d5eff43d12404d33e8"
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [addrToMigrate]
    })

    const walletOwner = await ethers.provider.getSigner(addrToMigrate)
    await uniswapInstance.connect(walletOwner).approve(await testee.uniswapMigrator(), await uniswapInstance.balanceOf(addrToMigrate))
    await expect(testee.connect(walletOwner).migrateUniswap()).to.be.reverted

  })

  it("Contract migrations", async function () {
    const olsTellorInstance = await ethers.getContractAt("contracts/Interfaces.sol:Balancer", olsTellorContract)

    let migrateOk = async (contractAddr, contractOwner) => {
      let balanceToMigrate = Number(await olsTellorInstance.balanceOf(contractAddr))

      await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [contractOwner]
      })

      const walletOwner = await ethers.provider.getSigner(contractOwner)

      await testee.connect(walletOwner).migrateContract(contractAddr)

      let migratedBalance = Number(await newTellor.balanceOf(contractOwner))
      expect(migratedBalance).to.equal(balanceToMigrate)

      // Second migration should revert.
      await expect(testee.connect(walletOwner).migrateContract(contractAddr)).to.be.reverted
    }

    let migrateNonWhiteListed = async (contractAddr, contractOwner) => {
      await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [contractOwner]
      })

      const walletOwner = await ethers.provider.getSigner(contractOwner)
      await expect(testee.connect(walletOwner).migrateContract(contractAddr)).to.be.reverted
    }

    let migrateNonOwner = async (contractAddr, contractOwner) => {
      await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [contractOwner]
      })

      const walletOwner = await ethers.provider.getSigner(contractOwner)
      await expect(testee.connect(walletOwner).migrateContract(contractAddr)).to.be.reverted
    }

    let whiteListed = ["0x01fc3e9bfc62ae9370694f968e33713f792c78cf"]

    await Promise.all(whiteListed.map(async (contractAddr) => {
      await migrateNonOwner(contractAddr, "0x54d13ec47eda7189983c68a67e8498f0e755c859")
      await migrateOk(contractAddr, "0xa4b85427d108d28d385bed1c1c8f27384f62ebd8")

    }));

    await migrateNonWhiteListed("0xbe0eb53f46cd790cd13851d5eff43d12404d33e8", "0xa4b85427d108d28d385bed1c1c8f27384f62ebd8")

  })

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
  const uniswapInstance = await ethers.getContractAt("contracts/Interfaces.sol:IUniswapV2Pair", UniPairTrbEth)

  let userBalance = ethers.FixedNumber.from(await uniswapInstance.balanceOf(addr))
  let totalSupply = ethers.FixedNumber.from(await uniswapInstance.totalSupply())

  let poolShare = userBalance.divUnsafe(totalSupply);

  let [t1Reserve, t2Reserve,] = await uniswapInstance.getReserves();

  t1Reserve = ethers.FixedNumber.from(t1Reserve)
  t2Reserve = ethers.FixedNumber.from(t2Reserve)
  return 2 * t1Reserve.mulUnsafe(poolShare);
}