const { expect } = require("chai");

const devShareWallet = "0x39e419ba25196794b595b2a595ea8e527ddc9856"
const oldTellorContract = "0x0Ba45A8b5d5575935B8158a88C631E9F9C95a2e5"

describe("All tests", function () {
  it("Exchange pool migrations", async function () {
    let migrate = async ({ pairAddr, addrToMigrate, poolType }) => {
      let poolContractInstance
      let originalBalance
      if (poolType == "uniswap") {
        poolContractInstance = await ethers.getContractAt("contracts/Interfaces.sol:IUniswapV2Pair", pairAddr)
        originalBalance = Number(await uniBalance(poolContractInstance, addrToMigrate))
      } else {
        poolContractInstance = await ethers.getContractAt("contracts/Interfaces.sol:BPoolPair", pairAddr)
        originalBalance = Number(await balBalance(poolContractInstance, addrToMigrate))
      }
      let balanceToMigrate = Number(await testee.trbBalanceOf(pairAddr, addrToMigrate))

      // This is only a very small precision error - 12 digits after the point.
      expect(originalBalance).to.be.closeTo(balanceToMigrate, 200000)

      await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [addrToMigrate]
      })

      let walletOwner = await ethers.provider.getSigner(addrToMigrate)
      // Migrate should fail without an approval of spending the tokens.
      await expect(testee.connect(walletOwner).migratePool(pairAddr)).to.be.reverted

      // Approve the contract to spend the LP tokens as 
      // these need to be burned(transferred to the devShare account) during the migration to 
      // avoid double spending.
      let poolTokensAmount = await poolContractInstance.balanceOf(addrToMigrate)
      let devShareTokenAmountBeforeMigrate = await poolContractInstance.balanceOf(devShareWallet)
      await poolContractInstance.connect(walletOwner).approve(await testee.getPool(pairAddr), poolTokensAmount)
      await testee.connect(walletOwner).migratePool(pairAddr)

      let migratedBalance = Number(await newTellor.balanceOf(addrToMigrate))
      expect(migratedBalance).to.be.closeTo(originalBalance, 200000)

      // Pool balance should be zero after the migration to avoid double spending.
      expect(await poolContractInstance.balanceOf(addrToMigrate)).to.equal(0)
      // All pool balance should be transfered to the dev share wallet.
      expect(await poolContractInstance.balanceOf(devShareWallet)).to.equal(poolTokensAmount.add(devShareTokenAmountBeforeMigrate))

      await poolContractInstance.balanceOf(addrToMigrate)

      // Ensure the migration of an address with 0 balance reverts.
      addrToMigrate = "0xbe0eb53f46cd790cd13851d5eff43d12404d33e8"
      await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [addrToMigrate]
      })

      walletOwner = await ethers.provider.getSigner(addrToMigrate)
      await poolContractInstance.connect(walletOwner).approve(await testee.getPool(pairAddr), await poolContractInstance.balanceOf(addrToMigrate))
      await expect(testee.connect(walletOwner).migratePool()).to.be.reverted

    }

    // Balancer pools.

    // https://etherscan.io/token/0x1373E57F764a7944bDd7A4BD5ca3007D496934DA#balances
    // balancer13uma
    await migrate({ pairAddr: "0x1373E57F764a7944bDd7A4BD5ca3007D496934DA", addrToMigrate: "0xfdc2814f4d8a76da04b4f5bed14881ecd9e47103" })
    // await migrate13uma("0xb8d5d333a078c8eccc34e7fe65909e65fafa5fdc")

    // Uniswap pools.

    let UniPairTrbEth = "0x70258Aa9830C2C84d855Df1D61E12C256F6448b4"
    // Small wallet with only TRB Uniswap tokens - less than 1 TRB(ETH is converted into TRB)..
    // https://app.zerion.io/0x974896e96219dd508100f2ad58921290655072ad
    await migrate({ pairAddr: UniPairTrbEth, addrToMigrate: "0x974896e96219dd508100f2ad58921290655072ad", poolType: "uniswap" })
    // Big wallet with only TRB Uniswap tokens - more than 2k TRB(ETH is converted into TRB)..
    // https://app.zerion.io/0xf7a9ac9abe8e38ec6c30584081de1edf51a0e9b8
    await migrate({ pairAddr: UniPairTrbEth, addrToMigrate: "0xf7a9ac9abe8e38ec6c30584081de1edf51a0e9b8", poolType: "uniswap" })
  })

  it("Constructor contract migrations", async function () {
    const oldTellorInstance = await ethers.getContractAt("openzeppelin-solidity/contracts/token/ERC20/IERC20.sol:IERC20", oldTellorContract)

    let checkMigrated = async (contractAddr) => {
      const ownedContract = await ethers.getContractAt("contracts/Interfaces.sol:Owned", contractAddr)
      const contractOwner = await ownedContract.owner()

      await checkMigratedTo(contractAddr, contractOwner)
    }

    let checkMigratedTo = async (contractAddr, contractOwner) => {
      let balanceToMigrate = Number(await oldTellorInstance.balanceOf(contractAddr))
      let migratedBalance = Number(await newTellor.balanceOf(contractOwner))
      expect(migratedBalance).to.equal(balanceToMigrate)
    }

    await checkMigrated("0x01fc3e9Bfc62ae9370694f968E33713F792C78cF")
    await checkMigratedTo("0xfDc6Fdb071A116714E1f73186339d9fA1623867F", "0xb17DB53E5519f804F48A11740793487296751236")
    await checkMigratedTo("0xDbC1b60fDd000F645B668d8026A28C26772A151c", "0x0957756646c5e808005dbF7970778c4AE5E80aEB")
    await checkMigratedTo("0x0966AEb41F4a94aAB7FB595A22CAa7b64ce73aA2", "0xD4DA002e714a7341a7d0fB1899F8260508E42653")
  })

  it("Manual contract migrations", async function () {
    const oldTellorInstance = await ethers.getContractAt("openzeppelin-solidity/contracts/token/ERC20/IERC20.sol:IERC20", oldTellorContract)

    let migrateOk = async (contractAddr) => {
      let balanceToMigrate = Number(await oldTellorInstance.balanceOf(contractAddr))

      const ownedContract = await ethers.getContractAt("contracts/Interfaces.sol:Owned", contractAddr)
      const contractOwner = await ownedContract.owner()

      await testee.migrateContractTo(contractAddr, contractOwner)

      let migratedBalance = Number(await newTellor.balanceOf(contractOwner))
      expect(migratedBalance).to.equal(balanceToMigrate)

      // Second migration should revert.
      await expect(testee.migrateContractTo(contractAddr, contractOwner)).to.be.reverted
    }

    let migrateNonAdmin = async (contractAddr) => {
      contractOwner = "0x54d13ec47eda7189983c68a67e8498f0e755c859"
      await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [contractOwner]
      })

      const walletOwner = await ethers.provider.getSigner(contractOwner)
      await expect(testee.connect(walletOwner).migrateContractTo(contractAddr, contractOwner)).to.be.reverted
    }

    let wallets = ["0x2a0c0dbecc7e4d658f48e01e3fa353f44050c208"]

    await Promise.all(wallets.map(async (contractAddr) => {
      await migrateNonAdmin(contractAddr)
      await migrateOk(contractAddr)
    }));

  })

  it("Migrate address", async function () {
    const oldTellorInstance = await ethers.getContractAt("openzeppelin-solidity/contracts/token/ERC20/IERC20.sol:IERC20", oldTellorContract)

    let migrateOk = async (addr) => {
      let balanceToMigrate = Number(await oldTellorInstance.balanceOf(addr))
      await testee.migrateAddress(addr)

      let migratedBalance = Number(await newTellor.balanceOf(addr))
      expect(migratedBalance).to.equal(balanceToMigrate)

      // Second migration should revert.
      await expect(testee.migrateAddress(addr)).to.be.reverted
    }

    let wallets = ["0x17c63868e3ab7da20adcf8c27d4ee46fdec1c325", "0xc0aa8046f860996b7b6d366b6d71391e70c74376"]

    await Promise.all(wallets.map(async (addr) => {
      await migrateOk(addr)
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

let uniBalance = async (contractInstance, addr) => {

  let userBalance = ethers.FixedNumber.from(await contractInstance.balanceOf(addr))
  let totalSupply = ethers.FixedNumber.from(await contractInstance.totalSupply())

  let poolShare = userBalance.divUnsafe(totalSupply);

  let [trbTotalBalance, ,] = await contractInstance.getReserves();
  trbTotalBalance = ethers.FixedNumber.from(trbTotalBalance)

  // The uniswap pools are always 50/50 so
  // give the addres 2 times more TRB for the lost ETH.
  return 2 * trbTotalBalance.mulUnsafe(poolShare);
}

let balBalance = async (contractInstance, addr) => {
  let userBalance = ethers.FixedNumber.from(await contractInstance.balanceOf(addr))
  let totalSupply = ethers.FixedNumber.from(await contractInstance.totalSupply())

  let poolShare = userBalance.divUnsafe(totalSupply);

  let trbTotalBalance = ethers.FixedNumber.from(await contractInstance.getBalance(oldTellorContract));
  let poolRatio = ethers.FixedNumber.from(await contractInstance.getNormalizedWeight(oldTellorContract));

  let multiplier = ethers.FixedNumber.from(BigInt(1e18)).divUnsafe(poolRatio)
  let trbAddrBalance = trbTotalBalance.mulUnsafe(poolShare)
  return multiplier.mulUnsafe(trbAddrBalance);
}
