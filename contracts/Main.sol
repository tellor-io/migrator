//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "./Interfaces.sol";
import "./Uniswap.sol";

contract Main {
    event NewAdmin(address);

    address public admin;

    TRBBalancer public uniswap;

    modifier onlyAdmin {
        require(msg.sender == admin, "only admin can call this function.");
        _;
    }

    Mintable public newTRBContract;

    constructor(address _newTRBContract) {
        admin = msg.sender;
        newTRBContract = Mintable(_newTRBContract);
        uniswap = new Uniswap(0x70258Aa9830C2C84d855Df1D61E12C256F6448b4);
    }

    function migrate() external {
        uint256 balance = uniswap.trbBalanceOf(msg.sender);
        require(balance > 0, "no balance to migrate");
        require(uniswap.burn(msg.sender), "burn failed");
        newTRBContract.mint(msg.sender, balance);
    }

    function setAdmin(address _admin) public onlyAdmin {
        require(
            _admin != address(0),
            "shouldn't set admin to the zero address"
        );
        admin = _admin;
        emit NewAdmin(_admin);
    }

    function trbBalanceOfAll(address holder) external view returns (uint256) {
        console.log("holder", holder);

        uint256 totalBalance = uniswap.trbBalanceOf(holder);
        return totalBalance;
    }
}
