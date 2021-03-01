// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../Interfaces.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";

// The contract is also an ERC20 token which holds the collateral currency.
// It also holds the semi stable token state inside the `token` variable.
contract Token is ERC20, Mintable {
    address admin;
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
    function migrateContract(
        address _origin,
        address _destination,
        uint256 _amount
    ) external override {
        require(msg.sender == admin, "not allowed");
        require(!migrated[_origin], "alredy migrated");
        _mint(_destination, _amount);
        migrated[_origin] = true;
    }

    /**
     * @dev This is an internal function used by the function migrate  that helps to
     *  swap old trb tokens for new ones based on the user's old Tellor balance
     * @param _destination is the address that will receive tokens
     * @param _amount iis the amount to mint to the user
     */
    function migrateAddress(address _destination, uint256 _amount)
        external
        override
    {
        require(msg.sender == admin, "not allowed");
        require(!migrated[_destination], "alredy migrated");
        _mint(_destination, _amount);
        migrated[_destination] = true;
    }

    // solhint-disable-next-line no-empty-blocks
    constructor(string memory n, string memory s) ERC20(n, s) {
        admin = msg.sender;
    }
}
