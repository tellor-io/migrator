//SPDX-License-Identifier: Unlicense
pragma solidity ^0.7.6;

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./Interfaces.sol";

contract Main is TRBBalancer {
    event NewAdmin(address);

    address public admin;

    modifier onlyAdmin {
        require(msg.sender == admin, "only admin can call this function.");
        _;
    }

    modifier migrateNotDone() {
        require(
            migrDone[msg.sender] == address(0),
            "migration for this contract and token owner already done"
        );
        _;
    }

    Mintable public newTRBContract;
    ERC20 public oldTRBContract;

    // Address of the token owners mapped to the address of the migrator.
    // This is needed because the current TRB token can't be transfered to decrement the balances.
    // This mapping tracks completed migrations and ensured that
    // the owner doesn't migrate the same amount multiple times.
    mapping(address => address) public migrDone;
    mapping(address => uint256) public migrAmount;

    // trbBalancers return the balance in TRB of a token owner.
    // Each balancer in the list is a separate implementation for a given protocol - Uniswap, Balancer etc.
    // The most simple implementation is the old TRB token contract which
    // just returns the TRB balancer of a given address.
    // Uniswap, Balancer or any other protocol that don't expose the TRB token balance directly
    // will need special calculations.
    TRBBalancer[] public balancers;

    constructor(address _newTRBContract, address _oldTRBContract) {
        admin = msg.sender;
        newTRBContract = Mintable(_newTRBContract);
        oldTRBContract = ERC20(_oldTRBContract);

        // Register this contract itself as a balancer.
        // It returns the balances from the old Tellor contract.
        // slither-disable-next-line controlled-array-length
        balancers.push(TRBBalancer(address(this)));
    }

    function migratedBalance()
        external
        view
        migrateNotDone()
        returns (uint256)
    {
        return migrAmount[msg.sender];
    }

    // slither-disable-next-line calls-loop missing-zero-check controlled-array-length
    function migrate() external migrateNotDone() {
        require(balancers.length > 0, "no registered balancers");

        uint256 totalBalance = 0;
        for (uint256 index = 0; index < balancers.length; index++) {
            migrDone[msg.sender] = address(balancers[index]);
            totalBalance += balancers[index].trbBalance();
        }
        require(totalBalance > 0, "no balance to transfer");

        migrAmount[msg.sender] = totalBalance;

        newTRBContract.mint(msg.sender, totalBalance);
    }

    //slither-disable-next-line missing-zero-check
    function setAdmin(address _admin) public onlyAdmin {
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

    function trbBalance() external view override returns (uint256) {
        console.log("oldTRBContract", address(oldTRBContract));
        console.log("msg.sender", msg.sender);

        return oldTRBContract.balanceOf(msg.sender);
    }
}
