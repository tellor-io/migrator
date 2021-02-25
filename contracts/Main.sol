//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "./Interfaces.sol";
import "./Uniswap.sol";

contract Main {
    TRBBalancer public uniswap;
    address public immutable uniswapMigrator;

    Mintable public newTRBContract;

    constructor(address _newTRBContract) {
        newTRBContract = Mintable(_newTRBContract);
        uniswap = new Uniswap(0x70258Aa9830C2C84d855Df1D61E12C256F6448b4);
        uniswapMigrator = address(uniswap);
    }

    function migrate() external {
        uint256 balance = uniswap.trbBalanceOf(msg.sender);
        require(balance > 0, "no balance to migrate");
        require(uniswap.burn(msg.sender), "burn failed");
        newTRBContract.mint(msg.sender, balance);
    }

    function trbBalanceOfAll(address holder) external view returns (uint256) {
        uint256 totalBalance = uniswap.trbBalanceOf(holder);
        return totalBalance;
    }
}
