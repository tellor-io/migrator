//SPDX-License-Identifier: Unlicense
pragma solidity ^0.7.6;

import "hardhat/console.sol";

import "./Interfaces.sol";
import "./Math.sol";

// Contract Uniswap implements the balancer interface and
// returns a user balancer in TRB.
contract Uniswap is DSMath, TRBBalancer {
    event NewAdmin(address);
    event NewTRBPrice(uint256);

    IUniswapV2Pair public pair;

    // This many TRBs equal 1ETH.
    uint256 public trbPrice;
    address public admin;

    modifier onlyAdmin {
        require(msg.sender == admin, "only admin can call this function.");
        _;
    }

    constructor(address _pair, uint256 _trbPrice) {
        admin = msg.sender;
        pair = IUniswapV2Pair(_pair);
        trbPrice = _trbPrice;
    }

    function setAdmin(address _admin) public onlyAdmin {
        require(_admin != address(0), "admin can't be the zero address");
        admin = _admin;
        emit NewAdmin(admin);
    }

    function setTrbPrice(uint256 _trbPrice) public onlyAdmin {
        trbPrice = _trbPrice;
        emit NewTRBPrice(_trbPrice);
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

        (uint256 t1Reserve, uint256 t2Reserve, ) = pair.getReserves();

        uint256 t1Balance = wmul(t1Reserve, poolShare);
        uint256 t2Balance = wmul(t2Reserve, poolShare);

        uint256 t1TotalBalance = add(t1Balance, wmul(t2Balance, trbPrice));

        return t1TotalBalance;
    }
}
