// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../Interfaces.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";

contract MockUni is ERC20, IUniswapV2Pair {
    mapping(address => bool) public migrated;
    uint112 public reserve0;
    uint112 public reserve1;

    function burn(address account, uint256 amount) external {
        _burn(account, amount);
    }

    function mint(address account, uint256 amount) external {
        _mint(account, amount);
    }

    function setReserves(uint112 _reserve0, uint112 _reserve1) external {
        reserve0 = _reserve0;
        reserve1 = _reserve1;
    }

    function getReserves()
        external
        view
        returns (
            uint112 _reserve0,
            uint112 _reserve1,
            uint32 blockTimestampLast
        )
    {
        _reserve0 = reserve0;
        _reserve1 = reserve1;
        blockTimestampLast = uint32(block.timestamp);
    }

    // solhint-disable-next-line no-empty-blocks
    constructor(string memory n, string memory s) ERC20(n, s) {}
}
