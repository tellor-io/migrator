require("@nomiclabs/hardhat-waffle");
require("dotenv").config();
require('hardhat-dependency-compiler');

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports =
{
  paths: [
    'contracts/testing/Mintable.sol',
  ],
  networks: {
    hardhat: {
      forking: {
        url: `${process.env.NODE_URL_MAINNET}`,
        blockNumber: 11868228,
      }
    }
  },
  solidity: "0.7.6",
};
