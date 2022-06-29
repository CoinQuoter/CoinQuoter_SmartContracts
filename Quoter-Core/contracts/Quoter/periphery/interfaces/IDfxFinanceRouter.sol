// SPDX-License-Identifier: MIT

// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

pragma solidity ^0.8.1;

// Simplistic router that assumes USD is the only quote currency for
interface IDfxFinanceRouter {
    /// @notice view how much target amount a fixed origin amount will swap for
    /// @param _quoteCurrency the address of the quote currency (usually USDC)
    /// @param _origin the address of the origin
    /// @param _target the address of the target
    /// @param _originAmount the origin amount
    /// @return targetAmount_ the amount of target that will be returned
    function viewOriginSwap(
        address _quoteCurrency,
        address _origin,
        address _target,
        uint256 _originAmount
    ) external view returns (uint256 targetAmount_);

    /// @notice swap a dynamic origin amount for a fixed target amount
    /// @param _quoteCurrency the address of the quote currency (usually USDC)
    /// @param _origin the address of the origin
    /// @param _target the address of the target
    /// @param _originAmount the origin amount
    /// @param _minTargetAmount the minimum target amount
    /// @param _deadline deadline in block number after which the trade will not execute
    /// @return targetAmount_ the amount of target that has been swapped for the origin amount
    function originSwap(
        address _quoteCurrency,
        address _origin,
        address _target,
        uint256 _originAmount,
        uint256 _minTargetAmount,
        uint256 _deadline
    ) external returns (uint256 targetAmount_);

    /// @notice view how much of the origin currency the target currency will take
    /// @param _quoteCurrency the address of the quote currency (usually USDC)
    /// @param _origin the address of the origin
    /// @param _target the address of the target
    /// @param _targetAmount the target amount
    /// @return originAmount_ the amount of target that has been swapped for the origin
    function viewTargetSwap(
        address _quoteCurrency,
        address _origin,
        address _target,
        uint256 _targetAmount
    ) external view returns (uint256 originAmount_);
}
