require("@nomiclabs/hardhat-waffle");
require('hardhat-dependency-compiler');
require("@nomiclabs/hardhat-truffle5");
require("hardhat-gas-reporter");
require('hardhat-contract-sizer');
require("solidity-coverage");
require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-etherscan");
require("dotenv").config();

console.log("node", process.env.NODE_URL_RINKEBY)
//Run this commands to deploy migrator:
//npx hardhat deploy --net rinkeby --network rinkeby
//npx hardhat deploy --net  --network mainnet

task("deploy", "Deploy and verify the contracts")
  .addParam("net", "rinkeby or  mainnet")
  .setAction(async taskArgs => {


    console.log("deploy migrator")
    var net = taskArgs.net
    await run("compile");
    const Main = await ethers.getContractFactory("Main");
    const main = await Main.deploy("0x88dF592F8eb5D7Bd38bFeF7dEb0fBc02cf3778a0");
    console.log("Migrator deployed to:", main.address);
    await main.deployed();
    console.log("Migrator contract deployed to:", "https://" + net + ".etherscan.io/address/" + main.address);
    console.log("    transaction hash:", "https://" + net + ".etherscan.io/tx/" + main.deployTransaction.hash);

    // Wait for few confirmed transactions.
    // Otherwise the etherscan api doesn't find the deployed contract.
    console.log('waiting for tx confirmation...');
    await main.deployTransaction.wait(3)

    console.log('submitting migrator for etherscan verification...');

    await run("verify:verify", {
      address: main.address,
      constructorArguments: ["0x88dF592F8eb5D7Bd38bFeF7dEb0fBc02cf3778a0"],
    },
    )



  });





/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports =
{
  paths: [
    'contracts/testing/Token.sol',
  ],
  networks: {
    hardhat: {
      forking: {
        url: `${process.env.NODE_URL_MAINNET}`,
        blockNumber: 11972228,
      }
    },
    rinkeby: {
        url: "https://mainnet.infura.io/v3/63ab6bb8ae4a4eedb2a55812e0a615a0",
        accounts: [process.env.PRIVATE_KEY],
        gas: 10000000 ,
        gasPrice: 20000000000
      },
      mainnet: {
        url: `${process.env.NODE_URL_MAINNET}`,
        accounts: [process.env.PRIVATE_KEY],
        gas: 10000000 ,
        gasPrice: 8000000000
      }  
  },
  etherscan: {
      // Your API key for Etherscan
      // Obtain one at https://etherscan.io/
      apiKey: process.env.ETHERSCAN
  },
 
    contractSizer: {
      alphaSort: true,
      runOnCompile: true,
      disambiguatePaths: false,
    },




  solidity: {
    compilers: [
      {
        version: "0.7.6"
      },
      {
        version: "0.8.0",
      }
    ]
  },

};
