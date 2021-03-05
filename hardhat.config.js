require("@nomiclabs/hardhat-waffle");
require("dotenv").config();
require('hardhat-dependency-compiler');

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
        blockNumber: 11980000,
      }
    }
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
