require("@nomiclabs/hardhat-waffle");
require("dotenv").config();


/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports =
{
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
