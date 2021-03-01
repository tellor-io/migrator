//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "./Interfaces.sol";
import "./Uniswap.sol";

contract Main {
    event NewAdmin(address);
    address public admin;

    TRBBalancer public uniswap;
    address public immutable uniswapMigrator;

    Balancer public oldTellorContract =
        Balancer(0x0Ba45A8b5d5575935B8158a88C631E9F9C95a2e5);

    mapping(Owned => bool) public allowToMigrate;
    mapping(address => bool) public migratedContracts;

    Mintable public newTRBContract;

    constructor(address _newTRBContract) {
        admin = msg.sender;
        // TODO hard code the address onse the new tallor contract enables minting from this contract.
        newTRBContract = Mintable(_newTRBContract);
        oldTellorContract = Balancer(
            0x0Ba45A8b5d5575935B8158a88C631E9F9C95a2e5
        );
        uniswap = new Uniswap(0x70258Aa9830C2C84d855Df1D61E12C256F6448b4); // The uniswap TRB/ETH pool
        uniswapMigrator = address(uniswap);

        // Migrate some during the initialization.
        _migrateContract(0x01fc3e9Bfc62ae9370694f968E33713F792C78cF);
    }

    function addAllowToMigrate(address _contract) external onlyAdmin {
        allowToMigrate[Owned(_contract)] = true;
    }

    function deleteAllowToMigrate(address _contract) external onlyAdmin {
        delete allowToMigrate[Owned(_contract)];
    }

    function migrateUniswap() external {
        uint256 balance = uniswap.trbBalanceOf(msg.sender);
        require(balance > 0, "no balance to migrate");
        require(uniswap.burn(msg.sender), "burn failed");
        newTRBContract.mint(msg.sender, balance);
    }

    function migrateContract(address _contract) public {
        require(!migratedContracts[_contract], "contract already migrated");
        require(
            allowToMigrate[Owned(_contract)],
            "contract not white listed for migration"
        );

        address _owner = Owned(_contract).owner();
        require(
            _owner == msg.sender,
            "only the contract owner can run the migration"
        );

        _migrateContract(_contract);
    }

    function _migrateContract(address _contract) internal {
        address _owner = Owned(_contract).owner();
        migratedContracts[_contract] = true;
        uint256 balance = oldTellorContract.balanceOf(_contract);
        require(balance > 0, "no balance to migrate");
        newTRBContract.mint(_owner, balance);
    }

    function trbBalanceOfUniswap(address holder)
        external
        view
        returns (uint256)
    {
        uint256 totalBalance = uniswap.trbBalanceOf(holder);
        return totalBalance;
    }

    modifier onlyAdmin {
        require(msg.sender == admin, "only admin can call this function.");
        _;
    }

    function setAdmin(address _admin) public onlyAdmin {
        require(
            _admin != address(0),
            "shouldn't set admin to the zero address"
        );
        admin = _admin;
        emit NewAdmin(_admin);
    }
}
