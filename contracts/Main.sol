//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "./Interfaces.sol";
import "./Uniswap.sol";

contract Main {
    event NewAdmin(address);
    address public admin;

    TRBBalancer public uniswap;
    //slither-disable-next-line constable-states
    address public immutable uniswapMigrator;

    Balancer public oldTellorContract;

    mapping(address => bool) public migratedContracts;

    Migrator public newTRBContract;

    constructor(address _newTRBContract) {
        admin = msg.sender;
        // Not using the hardcoded address makes testing easier
        // newTRBContract = Migrator(0x88dF592F8eb5D7Bd38bFeF7dEb0fBc02cf3778a0);
        newTRBContract = Migrator(_newTRBContract);

        oldTellorContract = Balancer(
            0x0Ba45A8b5d5575935B8158a88C631E9F9C95a2e5
        );

        uniswap = new Uniswap(0x70258Aa9830C2C84d855Df1D61E12C256F6448b4); // The uniswap TRB/ETH pool
        uniswapMigrator = address(uniswap);

        // Migrate some during the initialization.

        // The contract owner is public, so the address was taken driectly from there
        _migrateContractTo(
            0x01fc3e9Bfc62ae9370694f968E33713F792C78cF,
            0xA4b85427D108d28D385bed1c1c8F27384F62EBD8
        );

        // Owner confirmed through this transaction.
        // https://etherscan.io/tx/0x99c88123cfe60fe9b0f2aee79ad300eca6e5ce3d628b728d624935ab869e7050
        _migrateContractTo(
            0xfDc6Fdb071A116714E1f73186339d9fA1623867F,
            0xb17DB53E5519f804F48A11740793487296751236
        );
        // Owner confirmed through this transaction.
        // https://etherscan.io/tx/0x17c22fc7fb568ac3591343e5b766bec0fb21d3dea24d7c72e1fb91624cfcc02e
        _migrateContractTo(
            0xDbC1b60fDd000F645B668d8026A28C26772A151c,
            0x0957756646c5e808005dbF7970778c4AE5E80aEB
        );

        // Owner confirmed through this transaction.
        // https://etherscan.io/tx/0xd9c013cc43f95974726b42408dbdb998919262a9f862adaeb60b76cb3c25677f
        _migrateContractTo(
            0x0966AEb41F4a94aAB7FB595A22CAa7b64ce73aA2,
            0xD4DA002e714a7341a7d0fB1899F8260508E42653
        );
    }

    //slither-disable-next-line unimplemented-functions
    function migrateUniswap() external {
        uint256 balance = uniswap.trbBalanceOf(msg.sender);
        require(balance > 0, "no balance to migrate");
        require(uniswap.burn(msg.sender), "burn failed");
        newTRBContract.migrateAddress(msg.sender, balance);
    }

    //slither-disable-next-line unimplemented-functions
    function migrateContractTo(address _contract, address _owner)
        public
        onlyAdmin
    {
        _migrateContractTo(_contract, _owner);
    }

    function migrateContractToBatch(
        address[] calldata _contracts,
        address[] calldata _owners
    ) public onlyAdmin {
        require(
            _contracts.length == _owners.length,
            "mismatching array inputs"
        );
        for (uint256 index = 0; index < _owners.length; index++) {
            _migrateContractTo(_contracts[index], _owners[index]);
        }
    }

    function _migrateContractTo(address _contract, address _owner) internal {
        require(!migratedContracts[_contract], "contract already migrated");
        uint256 balance = oldTellorContract.balanceOf(_contract);
        require(balance > 0, "no balance to migrate");

        // Tellor also keeps track of migrated contracts
        migratedContracts[_contract] = true;
        newTRBContract.migrateContract(_contract, _owner, balance);
    }

    function migrateAddress(address _owner) public onlyAdmin {
        _migrateAddress(_owner);
    }

    function migrateAddressBatch(address[] calldata _owners) public onlyAdmin {
        for (uint256 index = 0; index < _owners.length; index++) {
            _migrateAddress(_owners[index]);
        }
    }


    function migrateAddressCustom(address _owner,uint _amount) public onlyAdmin {
        require(_amount> 0, "no balance to migrate");
        // Tellor also keeps track of migrated contracts
        newTRBContract.migrateAddress(_owner, _amount);
    }

    function migrateAddressBatchCustom(address[] calldata _owners, uint[] calldata _amounts) public onlyAdmin {
        require(_owners.length == _amounts.length);
        for (uint256 index = 0; index < _owners.length; index++) {
            migrateAddressCustom(_owners[index], _amounts[index]);
        }
    }

    function _migrateAddress(address _owner) internal {
        require(!migratedContracts[_owner], "contract already migrated");
        uint256 balance = oldTellorContract.balanceOf(_owner);
        require(balance > 0, "no balance to migrate");

        // Tellor also keeps track of migrated contracts
        migratedContracts[_owner] = true;
        newTRBContract.migrateAddress(_owner, balance);
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

    function setAdmin(address _admin) external onlyAdmin {
        require(
            _admin != address(0),
            "shouldn't set admin to the zero address"
        );
        admin = _admin;
        emit NewAdmin(_admin);
    }

    function rescueToken(address _token) external onlyAdmin {
        require(_token != address(newTRBContract), "not allowed to rescue");
        // Using IUniswappair because it already contains the transfer interface
        uint256 balance = IUniswapV2Pair(_token).balanceOf(address(this));
        require(
            IUniswapV2Pair(_token).transfer(admin, balance),
            "token transfer failed"
        );
    }
}
