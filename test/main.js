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

  it("Constructor contract migrations", async function () {
    const olsTellorInstance = await ethers.getContractAt("contracts/Interfaces.sol:Balancer", olsTellorContract)

    let checkMigrated = async (contractAddr) => {
      const ownedContract = await ethers.getContractAt("contracts/Interfaces.sol:Owned", contractAddr)
      const contractOwner = await ownedContract.owner()

      await checkMigratedTo(contractAddr, contractOwner)
    }

    let checkMigratedTo = async (contractAddr, contractOwner) => {
      let balanceToMigrate = Number(await olsTellorInstance.balanceOf(contractAddr))
      let migratedBalance = Number(await newTellor.balanceOf(contractOwner))
      expect(migratedBalance).to.equal(balanceToMigrate)
    }

    await checkMigrated("0x01fc3e9Bfc62ae9370694f968E33713F792C78cF")
    await checkMigratedTo("0xfDc6Fdb071A116714E1f73186339d9fA1623867F", "0xb17DB53E5519f804F48A11740793487296751236")
    await checkMigratedTo("0xDbC1b60fDd000F645B668d8026A28C26772A151c", "0x0957756646c5e808005dbF7970778c4AE5E80aEB")
    await checkMigratedTo("0x0966AEb41F4a94aAB7FB595A22CAa7b64ce73aA2", "0xD4DA002e714a7341a7d0fB1899F8260508E42653")
  })

  it("Manual contract migrations", async function () {
    const olsTellorInstance = await ethers.getContractAt("contracts/Interfaces.sol:Balancer", olsTellorContract)

    let migrateOk = async (contractAddr) => {
      let balanceToMigrate = Number(await olsTellorInstance.balanceOf(contractAddr))

      const ownedContract = await ethers.getContractAt("contracts/Interfaces.sol:Owned", contractAddr)
      const contractOwner = await ownedContract.owner()

      await testee.migrateContractTo(contractAddr, contractOwner)

      let migratedBalance = Number(await newTellor.balanceOf(contractOwner))
      expect(migratedBalance).to.equal(balanceToMigrate)

      // Second migration should revert.
      await expect(testee.migrateContractTo(contractAddr,contractOwner)).to.be.reverted
    }

    let migrateNonAdmin = async (contractAddr) => {
      contractOwner = "0x54d13ec47eda7189983c68a67e8498f0e755c859"
      await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [contractOwner]
      })

      const walletOwner = await ethers.provider.getSigner(contractOwner)
      await expect(testee.connect(walletOwner).migrateAddress(contractAddr)).to.be.reverted
    }

    let wallets = ["0x0C9411796D09f6Fe48B28D2271CB9D609AD951B3", "0xBCED67c5538Cd284410CC340954167A84449a25E", "0xD08bE82eAf2f56D3aDA11E7862D12bcd9f263b29"]

    await Promise.all(wallets.map(async (contractAddr) => {
      await migrateNonAdmin(contractAddr)
      await migrateOk(contractAddr)
    }));

  })

  it("Migrate address migrations", async function () {
    const olsTellorInstance = await ethers.getContractAt("contracts/Interfaces.sol:Balancer", olsTellorContract)

    let migrateOk = async (contractAddr) => {
      let balanceToMigrate = Number(await olsTellorInstance.balanceOf(contractAddr))
      await testee.migrateAddress(contractAddr)

      let migratedBalance = Number(await newTellor.balanceOf(contractAddr))
      expect(migratedBalance).to.equal(balanceToMigrate)

      // Second migration should revert.
      await expect(testee.migrateAddress(contractAddr)).to.be.reverted
    }

    let wallets = ["0x0C9411796D09f6Fe48B28D2271CB9D609AD951B3", "0xBCED67c5538Cd284410CC340954167A84449a25E", "0xD08bE82eAf2f56D3aDA11E7862D12bcd9f263b29"]

    await Promise.all(wallets.map(async (contractAddr) => {
      await migrateOk(contractAddr)
    }));

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
