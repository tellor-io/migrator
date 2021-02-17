//SPDX-License-Identifier: Unlicense
pragma solidity ^0.7.6;

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./Interfaces.sol";

contract Main {
    event NewAdmin(address);

    address public admin;

    modifier onlyAdmin {
        require(msg.sender == admin, "only admin can call this function.");
        _;
    }

    function migrated(address holder, address protocol)
        public
        view
        returns (bool)
    {
        return migrDone[holder][protocol];
    }

    Mintable public newTRBContract;

    // Address of the token owners mapped to the address of the migrator.
    // This is needed because the current TRB token can't be transfered to decrement the balances.
    // This mapping tracks completed migrations and ensured that
    // the owner doesn't migrate the same amount multiple times.
    // mapping is tokenOwner => protocol;
    mapping(address => mapping(address => bool)) public migrDone;
    mapping(address => uint256) public migrAmount;

    // trbBalancers return the balance in TRB of a token owner.
    // Each balancer in the list is a separate implementation for a given protocol - Uniswap, Balancer etc.
    // The most simple implementation is the old TRB token contract which
    // just returns the TRB balancer of a given address.
    // Uniswap, Balancer or any other protocol that don't expose the TRB token balance directly
    // will need special calculations.
    TRBBalancer[] public balancers;

    constructor(address _newTRBContract) {
        admin = msg.sender;
        newTRBContract = Mintable(_newTRBContract);
    }

    function migratedBalance() external view returns (uint256) {
        return migrAmount[msg.sender];
    }

    function migrate() external {
        require(balancers.length > 0, "no registered balancers");

        uint256 totalBalance = 0;
        for (uint256 index = 0; index < balancers.length; index++) {
            address contractAddr = address(balancers[index]);

            if (!migrated(msg.sender, contractAddr)) {
                migrDone[msg.sender][contractAddr] = true;
                // slither-disable-next-line calls-loop
                totalBalance += balancers[index].trbBalanceOf(msg.sender);
            }
        }

        console.log("migrating", totalBalance, msg.sender);

        require(totalBalance > 0, "no balance to transfer");

        migrAmount[msg.sender] = totalBalance;

        newTRBContract.mint(msg.sender, totalBalance);
    }

    function setAdmin(address _admin) public onlyAdmin {
        require(
            _admin != address(0),
            "shouldn't set admin to the zero address"
        );
        admin = _admin;
        emit NewAdmin(_admin);
    }

    function addBalancer(address _balancer) public onlyAdmin {
        balancers.push(TRBBalancer(_balancer));
    }

    function updateBalancer(uint256 index, address _balancer) public onlyAdmin {
        balancers[index] = (TRBBalancer(_balancer));
    }

    function replaceBalancer(address[] memory _balancers) external onlyAdmin {
        delete balancers;
        for (uint256 i = 0; i < _balancers.length; i++) {
            // slither-disable-next-line controlled-array-length
            balancers.push(TRBBalancer(_balancers[i]));
        }
    }

    function trbBalanceOfAll(address holder) external view returns (uint256) {
        uint256 totalBalance = 0;
        for (uint256 index = 0; index < balancers.length; index++) {
            // slither-disable-next-line calls-loop
            totalBalance += balancers[index].trbBalanceOf(holder);
        }
        return totalBalance;
    }
}
