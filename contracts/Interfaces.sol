//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";

interface TRBBalancer {
    function trbBalanceOf(address holder) external view returns (uint256);

    function burn(address holder) external returns (bool);
}

interface Migrator {
    function migrateContract(
        address _origin,
        address _destination,
        uint256 _amount
    ) external;

    function migrateAddress(address _destination, uint256 _amount) external;
}

interface Owned {
    function owner() external view returns (address);
}

interface IUniswapV2Pair is IERC20 {
    function getReserves()
        external
        view
        returns (
            uint112 reserve0,
            uint112 reserve1,
            uint32 blockTimestampLast
        );
}

interface BPoolPair is IERC20 {
    function getBalance(address token) external view returns (uint256);

    function getNormalizedWeight(address token) external view returns (uint256);
}
