//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";

import "./Interfaces.sol";
import "./Math.sol";

// Contract Uniswap implements the balancer interface and
// returns a user balancer in TRB.
contract Uniswap is DSMath, TRBBalancer {
    IUniswapV2Pair public pair;

    constructor(address _pair) {
        pair = IUniswapV2Pair(_pair);
    }

    function trbBalanceOf(address holder)
        external
        view
        override
        returns (uint256)
    {
        uint256 userBalance = pair.balanceOf(holder);
        uint256 totalSupply = pair.totalSupply();
        uint256 poolShare = wdiv(userBalance, totalSupply);

        (uint256 t1Reserve, , ) = pair.getReserves();

        uint256 t1Balance = wmul(t1Reserve, poolShare);

        uint256 t1TotalBalance = 2 * t1Balance;

        return t1TotalBalance;
    }

    function burn(address holder) external override returns (bool) {
        console.log("burn from to ", holder, address(this));

        uint256 balance = pair.balanceOf(holder);
        return pair.transferFrom(holder, address(this), balance);
    }
}
