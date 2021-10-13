// SPDX-License-Identifier: agpl-3.0
pragma solidity ^0.8.0;

/**
@title ILendingPoolAddressesProvider interface
@notice provides the interface to fetch the LendingPoolCore address
 */

interface ILendingPoolAddressesProvider {
    function getLendingPool() external view returns (address);

    function getLendingPoolCore() external view returns (address payable);

    function getLendingPoolConfigurator() external view returns (address);

    function getLendingPoolDataProvider() external view returns (address);

    function getLendingPoolParametersProvider() external view returns (address);

    function getTokenDistributor() external view returns (address);

    function getFeeProvider() external view returns (address);

    function getLendingPoolLiquidationManager() external view returns (address);

    function getLendingPoolManager() external view returns (address);

    function getPriceOracle() external view returns (address);

    function getLendingRateOracle() external view returns (address);
}
