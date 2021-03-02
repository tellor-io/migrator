//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "./Interfaces.sol";
import "./Uniswap.sol";
import "./BPool.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";

contract Main {
    event NewAdmin(address);
    address public admin;

    // The Uniswap pool.
    mapping(address => TRBBalancer) public pools;

    ERC20 public oldTellorContract;

    address public constant BURN_BENEFICIARY =
        0x39E419bA25196794B595B2a595Ea8E527ddC9856;

    mapping(address => bool) public migratedContracts;

    Mintable public newTRBContract;

    constructor(address _newTRBContract) {
        admin = msg.sender;
        // TODO hard code the address onse the new tallor contract enables minting from this contract.
        newTRBContract = Mintable(_newTRBContract);

        oldTellorContract = ERC20(0x0Ba45A8b5d5575935B8158a88C631E9F9C95a2e5);

        _addExchangePools();
        _migrateCustomContracts();
    }

    function _migrateCustomContracts() internal {
        // The contract owner is public so funds will be sent firectly to its address.
        migrateContract(0x01fc3e9Bfc62ae9370694f968E33713F792C78cF);

        // Owner confirmed through this transaction.
        // https://etherscan.io/tx/0x99c88123cfe60fe9b0f2aee79ad300eca6e5ce3d628b728d624935ab869e7050
        migrateContractTo(
            0xfDc6Fdb071A116714E1f73186339d9fA1623867F,
            0xb17DB53E5519f804F48A11740793487296751236
        );
        // Owner confirmed through this transaction.
        // https://etherscan.io/tx/0x17c22fc7fb568ac3591343e5b766bec0fb21d3dea24d7c72e1fb91624cfcc02e
        migrateContractTo(
            0xDbC1b60fDd000F645B668d8026A28C26772A151c,
            0x0957756646c5e808005dbF7970778c4AE5E80aEB
        );

        // Owner confirmed through this transaction.
        // https://etherscan.io/tx/0xd9c013cc43f95974726b42408dbdb998919262a9f862adaeb60b76cb3c25677f
        migrateContractTo(
            0x0966AEb41F4a94aAB7FB595A22CAa7b64ce73aA2,
            0xD4DA002e714a7341a7d0fB1899F8260508E42653
        );

        // Owner is public.
        // https://etherscan.io/address/0x0C9411796D09f6Fe48B28D2271CB9D609AD951B3#readContract
        migrateContractTo(
            0x0C9411796D09f6Fe48B28D2271CB9D609AD951B3,
            0xc9FaF6828f1CeAFa38aC67DfC88633229097bD24
        );

        // Owner is public.
        // https://etherscan.io/address/0xBCED67c5538Cd284410CC340954167A84449a25E#readContract
        migrateContractTo(
            0xBCED67c5538Cd284410CC340954167A84449a25E,
            0x72E2a092761645A9c810983aCD7D09063f64d9A0
        );

        // Owner is public.
        // https://etherscan.io/address/0xD08bE82eAf2f56D3aDA11E7862D12bcd9f263b29#readContract
        migrateContractTo(
            0xD08bE82eAf2f56D3aDA11E7862D12bcd9f263b29,
            0x90b2Fc98071A731E36a2b5936343962bcC117d13
        );

        // Owner is public.
        // https://etherscan.io/address/0x0e5330ef9347a6F7ecc06125a60b4c765041D7c3#readContract
        migrateContractTo(
            0x0e5330ef9347a6F7ecc06125a60b4c765041D7c3,
            0x547f2f56396A5c9B6B31E8F58212996A4436b957
        );

        // Owner is public.
        // https://etherscan.io/address/0x6aC26C7842be0126A9985F10030dcE3B8f2522F3#readContract
        migrateContractTo(
            0x6aC26C7842be0126A9985F10030dcE3B8f2522F3,
            0xDd34668b70D0c8b907d9955dA5Ec6A369A8eC3Bc
        );
    }

    function _addExchangePools() internal {
        pools[0x70258Aa9830C2C84d855Df1D61E12C256F6448b4] = new Uniswap(
            0x70258Aa9830C2C84d855Df1D61E12C256F6448b4,
            BURN_BENEFICIARY
        );

        // The Balancer pools.
        // https://pools.balancer.exchange/#/explore?token=0x0Ba45A8b5d5575935B8158a88C631E9F9C95a2e5

        // https://pools.balancer.exchange/#/pool/0x1373E57F764a7944bDd7A4BD5ca3007D496934DA/
        pools[0x1373E57F764a7944bDd7A4BD5ca3007D496934DA] = new BPool(
            0x1373E57F764a7944bDd7A4BD5ca3007D496934DA,
            BURN_BENEFICIARY
        );

        // https://pools.balancer.exchange/#/pool/0x74a5D106b18c86dC37be5c817093a873CdcFF216/
        pools[0x74a5D106b18c86dC37be5c817093a873CdcFF216] = new BPool(
            0x74a5D106b18c86dC37be5c817093a873CdcFF216,
            BURN_BENEFICIARY
        );

        // https://pools.balancer.exchange/#/pool/0xa1Ec308F05bca8ACc84eAf76Bc9C92A52ac25415/
        pools[0xa1Ec308F05bca8ACc84eAf76Bc9C92A52ac25415] = new BPool(
            0xa1Ec308F05bca8ACc84eAf76Bc9C92A52ac25415,
            BURN_BENEFICIARY
        );

        // https://pools.balancer.exchange/#/pool/0xa74485e5f668Bba37b5C044c386B363f4cBd7c8c/
        pools[0xa74485e5f668Bba37b5C044c386B363f4cBd7c8c] = new BPool(
            0xa74485e5f668Bba37b5C044c386B363f4cBd7c8c,
            BURN_BENEFICIARY
        );

        // https://pools.balancer.exchange/#/pool/0x838d504010d83a343Db2462256180cA311d29d90/
        pools[0x838d504010d83a343Db2462256180cA311d29d90] = new BPool(
            0x838d504010d83a343Db2462256180cA311d29d90,
            BURN_BENEFICIARY
        );

        // https://pools.balancer.exchange/#/pool/0x9c5EF1D941EAefF8774128a8b2C58Fce2C2BC7fA/
        pools[0x9c5EF1D941EAefF8774128a8b2C58Fce2C2BC7fA] = new BPool(
            0x9c5EF1D941EAefF8774128a8b2C58Fce2C2BC7fA,
            BURN_BENEFICIARY
        );

        // https://pools.balancer.exchange/#/pool/0x07B18C2686F3d1BA0Fa8C51edc856819f2b1100A/
        pools[0x07B18C2686F3d1BA0Fa8C51edc856819f2b1100A] = new BPool(
            0x07B18C2686F3d1BA0Fa8C51edc856819f2b1100A,
            BURN_BENEFICIARY
        );
    }

    //slither-disable-next-line unimplemented-functions
    function migratePool(address poolAddr) external {
        uint256 balance = pools[poolAddr].trbBalanceOf(msg.sender);
        require(balance > 0, "no balance to migrate");
        require(pools[poolAddr].burn(msg.sender), "burn failed");
        newTRBContract.mint(msg.sender, balance);
    }

    //slither-disable-next-line unimplemented-functions
    function getPool(address poolAddr) external view returns (address) {
        return address(pools[poolAddr]);
    }

    // Helper function for contracts with public admin to
    // send the funds directly to its address.
    //slither-disable-next-line unimplemented-functions
    function migrateContract(address _contract) public onlyAdmin {
        address _owner = Owned(_contract).owner();
        migrateContractTo(_contract, _owner);
    }

    //slither-disable-next-line unimplemented-functions
    function migrateContractTo(address _contract, address _owner)
        public
        onlyAdmin
    {
        require(!migratedContracts[_contract], "contract already migrated");
        uint256 balance = oldTellorContract.balanceOf(_contract);
        require(balance > 0, "no balance to migrate");

        migratedContracts[_contract] = true;
        newTRBContract.mint(_owner, balance);
    }

    function trbBalanceOf(address poolAddr, address holder)
        external
        view
        returns (uint256)
    {
        uint256 totalBalance = pools[poolAddr].trbBalanceOf(holder);
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
