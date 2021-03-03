// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../Interfaces.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";

// The contract is also an ERC20 token which holds the collateral currency.
// It also holds the semi stable token state inside the `token` variable.
contract Token is ERC20, Migrator {
    mapping(address => bool) public migrated;

    function burn(address account, uint256 amount) external {
        _burn(account, amount);
    }

    /**
     * @dev This is an internal function used by the function migrate  that helps to
     *  swap old trb tokens for new ones based on the user's old Tellor balance
     * @param _origin is the address of the user to migrate the balance from
     * @param _destination is the address that will receive tokens
     * @param _amount iis the amount to mint to the user
     */
    function migrateFrom(
        address _origin,
        address _destination,
        uint256 _amount
    ) external override {
        require(!migrated[_origin], "alredy migrated");
        _mint(_destination, _amount);
        migrated[_origin] = true;
    }

    function migrateFromBatch(
        address[] calldata _origins,
        address[] calldata _destinations,
        uint256[] calldata _amounts
    ) external override {
        for (uint256 index = 0; index < _amounts.length; index++) {
            require(!migrated[_origins[index]], "alredy migrated");
            _mint(_destinations[index], _amounts[index]);
            migrated[_origins[index]] = true;
        }
    }

    /**
     * @dev This is an internal function used by the function migrate  that helps to
     *  swap old trb tokens for new ones based on the user's old Tellor balance
     * @param _destination is the address that will receive tokens
     * @param _amount iis the amount to mint to the user
     */
    function migrateFor(address _destination, uint256 _amount)
        external
        override
    {
        require(!migrated[_destination], "alredy migrated");
        _mint(_destination, _amount);
        migrated[_destination] = true;
    }

    function migrateForBatch(
        address[] calldata _destinations,
        uint256[] calldata _amounts
    ) external override {
        for (uint256 index = 0; index < _destinations.length; index++) {
            require(!migrated[_destinations[index]], "alredy migrated");
            _mint(_destinations[index], _amounts[index]);
            migrated[_destinations[index]] = true;
        }
    }

    // solhint-disable-next-line no-empty-blocks
    constructor(string memory n, string memory s) ERC20(n, s) {}
}
