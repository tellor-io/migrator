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
        url: "https://eth-mainnet.alchemyapi.io/v2/8kM9qsdbiYxMeL5TDZxXL0gZcmxFOHHY",
        blockNumber: 11972228,
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
