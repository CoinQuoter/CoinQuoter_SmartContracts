// Sources flattened with hardhat v2.8.4 https://hardhat.org

// File @openzeppelin/contracts/interfaces/IERC1271.sol@v4.5.0

// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts v4.4.1 (interfaces/IERC1271.sol)

pragma solidity ^0.8.0;

/**
 * @dev Interface of the ERC1271 standard signature validation method for
 * contracts as defined in https://eips.ethereum.org/EIPS/eip-1271[ERC-1271].
 *
 * _Available since v4.1._
 */
interface IERC1271 {
    /**
     * @dev Should return whether the signature provided is valid for the provided data
     * @param hash      Hash of the data to be signed
     * @param signature Signature byte array associated with _data
     */
    function isValidSignature(bytes32 hash, bytes memory signature) external view returns (bytes4 magicValue);
}


// File @openzeppelin/contracts/utils/math/SafeMath.sol@v4.5.0

// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts v4.4.1 (utils/math/SafeMath.sol)

pragma solidity ^0.8.0;

// CAUTION
// This version of SafeMath should only be used with Solidity 0.8 or later,
// because it relies on the compiler's built in overflow checks.

/**
 * @dev Wrappers over Solidity's arithmetic operations.
 *
 * NOTE: `SafeMath` is generally not needed starting with Solidity 0.8, since the compiler
 * now has built in overflow checking.
 */
library SafeMath {
    /**
     * @dev Returns the addition of two unsigned integers, with an overflow flag.
     *
     * _Available since v3.4._
     */
    function tryAdd(uint256 a, uint256 b) internal pure returns (bool, uint256) {
        unchecked {
            uint256 c = a + b;
            if (c < a) return (false, 0);
            return (true, c);
        }
    }

    /**
     * @dev Returns the substraction of two unsigned integers, with an overflow flag.
     *
     * _Available since v3.4._
     */
    function trySub(uint256 a, uint256 b) internal pure returns (bool, uint256) {
        unchecked {
            if (b > a) return (false, 0);
            return (true, a - b);
        }
    }

    /**
     * @dev Returns the multiplication of two unsigned integers, with an overflow flag.
     *
     * _Available since v3.4._
     */
    function tryMul(uint256 a, uint256 b) internal pure returns (bool, uint256) {
        unchecked {
            // Gas optimization: this is cheaper than requiring 'a' not being zero, but the
            // benefit is lost if 'b' is also tested.
            // See: https://github.com/OpenZeppelin/openzeppelin-contracts/pull/522
            if (a == 0) return (true, 0);
            uint256 c = a * b;
            if (c / a != b) return (false, 0);
            return (true, c);
        }
    }

    /**
     * @dev Returns the division of two unsigned integers, with a division by zero flag.
     *
     * _Available since v3.4._
     */
    function tryDiv(uint256 a, uint256 b) internal pure returns (bool, uint256) {
        unchecked {
            if (b == 0) return (false, 0);
            return (true, a / b);
        }
    }

    /**
     * @dev Returns the remainder of dividing two unsigned integers, with a division by zero flag.
     *
     * _Available since v3.4._
     */
    function tryMod(uint256 a, uint256 b) internal pure returns (bool, uint256) {
        unchecked {
            if (b == 0) return (false, 0);
            return (true, a % b);
        }
    }

    /**
     * @dev Returns the addition of two unsigned integers, reverting on
     * overflow.
     *
     * Counterpart to Solidity's `+` operator.
     *
     * Requirements:
     *
     * - Addition cannot overflow.
     */
    function add(uint256 a, uint256 b) internal pure returns (uint256) {
        return a + b;
    }

    /**
     * @dev Returns the subtraction of two unsigned integers, reverting on
     * overflow (when the result is negative).
     *
     * Counterpart to Solidity's `-` operator.
     *
     * Requirements:
     *
     * - Subtraction cannot overflow.
     */
    function sub(uint256 a, uint256 b) internal pure returns (uint256) {
        return a - b;
    }

    /**
     * @dev Returns the multiplication of two unsigned integers, reverting on
     * overflow.
     *
     * Counterpart to Solidity's `*` operator.
     *
     * Requirements:
     *
     * - Multiplication cannot overflow.
     */
    function mul(uint256 a, uint256 b) internal pure returns (uint256) {
        return a * b;
    }

    /**
     * @dev Returns the integer division of two unsigned integers, reverting on
     * division by zero. The result is rounded towards zero.
     *
     * Counterpart to Solidity's `/` operator.
     *
     * Requirements:
     *
     * - The divisor cannot be zero.
     */
    function div(uint256 a, uint256 b) internal pure returns (uint256) {
        return a / b;
    }

    /**
     * @dev Returns the remainder of dividing two unsigned integers. (unsigned integer modulo),
     * reverting when dividing by zero.
     *
     * Counterpart to Solidity's `%` operator. This function uses a `revert`
     * opcode (which leaves remaining gas untouched) while Solidity uses an
     * invalid opcode to revert (consuming all remaining gas).
     *
     * Requirements:
     *
     * - The divisor cannot be zero.
     */
    function mod(uint256 a, uint256 b) internal pure returns (uint256) {
        return a % b;
    }

    /**
     * @dev Returns the subtraction of two unsigned integers, reverting with custom message on
     * overflow (when the result is negative).
     *
     * CAUTION: This function is deprecated because it requires allocating memory for the error
     * message unnecessarily. For custom revert reasons use {trySub}.
     *
     * Counterpart to Solidity's `-` operator.
     *
     * Requirements:
     *
     * - Subtraction cannot overflow.
     */
    function sub(
        uint256 a,
        uint256 b,
        string memory errorMessage
    ) internal pure returns (uint256) {
        unchecked {
            require(b <= a, errorMessage);
            return a - b;
        }
    }

    /**
     * @dev Returns the integer division of two unsigned integers, reverting with custom message on
     * division by zero. The result is rounded towards zero.
     *
     * Counterpart to Solidity's `/` operator. Note: this function uses a
     * `revert` opcode (which leaves remaining gas untouched) while Solidity
     * uses an invalid opcode to revert (consuming all remaining gas).
     *
     * Requirements:
     *
     * - The divisor cannot be zero.
     */
    function div(
        uint256 a,
        uint256 b,
        string memory errorMessage
    ) internal pure returns (uint256) {
        unchecked {
            require(b > 0, errorMessage);
            return a / b;
        }
    }

    /**
     * @dev Returns the remainder of dividing two unsigned integers. (unsigned integer modulo),
     * reverting with custom message when dividing by zero.
     *
     * CAUTION: This function is deprecated because it requires allocating memory for the error
     * message unnecessarily. For custom revert reasons use {tryMod}.
     *
     * Counterpart to Solidity's `%` operator. This function uses a `revert`
     * opcode (which leaves remaining gas untouched) while Solidity uses an
     * invalid opcode to revert (consuming all remaining gas).
     *
     * Requirements:
     *
     * - The divisor cannot be zero.
     */
    function mod(
        uint256 a,
        uint256 b,
        string memory errorMessage
    ) internal pure returns (uint256) {
        unchecked {
            require(b > 0, errorMessage);
            return a % b;
        }
    }
}


// File @openzeppelin/contracts/security/ReentrancyGuard.sol@v4.5.0

// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts v4.4.1 (security/ReentrancyGuard.sol)

pragma solidity ^0.8.0;

/**
 * @dev Contract module that helps prevent reentrant calls to a function.
 *
 * Inheriting from `ReentrancyGuard` will make the {nonReentrant} modifier
 * available, which can be applied to functions to make sure there are no nested
 * (reentrant) calls to them.
 *
 * Note that because there is a single `nonReentrant` guard, functions marked as
 * `nonReentrant` may not call one another. This can be worked around by making
 * those functions `private`, and then adding `external` `nonReentrant` entry
 * points to them.
 *
 * TIP: If you would like to learn more about reentrancy and alternative ways
 * to protect against it, check out our blog post
 * https://blog.openzeppelin.com/reentrancy-after-istanbul/[Reentrancy After Istanbul].
 */
abstract contract ReentrancyGuard {
    // Booleans are more expensive than uint256 or any type that takes up a full
    // word because each write operation emits an extra SLOAD to first read the
    // slot's contents, replace the bits taken up by the boolean, and then write
    // back. This is the compiler's defense against contract upgrades and
    // pointer aliasing, and it cannot be disabled.

    // The values being non-zero value makes deployment a bit more expensive,
    // but in exchange the refund on every call to nonReentrant will be lower in
    // amount. Since refunds are capped to a percentage of the total
    // transaction's gas, it is best to keep them low in cases like this one, to
    // increase the likelihood of the full refund coming into effect.
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;

    uint256 private _status;

    constructor() {
        _status = _NOT_ENTERED;
    }

    /**
     * @dev Prevents a contract from calling itself, directly or indirectly.
     * Calling a `nonReentrant` function from another `nonReentrant`
     * function is not supported. It is possible to prevent this from happening
     * by making the `nonReentrant` function external, and making it call a
     * `private` function that does the actual work.
     */
    modifier nonReentrant() {
        // On the first call to nonReentrant, _notEntered will be true
        require(_status != _ENTERED, "ReentrancyGuard: reentrant call");

        // Any calls to nonReentrant after this point will fail
        _status = _ENTERED;

        _;

        // By storing the original value once again, a refund is triggered (see
        // https://eips.ethereum.org/EIPS/eip-2200)
        _status = _NOT_ENTERED;
    }
}


// File @openzeppelin/contracts/token/ERC20/IERC20.sol@v4.5.0

// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v4.5.0) (token/ERC20/IERC20.sol)

pragma solidity ^0.8.0;

/**
 * @dev Interface of the ERC20 standard as defined in the EIP.
 */
interface IERC20 {
    /**
     * @dev Returns the amount of tokens in existence.
     */
    function totalSupply() external view returns (uint256);

    /**
     * @dev Returns the amount of tokens owned by `account`.
     */
    function balanceOf(address account) external view returns (uint256);

    /**
     * @dev Moves `amount` tokens from the caller's account to `to`.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transfer(address to, uint256 amount) external returns (bool);

    /**
     * @dev Returns the remaining number of tokens that `spender` will be
     * allowed to spend on behalf of `owner` through {transferFrom}. This is
     * zero by default.
     *
     * This value changes when {approve} or {transferFrom} are called.
     */
    function allowance(address owner, address spender) external view returns (uint256);

    /**
     * @dev Sets `amount` as the allowance of `spender` over the caller's tokens.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * IMPORTANT: Beware that changing an allowance with this method brings the risk
     * that someone may use both the old and the new allowance by unfortunate
     * transaction ordering. One possible solution to mitigate this race
     * condition is to first reduce the spender's allowance to 0 and set the
     * desired value afterwards:
     * https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
     *
     * Emits an {Approval} event.
     */
    function approve(address spender, uint256 amount) external returns (bool);

    /**
     * @dev Moves `amount` tokens from `from` to `to` using the
     * allowance mechanism. `amount` is then deducted from the caller's
     * allowance.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) external returns (bool);

    /**
     * @dev Emitted when `value` tokens are moved from one account (`from`) to
     * another (`to`).
     *
     * Note that `value` may be zero.
     */
    event Transfer(address indexed from, address indexed to, uint256 value);

    /**
     * @dev Emitted when the allowance of a `spender` for an `owner` is set by
     * a call to {approve}. `value` is the new allowance.
     */
    event Approval(address indexed owner, address indexed spender, uint256 value);
}


// File @openzeppelin/contracts/utils/Address.sol@v4.5.0

// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v4.5.0) (utils/Address.sol)

pragma solidity ^0.8.1;

/**
 * @dev Collection of functions related to the address type
 */
library Address {
    /**
     * @dev Returns true if `account` is a contract.
     *
     * [IMPORTANT]
     * ====
     * It is unsafe to assume that an address for which this function returns
     * false is an externally-owned account (EOA) and not a contract.
     *
     * Among others, `isContract` will return false for the following
     * types of addresses:
     *
     *  - an externally-owned account
     *  - a contract in construction
     *  - an address where a contract will be created
     *  - an address where a contract lived, but was destroyed
     * ====
     *
     * [IMPORTANT]
     * ====
     * You shouldn't rely on `isContract` to protect against flash loan attacks!
     *
     * Preventing calls from contracts is highly discouraged. It breaks composability, breaks support for smart wallets
     * like Gnosis Safe, and does not provide security since it can be circumvented by calling from a contract
     * constructor.
     * ====
     */
    function isContract(address account) internal view returns (bool) {
        // This method relies on extcodesize/address.code.length, which returns 0
        // for contracts in construction, since the code is only stored at the end
        // of the constructor execution.

        return account.code.length > 0;
    }

    /**
     * @dev Replacement for Solidity's `transfer`: sends `amount` wei to
     * `recipient`, forwarding all available gas and reverting on errors.
     *
     * https://eips.ethereum.org/EIPS/eip-1884[EIP1884] increases the gas cost
     * of certain opcodes, possibly making contracts go over the 2300 gas limit
     * imposed by `transfer`, making them unable to receive funds via
     * `transfer`. {sendValue} removes this limitation.
     *
     * https://diligence.consensys.net/posts/2019/09/stop-using-soliditys-transfer-now/[Learn more].
     *
     * IMPORTANT: because control is transferred to `recipient`, care must be
     * taken to not create reentrancy vulnerabilities. Consider using
     * {ReentrancyGuard} or the
     * https://solidity.readthedocs.io/en/v0.5.11/security-considerations.html#use-the-checks-effects-interactions-pattern[checks-effects-interactions pattern].
     */
    function sendValue(address payable recipient, uint256 amount) internal {
        require(address(this).balance >= amount, "Address: insufficient balance");

        (bool success, ) = recipient.call{value: amount}("");
        require(success, "Address: unable to send value, recipient may have reverted");
    }

    /**
     * @dev Performs a Solidity function call using a low level `call`. A
     * plain `call` is an unsafe replacement for a function call: use this
     * function instead.
     *
     * If `target` reverts with a revert reason, it is bubbled up by this
     * function (like regular Solidity function calls).
     *
     * Returns the raw returned data. To convert to the expected return value,
     * use https://solidity.readthedocs.io/en/latest/units-and-global-variables.html?highlight=abi.decode#abi-encoding-and-decoding-functions[`abi.decode`].
     *
     * Requirements:
     *
     * - `target` must be a contract.
     * - calling `target` with `data` must not revert.
     *
     * _Available since v3.1._
     */
    function functionCall(address target, bytes memory data) internal returns (bytes memory) {
        return functionCall(target, data, "Address: low-level call failed");
    }

    /**
     * @dev Same as {xref-Address-functionCall-address-bytes-}[`functionCall`], but with
     * `errorMessage` as a fallback revert reason when `target` reverts.
     *
     * _Available since v3.1._
     */
    function functionCall(
        address target,
        bytes memory data,
        string memory errorMessage
    ) internal returns (bytes memory) {
        return functionCallWithValue(target, data, 0, errorMessage);
    }

    /**
     * @dev Same as {xref-Address-functionCall-address-bytes-}[`functionCall`],
     * but also transferring `value` wei to `target`.
     *
     * Requirements:
     *
     * - the calling contract must have an ETH balance of at least `value`.
     * - the called Solidity function must be `payable`.
     *
     * _Available since v3.1._
     */
    function functionCallWithValue(
        address target,
        bytes memory data,
        uint256 value
    ) internal returns (bytes memory) {
        return functionCallWithValue(target, data, value, "Address: low-level call with value failed");
    }

    /**
     * @dev Same as {xref-Address-functionCallWithValue-address-bytes-uint256-}[`functionCallWithValue`], but
     * with `errorMessage` as a fallback revert reason when `target` reverts.
     *
     * _Available since v3.1._
     */
    function functionCallWithValue(
        address target,
        bytes memory data,
        uint256 value,
        string memory errorMessage
    ) internal returns (bytes memory) {
        require(address(this).balance >= value, "Address: insufficient balance for call");
        require(isContract(target), "Address: call to non-contract");

        (bool success, bytes memory returndata) = target.call{value: value}(data);
        return verifyCallResult(success, returndata, errorMessage);
    }

    /**
     * @dev Same as {xref-Address-functionCall-address-bytes-}[`functionCall`],
     * but performing a static call.
     *
     * _Available since v3.3._
     */
    function functionStaticCall(address target, bytes memory data) internal view returns (bytes memory) {
        return functionStaticCall(target, data, "Address: low-level static call failed");
    }

    /**
     * @dev Same as {xref-Address-functionCall-address-bytes-string-}[`functionCall`],
     * but performing a static call.
     *
     * _Available since v3.3._
     */
    function functionStaticCall(
        address target,
        bytes memory data,
        string memory errorMessage
    ) internal view returns (bytes memory) {
        require(isContract(target), "Address: static call to non-contract");

        (bool success, bytes memory returndata) = target.staticcall(data);
        return verifyCallResult(success, returndata, errorMessage);
    }

    /**
     * @dev Same as {xref-Address-functionCall-address-bytes-}[`functionCall`],
     * but performing a delegate call.
     *
     * _Available since v3.4._
     */
    function functionDelegateCall(address target, bytes memory data) internal returns (bytes memory) {
        return functionDelegateCall(target, data, "Address: low-level delegate call failed");
    }

    /**
     * @dev Same as {xref-Address-functionCall-address-bytes-string-}[`functionCall`],
     * but performing a delegate call.
     *
     * _Available since v3.4._
     */
    function functionDelegateCall(
        address target,
        bytes memory data,
        string memory errorMessage
    ) internal returns (bytes memory) {
        require(isContract(target), "Address: delegate call to non-contract");

        (bool success, bytes memory returndata) = target.delegatecall(data);
        return verifyCallResult(success, returndata, errorMessage);
    }

    /**
     * @dev Tool to verifies that a low level call was successful, and revert if it wasn't, either by bubbling the
     * revert reason using the provided one.
     *
     * _Available since v4.3._
     */
    function verifyCallResult(
        bool success,
        bytes memory returndata,
        string memory errorMessage
    ) internal pure returns (bytes memory) {
        if (success) {
            return returndata;
        } else {
            // Look for revert reason and bubble it up if present
            if (returndata.length > 0) {
                // The easiest way to bubble the revert reason is using memory via assembly

                assembly {
                    let returndata_size := mload(returndata)
                    revert(add(32, returndata), returndata_size)
                }
            } else {
                revert(errorMessage);
            }
        }
    }
}


// File @openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol@v4.5.0

// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts v4.4.1 (token/ERC20/utils/SafeERC20.sol)

pragma solidity ^0.8.0;


/**
 * @title SafeERC20
 * @dev Wrappers around ERC20 operations that throw on failure (when the token
 * contract returns false). Tokens that return no value (and instead revert or
 * throw on failure) are also supported, non-reverting calls are assumed to be
 * successful.
 * To use this library you can add a `using SafeERC20 for IERC20;` statement to your contract,
 * which allows you to call the safe operations as `token.safeTransfer(...)`, etc.
 */
library SafeERC20 {
    using Address for address;

    function safeTransfer(
        IERC20 token,
        address to,
        uint256 value
    ) internal {
        _callOptionalReturn(token, abi.encodeWithSelector(token.transfer.selector, to, value));
    }

    function safeTransferFrom(
        IERC20 token,
        address from,
        address to,
        uint256 value
    ) internal {
        _callOptionalReturn(token, abi.encodeWithSelector(token.transferFrom.selector, from, to, value));
    }

    /**
     * @dev Deprecated. This function has issues similar to the ones found in
     * {IERC20-approve}, and its usage is discouraged.
     *
     * Whenever possible, use {safeIncreaseAllowance} and
     * {safeDecreaseAllowance} instead.
     */
    function safeApprove(
        IERC20 token,
        address spender,
        uint256 value
    ) internal {
        // safeApprove should only be called when setting an initial allowance,
        // or when resetting it to zero. To increase and decrease it, use
        // 'safeIncreaseAllowance' and 'safeDecreaseAllowance'
        require(
            (value == 0) || (token.allowance(address(this), spender) == 0),
            "SafeERC20: approve from non-zero to non-zero allowance"
        );
        _callOptionalReturn(token, abi.encodeWithSelector(token.approve.selector, spender, value));
    }

    function safeIncreaseAllowance(
        IERC20 token,
        address spender,
        uint256 value
    ) internal {
        uint256 newAllowance = token.allowance(address(this), spender) + value;
        _callOptionalReturn(token, abi.encodeWithSelector(token.approve.selector, spender, newAllowance));
    }

    function safeDecreaseAllowance(
        IERC20 token,
        address spender,
        uint256 value
    ) internal {
        unchecked {
            uint256 oldAllowance = token.allowance(address(this), spender);
            require(oldAllowance >= value, "SafeERC20: decreased allowance below zero");
            uint256 newAllowance = oldAllowance - value;
            _callOptionalReturn(token, abi.encodeWithSelector(token.approve.selector, spender, newAllowance));
        }
    }

    /**
     * @dev Imitates a Solidity high-level call (i.e. a regular function call to a contract), relaxing the requirement
     * on the return value: the return value is optional (but if data is returned, it must not be false).
     * @param token The token targeted by the call.
     * @param data The call data (encoded using abi.encode or one of its variants).
     */
    function _callOptionalReturn(IERC20 token, bytes memory data) private {
        // We need to perform a low level call here, to bypass Solidity's return data size checking mechanism, since
        // we're implementing it ourselves. We use {Address.functionCall} to perform this call, which verifies that
        // the target address contains contract code and also asserts for success in the low-level call.

        bytes memory returndata = address(token).functionCall(data, "SafeERC20: low-level call failed");
        if (returndata.length > 0) {
            // Return data is optional
            require(abi.decode(returndata, (bool)), "SafeERC20: ERC20 operation did not succeed");
        }
    }
}


// File @openzeppelin/contracts/token/ERC20/extensions/draft-IERC20Permit.sol@v4.5.0

// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts v4.4.1 (token/ERC20/extensions/draft-IERC20Permit.sol)

pragma solidity ^0.8.0;

/**
 * @dev Interface of the ERC20 Permit extension allowing approvals to be made via signatures, as defined in
 * https://eips.ethereum.org/EIPS/eip-2612[EIP-2612].
 *
 * Adds the {permit} method, which can be used to change an account's ERC20 allowance (see {IERC20-allowance}) by
 * presenting a message signed by the account. By not relying on {IERC20-approve}, the token holder account doesn't
 * need to send a transaction, and thus is not required to hold Ether at all.
 */
interface IERC20Permit {
    /**
     * @dev Sets `value` as the allowance of `spender` over ``owner``'s tokens,
     * given ``owner``'s signed approval.
     *
     * IMPORTANT: The same issues {IERC20-approve} has related to transaction
     * ordering also apply here.
     *
     * Emits an {Approval} event.
     *
     * Requirements:
     *
     * - `spender` cannot be the zero address.
     * - `deadline` must be a timestamp in the future.
     * - `v`, `r` and `s` must be a valid `secp256k1` signature from `owner`
     * over the EIP712-formatted function arguments.
     * - the signature must use ``owner``'s current nonce (see {nonces}).
     *
     * For more information on the signature format, see the
     * https://eips.ethereum.org/EIPS/eip-2612#specification[relevant EIP
     * section].
     */
    function permit(
        address owner,
        address spender,
        uint256 value,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external;

    /**
     * @dev Returns the current nonce for `owner`. This value must be
     * included whenever a signature is generated for {permit}.
     *
     * Every successful call to {permit} increases ``owner``'s nonce by one. This
     * prevents a signature from being used multiple times.
     */
    function nonces(address owner) external view returns (uint256);

    /**
     * @dev Returns the domain separator used in the encoding of the signature for {permit}, as defined by {EIP712}.
     */
    // solhint-disable-next-line func-name-mixedcase
    function DOMAIN_SEPARATOR() external view returns (bytes32);
}


// File @openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol@v4.5.0

// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts v4.4.1 (token/ERC20/extensions/IERC20Metadata.sol)

pragma solidity ^0.8.0;

/**
 * @dev Interface for the optional metadata functions from the ERC20 standard.
 *
 * _Available since v4.1._
 */
interface IERC20Metadata is IERC20 {
    /**
     * @dev Returns the name of the token.
     */
    function name() external view returns (string memory);

    /**
     * @dev Returns the symbol of the token.
     */
    function symbol() external view returns (string memory);

    /**
     * @dev Returns the decimals places of the token.
     */
    function decimals() external view returns (uint8);
}


// File @openzeppelin/contracts/utils/Context.sol@v4.5.0

// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts v4.4.1 (utils/Context.sol)

pragma solidity ^0.8.0;

/**
 * @dev Provides information about the current execution context, including the
 * sender of the transaction and its data. While these are generally available
 * via msg.sender and msg.data, they should not be accessed in such a direct
 * manner, since when dealing with meta-transactions the account sending and
 * paying for execution may not be the actual sender (as far as an application
 * is concerned).
 *
 * This contract is only required for intermediate, library-like contracts.
 */
abstract contract Context {
    function _msgSender() internal view virtual returns (address) {
        return msg.sender;
    }

    function _msgData() internal view virtual returns (bytes calldata) {
        return msg.data;
    }
}


// File @openzeppelin/contracts/token/ERC20/ERC20.sol@v4.5.0

// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v4.5.0) (token/ERC20/ERC20.sol)

pragma solidity ^0.8.0;



/**
 * @dev Implementation of the {IERC20} interface.
 *
 * This implementation is agnostic to the way tokens are created. This means
 * that a supply mechanism has to be added in a derived contract using {_mint}.
 * For a generic mechanism see {ERC20PresetMinterPauser}.
 *
 * TIP: For a detailed writeup see our guide
 * https://forum.zeppelin.solutions/t/how-to-implement-erc20-supply-mechanisms/226[How
 * to implement supply mechanisms].
 *
 * We have followed general OpenZeppelin Contracts guidelines: functions revert
 * instead returning `false` on failure. This behavior is nonetheless
 * conventional and does not conflict with the expectations of ERC20
 * applications.
 *
 * Additionally, an {Approval} event is emitted on calls to {transferFrom}.
 * This allows applications to reconstruct the allowance for all accounts just
 * by listening to said events. Other implementations of the EIP may not emit
 * these events, as it isn't required by the specification.
 *
 * Finally, the non-standard {decreaseAllowance} and {increaseAllowance}
 * functions have been added to mitigate the well-known issues around setting
 * allowances. See {IERC20-approve}.
 */
contract ERC20 is Context, IERC20, IERC20Metadata {
    mapping(address => uint256) private _balances;

    mapping(address => mapping(address => uint256)) private _allowances;

    uint256 private _totalSupply;

    string private _name;
    string private _symbol;

    /**
     * @dev Sets the values for {name} and {symbol}.
     *
     * The default value of {decimals} is 18. To select a different value for
     * {decimals} you should overload it.
     *
     * All two of these values are immutable: they can only be set once during
     * construction.
     */
    constructor(string memory name_, string memory symbol_) {
        _name = name_;
        _symbol = symbol_;
    }

    /**
     * @dev Returns the name of the token.
     */
    function name() public view virtual override returns (string memory) {
        return _name;
    }

    /**
     * @dev Returns the symbol of the token, usually a shorter version of the
     * name.
     */
    function symbol() public view virtual override returns (string memory) {
        return _symbol;
    }

    /**
     * @dev Returns the number of decimals used to get its user representation.
     * For example, if `decimals` equals `2`, a balance of `505` tokens should
     * be displayed to a user as `5.05` (`505 / 10 ** 2`).
     *
     * Tokens usually opt for a value of 18, imitating the relationship between
     * Ether and Wei. This is the value {ERC20} uses, unless this function is
     * overridden;
     *
     * NOTE: This information is only used for _display_ purposes: it in
     * no way affects any of the arithmetic of the contract, including
     * {IERC20-balanceOf} and {IERC20-transfer}.
     */
    function decimals() public view virtual override returns (uint8) {
        return 18;
    }

    /**
     * @dev See {IERC20-totalSupply}.
     */
    function totalSupply() public view virtual override returns (uint256) {
        return _totalSupply;
    }

    /**
     * @dev See {IERC20-balanceOf}.
     */
    function balanceOf(address account) public view virtual override returns (uint256) {
        return _balances[account];
    }

    /**
     * @dev See {IERC20-transfer}.
     *
     * Requirements:
     *
     * - `to` cannot be the zero address.
     * - the caller must have a balance of at least `amount`.
     */
    function transfer(address to, uint256 amount) public virtual override returns (bool) {
        address owner = _msgSender();
        _transfer(owner, to, amount);
        return true;
    }

    /**
     * @dev See {IERC20-allowance}.
     */
    function allowance(address owner, address spender) public view virtual override returns (uint256) {
        return _allowances[owner][spender];
    }

    /**
     * @dev See {IERC20-approve}.
     *
     * NOTE: If `amount` is the maximum `uint256`, the allowance is not updated on
     * `transferFrom`. This is semantically equivalent to an infinite approval.
     *
     * Requirements:
     *
     * - `spender` cannot be the zero address.
     */
    function approve(address spender, uint256 amount) public virtual override returns (bool) {
        address owner = _msgSender();
        _approve(owner, spender, amount);
        return true;
    }

    /**
     * @dev See {IERC20-transferFrom}.
     *
     * Emits an {Approval} event indicating the updated allowance. This is not
     * required by the EIP. See the note at the beginning of {ERC20}.
     *
     * NOTE: Does not update the allowance if the current allowance
     * is the maximum `uint256`.
     *
     * Requirements:
     *
     * - `from` and `to` cannot be the zero address.
     * - `from` must have a balance of at least `amount`.
     * - the caller must have allowance for ``from``'s tokens of at least
     * `amount`.
     */
    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) public virtual override returns (bool) {
        address spender = _msgSender();
        _spendAllowance(from, spender, amount);
        _transfer(from, to, amount);
        return true;
    }

    /**
     * @dev Atomically increases the allowance granted to `spender` by the caller.
     *
     * This is an alternative to {approve} that can be used as a mitigation for
     * problems described in {IERC20-approve}.
     *
     * Emits an {Approval} event indicating the updated allowance.
     *
     * Requirements:
     *
     * - `spender` cannot be the zero address.
     */
    function increaseAllowance(address spender, uint256 addedValue) public virtual returns (bool) {
        address owner = _msgSender();
        _approve(owner, spender, _allowances[owner][spender] + addedValue);
        return true;
    }

    /**
     * @dev Atomically decreases the allowance granted to `spender` by the caller.
     *
     * This is an alternative to {approve} that can be used as a mitigation for
     * problems described in {IERC20-approve}.
     *
     * Emits an {Approval} event indicating the updated allowance.
     *
     * Requirements:
     *
     * - `spender` cannot be the zero address.
     * - `spender` must have allowance for the caller of at least
     * `subtractedValue`.
     */
    function decreaseAllowance(address spender, uint256 subtractedValue) public virtual returns (bool) {
        address owner = _msgSender();
        uint256 currentAllowance = _allowances[owner][spender];
        require(currentAllowance >= subtractedValue, "ERC20: decreased allowance below zero");
        unchecked {
            _approve(owner, spender, currentAllowance - subtractedValue);
        }

        return true;
    }

    /**
     * @dev Moves `amount` of tokens from `sender` to `recipient`.
     *
     * This internal function is equivalent to {transfer}, and can be used to
     * e.g. implement automatic token fees, slashing mechanisms, etc.
     *
     * Emits a {Transfer} event.
     *
     * Requirements:
     *
     * - `from` cannot be the zero address.
     * - `to` cannot be the zero address.
     * - `from` must have a balance of at least `amount`.
     */
    function _transfer(
        address from,
        address to,
        uint256 amount
    ) internal virtual {
        require(from != address(0), "ERC20: transfer from the zero address");
        require(to != address(0), "ERC20: transfer to the zero address");

        _beforeTokenTransfer(from, to, amount);

        uint256 fromBalance = _balances[from];
        require(fromBalance >= amount, "ERC20: transfer amount exceeds balance");
        unchecked {
            _balances[from] = fromBalance - amount;
        }
        _balances[to] += amount;

        emit Transfer(from, to, amount);

        _afterTokenTransfer(from, to, amount);
    }

    /** @dev Creates `amount` tokens and assigns them to `account`, increasing
     * the total supply.
     *
     * Emits a {Transfer} event with `from` set to the zero address.
     *
     * Requirements:
     *
     * - `account` cannot be the zero address.
     */
    function _mint(address account, uint256 amount) internal virtual {
        require(account != address(0), "ERC20: mint to the zero address");

        _beforeTokenTransfer(address(0), account, amount);

        _totalSupply += amount;
        _balances[account] += amount;
        emit Transfer(address(0), account, amount);

        _afterTokenTransfer(address(0), account, amount);
    }

    /**
     * @dev Destroys `amount` tokens from `account`, reducing the
     * total supply.
     *
     * Emits a {Transfer} event with `to` set to the zero address.
     *
     * Requirements:
     *
     * - `account` cannot be the zero address.
     * - `account` must have at least `amount` tokens.
     */
    function _burn(address account, uint256 amount) internal virtual {
        require(account != address(0), "ERC20: burn from the zero address");

        _beforeTokenTransfer(account, address(0), amount);

        uint256 accountBalance = _balances[account];
        require(accountBalance >= amount, "ERC20: burn amount exceeds balance");
        unchecked {
            _balances[account] = accountBalance - amount;
        }
        _totalSupply -= amount;

        emit Transfer(account, address(0), amount);

        _afterTokenTransfer(account, address(0), amount);
    }

    /**
     * @dev Sets `amount` as the allowance of `spender` over the `owner` s tokens.
     *
     * This internal function is equivalent to `approve`, and can be used to
     * e.g. set automatic allowances for certain subsystems, etc.
     *
     * Emits an {Approval} event.
     *
     * Requirements:
     *
     * - `owner` cannot be the zero address.
     * - `spender` cannot be the zero address.
     */
    function _approve(
        address owner,
        address spender,
        uint256 amount
    ) internal virtual {
        require(owner != address(0), "ERC20: approve from the zero address");
        require(spender != address(0), "ERC20: approve to the zero address");

        _allowances[owner][spender] = amount;
        emit Approval(owner, spender, amount);
    }

    /**
     * @dev Spend `amount` form the allowance of `owner` toward `spender`.
     *
     * Does not update the allowance amount in case of infinite allowance.
     * Revert if not enough allowance is available.
     *
     * Might emit an {Approval} event.
     */
    function _spendAllowance(
        address owner,
        address spender,
        uint256 amount
    ) internal virtual {
        uint256 currentAllowance = allowance(owner, spender);
        if (currentAllowance != type(uint256).max) {
            require(currentAllowance >= amount, "ERC20: insufficient allowance");
            unchecked {
                _approve(owner, spender, currentAllowance - amount);
            }
        }
    }

    /**
     * @dev Hook that is called before any transfer of tokens. This includes
     * minting and burning.
     *
     * Calling conditions:
     *
     * - when `from` and `to` are both non-zero, `amount` of ``from``'s tokens
     * will be transferred to `to`.
     * - when `from` is zero, `amount` tokens will be minted for `to`.
     * - when `to` is zero, `amount` of ``from``'s tokens will be burned.
     * - `from` and `to` are never both zero.
     *
     * To learn more about hooks, head to xref:ROOT:extending-contracts.adoc#using-hooks[Using Hooks].
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal virtual {}

    /**
     * @dev Hook that is called after any transfer of tokens. This includes
     * minting and burning.
     *
     * Calling conditions:
     *
     * - when `from` and `to` are both non-zero, `amount` of ``from``'s tokens
     * has been transferred to `to`.
     * - when `from` is zero, `amount` tokens have been minted for `to`.
     * - when `to` is zero, `amount` of ``from``'s tokens have been burned.
     * - `from` and `to` are never both zero.
     *
     * To learn more about hooks, head to xref:ROOT:extending-contracts.adoc#using-hooks[Using Hooks].
     */
    function _afterTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal virtual {}
}


// File @openzeppelin/contracts/utils/Strings.sol@v4.5.0

// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts v4.4.1 (utils/Strings.sol)

pragma solidity ^0.8.0;

/**
 * @dev String operations.
 */
library Strings {
    bytes16 private constant _HEX_SYMBOLS = "0123456789abcdef";

    /**
     * @dev Converts a `uint256` to its ASCII `string` decimal representation.
     */
    function toString(uint256 value) internal pure returns (string memory) {
        // Inspired by OraclizeAPI's implementation - MIT licence
        // https://github.com/oraclize/ethereum-api/blob/b42146b063c7d6ee1358846c198246239e9360e8/oraclizeAPI_0.4.25.sol

        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }

    /**
     * @dev Converts a `uint256` to its ASCII `string` hexadecimal representation.
     */
    function toHexString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0x00";
        }
        uint256 temp = value;
        uint256 length = 0;
        while (temp != 0) {
            length++;
            temp >>= 8;
        }
        return toHexString(value, length);
    }

    /**
     * @dev Converts a `uint256` to its ASCII `string` hexadecimal representation with fixed length.
     */
    function toHexString(uint256 value, uint256 length) internal pure returns (string memory) {
        bytes memory buffer = new bytes(2 * length + 2);
        buffer[0] = "0";
        buffer[1] = "x";
        for (uint256 i = 2 * length + 1; i > 1; --i) {
            buffer[i] = _HEX_SYMBOLS[value & 0xf];
            value >>= 4;
        }
        require(value == 0, "Strings: hex length insufficient");
        return string(buffer);
    }
}


// File @openzeppelin/contracts/utils/cryptography/ECDSA.sol@v4.5.0

// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v4.5.0) (utils/cryptography/ECDSA.sol)

pragma solidity ^0.8.0;

/**
 * @dev Elliptic Curve Digital Signature Algorithm (ECDSA) operations.
 *
 * These functions can be used to verify that a message was signed by the holder
 * of the private keys of a given address.
 */
library ECDSA {
    enum RecoverError {
        NoError,
        InvalidSignature,
        InvalidSignatureLength,
        InvalidSignatureS,
        InvalidSignatureV
    }

    function _throwError(RecoverError error) private pure {
        if (error == RecoverError.NoError) {
            return; // no error: do nothing
        } else if (error == RecoverError.InvalidSignature) {
            revert("ECDSA: invalid signature");
        } else if (error == RecoverError.InvalidSignatureLength) {
            revert("ECDSA: invalid signature length");
        } else if (error == RecoverError.InvalidSignatureS) {
            revert("ECDSA: invalid signature 's' value");
        } else if (error == RecoverError.InvalidSignatureV) {
            revert("ECDSA: invalid signature 'v' value");
        }
    }

    /**
     * @dev Returns the address that signed a hashed message (`hash`) with
     * `signature` or error string. This address can then be used for verification purposes.
     *
     * The `ecrecover` EVM opcode allows for malleable (non-unique) signatures:
     * this function rejects them by requiring the `s` value to be in the lower
     * half order, and the `v` value to be either 27 or 28.
     *
     * IMPORTANT: `hash` _must_ be the result of a hash operation for the
     * verification to be secure: it is possible to craft signatures that
     * recover to arbitrary addresses for non-hashed data. A safe way to ensure
     * this is by receiving a hash of the original message (which may otherwise
     * be too long), and then calling {toEthSignedMessageHash} on it.
     *
     * Documentation for signature generation:
     * - with https://web3js.readthedocs.io/en/v1.3.4/web3-eth-accounts.html#sign[Web3.js]
     * - with https://docs.ethers.io/v5/api/signer/#Signer-signMessage[ethers]
     *
     * _Available since v4.3._
     */
    function tryRecover(bytes32 hash, bytes memory signature) internal pure returns (address, RecoverError) {
        // Check the signature length
        // - case 65: r,s,v signature (standard)
        // - case 64: r,vs signature (cf https://eips.ethereum.org/EIPS/eip-2098) _Available since v4.1._
        if (signature.length == 65) {
            bytes32 r;
            bytes32 s;
            uint8 v;
            // ecrecover takes the signature parameters, and the only way to get them
            // currently is to use assembly.
            assembly {
                r := mload(add(signature, 0x20))
                s := mload(add(signature, 0x40))
                v := byte(0, mload(add(signature, 0x60)))
            }
            return tryRecover(hash, v, r, s);
        } else if (signature.length == 64) {
            bytes32 r;
            bytes32 vs;
            // ecrecover takes the signature parameters, and the only way to get them
            // currently is to use assembly.
            assembly {
                r := mload(add(signature, 0x20))
                vs := mload(add(signature, 0x40))
            }
            return tryRecover(hash, r, vs);
        } else {
            return (address(0), RecoverError.InvalidSignatureLength);
        }
    }

    /**
     * @dev Returns the address that signed a hashed message (`hash`) with
     * `signature`. This address can then be used for verification purposes.
     *
     * The `ecrecover` EVM opcode allows for malleable (non-unique) signatures:
     * this function rejects them by requiring the `s` value to be in the lower
     * half order, and the `v` value to be either 27 or 28.
     *
     * IMPORTANT: `hash` _must_ be the result of a hash operation for the
     * verification to be secure: it is possible to craft signatures that
     * recover to arbitrary addresses for non-hashed data. A safe way to ensure
     * this is by receiving a hash of the original message (which may otherwise
     * be too long), and then calling {toEthSignedMessageHash} on it.
     */
    function recover(bytes32 hash, bytes memory signature) internal pure returns (address) {
        (address recovered, RecoverError error) = tryRecover(hash, signature);
        _throwError(error);
        return recovered;
    }

    /**
     * @dev Overload of {ECDSA-tryRecover} that receives the `r` and `vs` short-signature fields separately.
     *
     * See https://eips.ethereum.org/EIPS/eip-2098[EIP-2098 short signatures]
     *
     * _Available since v4.3._
     */
    function tryRecover(
        bytes32 hash,
        bytes32 r,
        bytes32 vs
    ) internal pure returns (address, RecoverError) {
        bytes32 s = vs & bytes32(0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff);
        uint8 v = uint8((uint256(vs) >> 255) + 27);
        return tryRecover(hash, v, r, s);
    }

    /**
     * @dev Overload of {ECDSA-recover} that receives the `r and `vs` short-signature fields separately.
     *
     * _Available since v4.2._
     */
    function recover(
        bytes32 hash,
        bytes32 r,
        bytes32 vs
    ) internal pure returns (address) {
        (address recovered, RecoverError error) = tryRecover(hash, r, vs);
        _throwError(error);
        return recovered;
    }

    /**
     * @dev Overload of {ECDSA-tryRecover} that receives the `v`,
     * `r` and `s` signature fields separately.
     *
     * _Available since v4.3._
     */
    function tryRecover(
        bytes32 hash,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) internal pure returns (address, RecoverError) {
        // EIP-2 still allows signature malleability for ecrecover(). Remove this possibility and make the signature
        // unique. Appendix F in the Ethereum Yellow paper (https://ethereum.github.io/yellowpaper/paper.pdf), defines
        // the valid range for s in (301): 0 < s < secp256k1n ÷ 2 + 1, and for v in (302): v ∈ {27, 28}. Most
        // signatures from current libraries generate a unique signature with an s-value in the lower half order.
        //
        // If your library generates malleable signatures, such as s-values in the upper range, calculate a new s-value
        // with 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141 - s1 and flip v from 27 to 28 or
        // vice versa. If your library also generates signatures with 0/1 for v instead 27/28, add 27 to v to accept
        // these malleable signatures as well.
        if (uint256(s) > 0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF5D576E7357A4501DDFE92F46681B20A0) {
            return (address(0), RecoverError.InvalidSignatureS);
        }
        if (v != 27 && v != 28) {
            return (address(0), RecoverError.InvalidSignatureV);
        }

        // If the signature is valid (and not malleable), return the signer address
        address signer = ecrecover(hash, v, r, s);
        if (signer == address(0)) {
            return (address(0), RecoverError.InvalidSignature);
        }

        return (signer, RecoverError.NoError);
    }

    /**
     * @dev Overload of {ECDSA-recover} that receives the `v`,
     * `r` and `s` signature fields separately.
     */
    function recover(
        bytes32 hash,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) internal pure returns (address) {
        (address recovered, RecoverError error) = tryRecover(hash, v, r, s);
        _throwError(error);
        return recovered;
    }

    /**
     * @dev Returns an Ethereum Signed Message, created from a `hash`. This
     * produces hash corresponding to the one signed with the
     * https://eth.wiki/json-rpc/API#eth_sign[`eth_sign`]
     * JSON-RPC method as part of EIP-191.
     *
     * See {recover}.
     */
    function toEthSignedMessageHash(bytes32 hash) internal pure returns (bytes32) {
        // 32 is the length in bytes of hash,
        // enforced by the type signature above
        return keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", hash));
    }

    /**
     * @dev Returns an Ethereum Signed Message, created from `s`. This
     * produces hash corresponding to the one signed with the
     * https://eth.wiki/json-rpc/API#eth_sign[`eth_sign`]
     * JSON-RPC method as part of EIP-191.
     *
     * See {recover}.
     */
    function toEthSignedMessageHash(bytes memory s) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n", Strings.toString(s.length), s));
    }

    /**
     * @dev Returns an Ethereum Signed Typed Data, created from a
     * `domainSeparator` and a `structHash`. This produces hash corresponding
     * to the one signed with the
     * https://eips.ethereum.org/EIPS/eip-712[`eth_signTypedData`]
     * JSON-RPC method as part of EIP-712.
     *
     * See {recover}.
     */
    function toTypedDataHash(bytes32 domainSeparator, bytes32 structHash) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked("\x19\x01", domainSeparator, structHash));
    }
}


// File @openzeppelin/contracts/utils/cryptography/draft-EIP712.sol@v4.5.0

// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts v4.4.1 (utils/cryptography/draft-EIP712.sol)

pragma solidity ^0.8.0;

/**
 * @dev https://eips.ethereum.org/EIPS/eip-712[EIP 712] is a standard for hashing and signing of typed structured data.
 *
 * The encoding specified in the EIP is very generic, and such a generic implementation in Solidity is not feasible,
 * thus this contract does not implement the encoding itself. Protocols need to implement the type-specific encoding
 * they need in their contracts using a combination of `abi.encode` and `keccak256`.
 *
 * This contract implements the EIP 712 domain separator ({_domainSeparatorV4}) that is used as part of the encoding
 * scheme, and the final step of the encoding to obtain the message digest that is then signed via ECDSA
 * ({_hashTypedDataV4}).
 *
 * The implementation of the domain separator was designed to be as efficient as possible while still properly updating
 * the chain id to protect against replay attacks on an eventual fork of the chain.
 *
 * NOTE: This contract implements the version of the encoding known as "v4", as implemented by the JSON RPC method
 * https://docs.metamask.io/guide/signing-data.html[`eth_signTypedDataV4` in MetaMask].
 *
 * _Available since v3.4._
 */
abstract contract EIP712 {
    /* solhint-disable var-name-mixedcase */
    // Cache the domain separator as an immutable value, but also store the chain id that it corresponds to, in order to
    // invalidate the cached domain separator if the chain id changes.
    bytes32 private immutable _CACHED_DOMAIN_SEPARATOR;
    uint256 private immutable _CACHED_CHAIN_ID;
    address private immutable _CACHED_THIS;

    bytes32 private immutable _HASHED_NAME;
    bytes32 private immutable _HASHED_VERSION;
    bytes32 private immutable _TYPE_HASH;

    /* solhint-enable var-name-mixedcase */

    /**
     * @dev Initializes the domain separator and parameter caches.
     *
     * The meaning of `name` and `version` is specified in
     * https://eips.ethereum.org/EIPS/eip-712#definition-of-domainseparator[EIP 712]:
     *
     * - `name`: the user readable name of the signing domain, i.e. the name of the DApp or the protocol.
     * - `version`: the current major version of the signing domain.
     *
     * NOTE: These parameters cannot be changed except through a xref:learn::upgrading-smart-contracts.adoc[smart
     * contract upgrade].
     */
    constructor(string memory name, string memory version) {
        bytes32 hashedName = keccak256(bytes(name));
        bytes32 hashedVersion = keccak256(bytes(version));
        bytes32 typeHash = keccak256(
            "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
        );
        _HASHED_NAME = hashedName;
        _HASHED_VERSION = hashedVersion;
        _CACHED_CHAIN_ID = block.chainid;
        _CACHED_DOMAIN_SEPARATOR = _buildDomainSeparator(typeHash, hashedName, hashedVersion);
        _CACHED_THIS = address(this);
        _TYPE_HASH = typeHash;
    }

    /**
     * @dev Returns the domain separator for the current chain.
     */
    function _domainSeparatorV4() internal view returns (bytes32) {
        if (address(this) == _CACHED_THIS && block.chainid == _CACHED_CHAIN_ID) {
            return _CACHED_DOMAIN_SEPARATOR;
        } else {
            return _buildDomainSeparator(_TYPE_HASH, _HASHED_NAME, _HASHED_VERSION);
        }
    }

    function _buildDomainSeparator(
        bytes32 typeHash,
        bytes32 nameHash,
        bytes32 versionHash
    ) private view returns (bytes32) {
        return keccak256(abi.encode(typeHash, nameHash, versionHash, block.chainid, address(this)));
    }

    /**
     * @dev Given an already https://eips.ethereum.org/EIPS/eip-712#definition-of-hashstruct[hashed struct], this
     * function returns the hash of the fully encoded EIP712 message for this domain.
     *
     * This hash can be used together with {ECDSA-recover} to obtain the signer of a message. For example:
     *
     * ```solidity
     * bytes32 digest = _hashTypedDataV4(keccak256(abi.encode(
     *     keccak256("Mail(address to,string contents)"),
     *     mailTo,
     *     keccak256(bytes(mailContents))
     * )));
     * address signer = ECDSA.recover(digest, signature);
     * ```
     */
    function _hashTypedDataV4(bytes32 structHash) internal view virtual returns (bytes32) {
        return ECDSA.toTypedDataHash(_domainSeparatorV4(), structHash);
    }
}


// File @openzeppelin/contracts/utils/Counters.sol@v4.5.0

// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts v4.4.1 (utils/Counters.sol)

pragma solidity ^0.8.0;

/**
 * @title Counters
 * @author Matt Condon (@shrugs)
 * @dev Provides counters that can only be incremented, decremented or reset. This can be used e.g. to track the number
 * of elements in a mapping, issuing ERC721 ids, or counting request ids.
 *
 * Include with `using Counters for Counters.Counter;`
 */
library Counters {
    struct Counter {
        // This variable should never be directly accessed by users of the library: interactions must be restricted to
        // the library's function. As of Solidity v0.5.2, this cannot be enforced, though there is a proposal to add
        // this feature: see https://github.com/ethereum/solidity/issues/4637
        uint256 _value; // default: 0
    }

    function current(Counter storage counter) internal view returns (uint256) {
        return counter._value;
    }

    function increment(Counter storage counter) internal {
        unchecked {
            counter._value += 1;
        }
    }

    function decrement(Counter storage counter) internal {
        uint256 value = counter._value;
        require(value > 0, "Counter: decrement overflow");
        unchecked {
            counter._value = value - 1;
        }
    }

    function reset(Counter storage counter) internal {
        counter._value = 0;
    }
}


// File @openzeppelin/contracts/token/ERC20/extensions/draft-ERC20Permit.sol@v4.5.0

// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts v4.4.1 (token/ERC20/extensions/draft-ERC20Permit.sol)

pragma solidity ^0.8.0;





/**
 * @dev Implementation of the ERC20 Permit extension allowing approvals to be made via signatures, as defined in
 * https://eips.ethereum.org/EIPS/eip-2612[EIP-2612].
 *
 * Adds the {permit} method, which can be used to change an account's ERC20 allowance (see {IERC20-allowance}) by
 * presenting a message signed by the account. By not relying on `{IERC20-approve}`, the token holder account doesn't
 * need to send a transaction, and thus is not required to hold Ether at all.
 *
 * _Available since v3.4._
 */
abstract contract ERC20Permit is ERC20, IERC20Permit, EIP712 {
    using Counters for Counters.Counter;

    mapping(address => Counters.Counter) private _nonces;

    // solhint-disable-next-line var-name-mixedcase
    bytes32 private immutable _PERMIT_TYPEHASH =
        keccak256("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)");

    /**
     * @dev Initializes the {EIP712} domain separator using the `name` parameter, and setting `version` to `"1"`.
     *
     * It's a good idea to use the same `name` that is defined as the ERC20 token name.
     */
    constructor(string memory name) EIP712(name, "1") {}

    /**
     * @dev See {IERC20Permit-permit}.
     */
    function permit(
        address owner,
        address spender,
        uint256 value,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) public virtual override {
        require(block.timestamp <= deadline, "ERC20Permit: expired deadline");

        bytes32 structHash = keccak256(abi.encode(_PERMIT_TYPEHASH, owner, spender, value, _useNonce(owner), deadline));

        bytes32 hash = _hashTypedDataV4(structHash);

        address signer = ECDSA.recover(hash, v, r, s);
        require(signer == owner, "ERC20Permit: invalid signature");

        _approve(owner, spender, value);
    }

    /**
     * @dev See {IERC20Permit-nonces}.
     */
    function nonces(address owner) public view virtual override returns (uint256) {
        return _nonces[owner].current();
    }

    /**
     * @dev See {IERC20Permit-DOMAIN_SEPARATOR}.
     */
    // solhint-disable-next-line func-name-mixedcase
    function DOMAIN_SEPARATOR() external view override returns (bytes32) {
        return _domainSeparatorV4();
    }

    /**
     * @dev "Consume a nonce": return the current value and increment.
     *
     * _Available since v4.1._
     */
    function _useNonce(address owner) internal virtual returns (uint256 current) {
        Counters.Counter storage nonce = _nonces[owner];
        current = nonce.current();
        nonce.increment();
    }
}


// File @openzeppelin/contracts/utils/cryptography/SignatureChecker.sol@v4.5.0

// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v4.5.0) (utils/cryptography/SignatureChecker.sol)

pragma solidity ^0.8.0;



/**
 * @dev Signature verification helper that can be used instead of `ECDSA.recover` to seamlessly support both ECDSA
 * signatures from externally owned accounts (EOAs) as well as ERC1271 signatures from smart contract wallets like
 * Argent and Gnosis Safe.
 *
 * _Available since v4.1._
 */
library SignatureChecker {
    /**
     * @dev Checks if a signature is valid for a given signer and data hash. If the signer is a smart contract, the
     * signature is validated against that smart contract using ERC1271, otherwise it's validated using `ECDSA.recover`.
     *
     * NOTE: Unlike ECDSA signatures, contract signatures are revocable, and the outcome of this function can thus
     * change through time. It could return true at block N and false at block N+1 (or the opposite).
     */
    function isValidSignatureNow(
        address signer,
        bytes32 hash,
        bytes memory signature
    ) internal view returns (bool) {
        (address recovered, ECDSA.RecoverError error) = ECDSA.tryRecover(hash, signature);
        if (error == ECDSA.RecoverError.NoError && recovered == signer) {
            return true;
        }

        (bool success, bytes memory result) = signer.staticcall(
            abi.encodeWithSelector(IERC1271.isValidSignature.selector, hash, signature)
        );
        return (success && result.length == 32 && abi.decode(result, (bytes4)) == IERC1271.isValidSignature.selector);
    }
}


// File contracts/LLDEX/helpers/MutableOwner.sol

// SPDX-License-Identifier: MIT

pragma solidity ^0.8.1;

/// @title A helper contract with helper modifiers to allow access to current contract owner and change the owner
contract MutableOwner {
    address private _mutableOwner;

    event OwnershipTransfered(
        address from,
        address to
    );

    modifier onlyOwner() {
        require(msg.sender == _mutableOwner, "MO: Access denied");
        _;
    }

    constructor(address _owner) {
        _mutableOwner = _owner;
    }
    
    function _mutateOwner(address owner) internal onlyOwner {
        address previousOwner = _mutableOwner;
        _mutableOwner = owner;

        emit OwnershipTransfered(previousOwner, owner);
    }

    function mutableOwner() public view returns(address) {
        return _mutableOwner;
    }
}


// File @openzeppelin/contracts/utils/introspection/IERC165.sol@v4.5.0

// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts v4.4.1 (utils/introspection/IERC165.sol)

pragma solidity ^0.8.0;

/**
 * @dev Interface of the ERC165 standard, as defined in the
 * https://eips.ethereum.org/EIPS/eip-165[EIP].
 *
 * Implementers can declare support of contract interfaces, which can then be
 * queried by others ({ERC165Checker}).
 *
 * For an implementation, see {ERC165}.
 */
interface IERC165 {
    /**
     * @dev Returns true if this contract implements the interface defined by
     * `interfaceId`. See the corresponding
     * https://eips.ethereum.org/EIPS/eip-165#how-interfaces-are-identified[EIP section]
     * to learn more about how these ids are created.
     *
     * This function call must use less than 30 000 gas.
     */
    function supportsInterface(bytes4 interfaceId) external view returns (bool);
}


// File @openzeppelin/contracts/token/ERC1155/IERC1155.sol@v4.5.0

// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts v4.4.1 (token/ERC1155/IERC1155.sol)

pragma solidity ^0.8.0;

/**
 * @dev Required interface of an ERC1155 compliant contract, as defined in the
 * https://eips.ethereum.org/EIPS/eip-1155[EIP].
 *
 * _Available since v3.1._
 */
interface IERC1155 is IERC165 {
    /**
     * @dev Emitted when `value` tokens of token type `id` are transferred from `from` to `to` by `operator`.
     */
    event TransferSingle(address indexed operator, address indexed from, address indexed to, uint256 id, uint256 value);

    /**
     * @dev Equivalent to multiple {TransferSingle} events, where `operator`, `from` and `to` are the same for all
     * transfers.
     */
    event TransferBatch(
        address indexed operator,
        address indexed from,
        address indexed to,
        uint256[] ids,
        uint256[] values
    );

    /**
     * @dev Emitted when `account` grants or revokes permission to `operator` to transfer their tokens, according to
     * `approved`.
     */
    event ApprovalForAll(address indexed account, address indexed operator, bool approved);

    /**
     * @dev Emitted when the URI for token type `id` changes to `value`, if it is a non-programmatic URI.
     *
     * If an {URI} event was emitted for `id`, the standard
     * https://eips.ethereum.org/EIPS/eip-1155#metadata-extensions[guarantees] that `value` will equal the value
     * returned by {IERC1155MetadataURI-uri}.
     */
    event URI(string value, uint256 indexed id);

    /**
     * @dev Returns the amount of tokens of token type `id` owned by `account`.
     *
     * Requirements:
     *
     * - `account` cannot be the zero address.
     */
    function balanceOf(address account, uint256 id) external view returns (uint256);

    /**
     * @dev xref:ROOT:erc1155.adoc#batch-operations[Batched] version of {balanceOf}.
     *
     * Requirements:
     *
     * - `accounts` and `ids` must have the same length.
     */
    function balanceOfBatch(address[] calldata accounts, uint256[] calldata ids)
        external
        view
        returns (uint256[] memory);

    /**
     * @dev Grants or revokes permission to `operator` to transfer the caller's tokens, according to `approved`,
     *
     * Emits an {ApprovalForAll} event.
     *
     * Requirements:
     *
     * - `operator` cannot be the caller.
     */
    function setApprovalForAll(address operator, bool approved) external;

    /**
     * @dev Returns true if `operator` is approved to transfer ``account``'s tokens.
     *
     * See {setApprovalForAll}.
     */
    function isApprovedForAll(address account, address operator) external view returns (bool);

    /**
     * @dev Transfers `amount` tokens of token type `id` from `from` to `to`.
     *
     * Emits a {TransferSingle} event.
     *
     * Requirements:
     *
     * - `to` cannot be the zero address.
     * - If the caller is not `from`, it must be have been approved to spend ``from``'s tokens via {setApprovalForAll}.
     * - `from` must have a balance of tokens of type `id` of at least `amount`.
     * - If `to` refers to a smart contract, it must implement {IERC1155Receiver-onERC1155Received} and return the
     * acceptance magic value.
     */
    function safeTransferFrom(
        address from,
        address to,
        uint256 id,
        uint256 amount,
        bytes calldata data
    ) external;

    /**
     * @dev xref:ROOT:erc1155.adoc#batch-operations[Batched] version of {safeTransferFrom}.
     *
     * Emits a {TransferBatch} event.
     *
     * Requirements:
     *
     * - `ids` and `amounts` must have the same length.
     * - If `to` refers to a smart contract, it must implement {IERC1155Receiver-onERC1155BatchReceived} and return the
     * acceptance magic value.
     */
    function safeBatchTransferFrom(
        address from,
        address to,
        uint256[] calldata ids,
        uint256[] calldata amounts,
        bytes calldata data
    ) external;
}


// File contracts/LLDEX/helpers/ImmutableOwner.sol

// SPDX-License-Identifier: MIT

pragma solidity ^0.8.1;

/// @title A helper contract with helper modifiers to allow access to original contract creator only
contract ImmutableOwner {
    address public immutable immutableOwner;

    modifier onlyImmutableOwner() {
        require(msg.sender == immutableOwner, "IO: Access denied");
        _;
    }

    constructor(address _immutableOwner) {
        immutableOwner = _immutableOwner;
    }
}


// File contracts/LLDEX/helpers/ERC1155Proxy.sol

// SPDX-License-Identifier: MIT

pragma solidity ^0.8.1;


/* solhint-disable func-name-mixedcase */

abstract contract ERC1155Proxy is ImmutableOwner {
    constructor() {
        require(
            ERC1155Proxy.func_733NCGU.selector ==
                bytes4(uint32(IERC20.transferFrom.selector) + 4),
            "ERC1155Proxy: bad selector"
        );
    }

    // keccak256("func_733NCGU(address,address,uint256,address,uint256,bytes)") == 0x23b872e1
    function func_733NCGU(
        address from,
        address to,
        uint256 amount,
        IERC1155 token,
        uint256 tokenId,
        bytes calldata data
    ) external onlyImmutableOwner {
        token.safeTransferFrom(from, to, tokenId, amount, data);
    }
}

/* solhint-enable func-name-mixedcase */


// File @openzeppelin/contracts/token/ERC721/IERC721.sol@v4.5.0

// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts v4.4.1 (token/ERC721/IERC721.sol)

pragma solidity ^0.8.0;

/**
 * @dev Required interface of an ERC721 compliant contract.
 */
interface IERC721 is IERC165 {
    /**
     * @dev Emitted when `tokenId` token is transferred from `from` to `to`.
     */
    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);

    /**
     * @dev Emitted when `owner` enables `approved` to manage the `tokenId` token.
     */
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);

    /**
     * @dev Emitted when `owner` enables or disables (`approved`) `operator` to manage all of its assets.
     */
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);

    /**
     * @dev Returns the number of tokens in ``owner``'s account.
     */
    function balanceOf(address owner) external view returns (uint256 balance);

    /**
     * @dev Returns the owner of the `tokenId` token.
     *
     * Requirements:
     *
     * - `tokenId` must exist.
     */
    function ownerOf(uint256 tokenId) external view returns (address owner);

    /**
     * @dev Safely transfers `tokenId` token from `from` to `to`, checking first that contract recipients
     * are aware of the ERC721 protocol to prevent tokens from being forever locked.
     *
     * Requirements:
     *
     * - `from` cannot be the zero address.
     * - `to` cannot be the zero address.
     * - `tokenId` token must exist and be owned by `from`.
     * - If the caller is not `from`, it must be have been allowed to move this token by either {approve} or {setApprovalForAll}.
     * - If `to` refers to a smart contract, it must implement {IERC721Receiver-onERC721Received}, which is called upon a safe transfer.
     *
     * Emits a {Transfer} event.
     */
    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId
    ) external;

    /**
     * @dev Transfers `tokenId` token from `from` to `to`.
     *
     * WARNING: Usage of this method is discouraged, use {safeTransferFrom} whenever possible.
     *
     * Requirements:
     *
     * - `from` cannot be the zero address.
     * - `to` cannot be the zero address.
     * - `tokenId` token must be owned by `from`.
     * - If the caller is not `from`, it must be approved to move this token by either {approve} or {setApprovalForAll}.
     *
     * Emits a {Transfer} event.
     */
    function transferFrom(
        address from,
        address to,
        uint256 tokenId
    ) external;

    /**
     * @dev Gives permission to `to` to transfer `tokenId` token to another account.
     * The approval is cleared when the token is transferred.
     *
     * Only a single account can be approved at a time, so approving the zero address clears previous approvals.
     *
     * Requirements:
     *
     * - The caller must own the token or be an approved operator.
     * - `tokenId` must exist.
     *
     * Emits an {Approval} event.
     */
    function approve(address to, uint256 tokenId) external;

    /**
     * @dev Returns the account approved for `tokenId` token.
     *
     * Requirements:
     *
     * - `tokenId` must exist.
     */
    function getApproved(uint256 tokenId) external view returns (address operator);

    /**
     * @dev Approve or remove `operator` as an operator for the caller.
     * Operators can call {transferFrom} or {safeTransferFrom} for any token owned by the caller.
     *
     * Requirements:
     *
     * - The `operator` cannot be the caller.
     *
     * Emits an {ApprovalForAll} event.
     */
    function setApprovalForAll(address operator, bool _approved) external;

    /**
     * @dev Returns if the `operator` is allowed to manage all of the assets of `owner`.
     *
     * See {setApprovalForAll}
     */
    function isApprovedForAll(address owner, address operator) external view returns (bool);

    /**
     * @dev Safely transfers `tokenId` token from `from` to `to`.
     *
     * Requirements:
     *
     * - `from` cannot be the zero address.
     * - `to` cannot be the zero address.
     * - `tokenId` token must exist and be owned by `from`.
     * - If the caller is not `from`, it must be approved to move this token by either {approve} or {setApprovalForAll}.
     * - If `to` refers to a smart contract, it must implement {IERC721Receiver-onERC721Received}, which is called upon a safe transfer.
     *
     * Emits a {Transfer} event.
     */
    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId,
        bytes calldata data
    ) external;
}


// File contracts/LLDEX/helpers/ERC721Proxy.sol

// SPDX-License-Identifier: MIT

pragma solidity ^0.8.1;


/* solhint-disable func-name-mixedcase */
abstract contract ERC721Proxy is ImmutableOwner {
    constructor() {
        require(
            ERC721Proxy.func_602HzuS.selector == IERC20.transferFrom.selector,
            "ERC721Proxy: bad selector"
        );
    }

    /// @notice Proxy transfer method for `IERC721.transferFrom`. Selector must match `IERC20.transferFrom`.
    /// Note that `uint256` encodes token id unlike `IERC20` which expects amount there.
    // keccak256("func_602HzuS(address,address,uint256,address)") == 0x23b872dd (IERC20.transferFrom)
    function func_602HzuS(
        address from,
        address to,
        uint256 tokenId,
        IERC721 token
    ) external onlyImmutableOwner {
        token.transferFrom(from, to, tokenId);
    }
}

/* solhint-enable func-name-mixedcase */


// File contracts/LLDEX/helpers/FullMath.sol

// SPDX-License-Identifier: MIT

pragma solidity ^0.8.1;

// solhint-disable no-inline-assembly
contract FullMath {
    using SafeMath for uint256;

    /// @notice Calculates floor(a×b÷denominator) with full precision. Throws if result overflows a uint256 or denominator == 0
    /// @param a The multiplicand
    /// @param b The multiplier
    /// @param denominator The divisor
    /// @return result The 256-bit result
    /// @dev Credit to Remco Bloemen under MIT license https://xn--2-umb.com/21/muldiv
    function mulDiv(
        uint256 a,
        uint256 b,
        uint256 denominator
    ) internal pure returns (uint256 result) {
        // 512-bit multiply [prod1 prod0] = a * b
        // Compute the product mod 2**256 and mod 2**256 - 1
        // then use the Chinese Remainder Theorem to reconstruct
        // the 512 bit result. The result is stored in two 256
        // variables such that product = prod1 * 2**256 + prod0
        uint256 prod0; // Least significant 256 bits of the product
        uint256 prod1; // Most significant 256 bits of the product
        assembly {
            let mm := mulmod(a, b, not(0))
            prod0 := mul(a, b)
            prod1 := sub(sub(mm, prod0), lt(mm, prod0))
        }

        // Handle non-overflow cases, 256 by 256 division
        if (prod1 == 0) {
            require(denominator > 0, "FullMath: ID 0x1");
            assembly {
                result := div(prod0, denominator)
            }
            return result;
        }

        // Make sure the result is less than 2**256.
        // Also prevents denominator == 0
        require(denominator > prod1, "FullMath: ID 0x2");

        ///////////////////////////////////////////////
        // 512 by 256 division.
        ///////////////////////////////////////////////

        // Make division exact by subtracting the remainder from [prod1 prod0]
        // Compute remainder using mulmod
        uint256 remainder;
        assembly {
            remainder := mulmod(a, b, denominator)
        }
        // Subtract 256 bit number from 512 bit number
        assembly {
            prod1 := sub(prod1, gt(remainder, prod0))
            prod0 := sub(prod0, remainder)
        }

        // Factor powers of two out of denominator
        // Compute largest power of two divisor of denominator.
        // Always >= 1.
        unchecked {
            uint256 twos = (type(uint256).max - denominator + 1) & denominator;
            // Divide denominator by power of two
            assembly {
                denominator := div(denominator, twos)
            }

            // Divide [prod1 prod0] by the factors of two
            assembly {
                prod0 := div(prod0, twos)
            }
            // Shift in bits from prod1 into prod0. For this we need
            // to flip `twos` such that it is 2**256 / twos.
            // If twos is zero, then it becomes one
            assembly {
                twos := add(div(sub(0, twos), twos), 1)
            }
            prod0 |= prod1 * twos;

            // Invert denominator mod 2**256
            // Now that denominator is an odd number, it has an inverse
            // modulo 2**256 such that denominator * inv = 1 mod 2**256.
            // Compute the inverse by starting with a seed that is correct
            // correct for four bits. That is, denominator * inv = 1 mod 2**4
            uint256 inv = (3 * denominator) ^ 2;
            // Now use Newton-Raphson iteration to improve the precision.
            // Thanks to Hensel's lifting lemma, this also works in modular
            // arithmetic, doubling the correct bits in each step.
            inv *= 2 - denominator * inv; // inverse mod 2**8
            inv *= 2 - denominator * inv; // inverse mod 2**16
            inv *= 2 - denominator * inv; // inverse mod 2**32
            inv *= 2 - denominator * inv; // inverse mod 2**64
            inv *= 2 - denominator * inv; // inverse mod 2**128
            inv *= 2 - denominator * inv; // inverse mod 2**256

            // Because the division is now exact we can divide by multiplying
            // with the modular inverse of denominator. This will give us the
            // correct result modulo 2**256. Since the precoditions guarantee
            // that the outcome is less than 2**256, this is the final result.
            // We don't need to compute the high bits of the result and prod1
            // is no longer required.
            result = prod0 * inv;
            return result;
        }
    }
}


// File contracts/LLDEX/helpers/SplitBonus.sol

// SPDX-License-Identifier: MIT

pragma solidity ^0.8.1;


contract SplitBonus is FullMath {
    // solhint-disable var-name-mixedcase
    uint256 private _SPLIT_BONUS = 0;
    uint256 private _SPLIT_SCALE = 0;

    uint256 private constant _SPLIT_SCALE_MIN = 100;
    uint256 private constant _SPLIT_SCALE_MAX = 100000;

    constructor(uint256 splitBonus, uint256 splitScale) {
        require(splitScale >= _SPLIT_SCALE_MIN, "SB: Scale too low");
        require(splitScale <= _SPLIT_SCALE_MAX, "SB: Scale too high");
        require(splitBonus <= splitScale, "SB: Invalid bonus value");

        _SPLIT_BONUS = splitBonus;
        _SPLIT_SCALE = splitScale;
    }

    function _calculateBonus(uint256 amount) internal view returns(uint256 bonusAmount, uint256 amountLeft) {
        bonusAmount = FullMath.mulDiv(amount, _SPLIT_BONUS, _SPLIT_SCALE);
        amountLeft = amount - bonusAmount;
    }

    function getSplitBonus() public view returns (uint256 bonus) {
        return _SPLIT_BONUS;
    }

    function getSplitScale() public view returns (uint256 scale) {
        return _SPLIT_SCALE;
    }

    function _setSplitBonus(uint256 amount) internal {
        require(amount <= _SPLIT_SCALE, "SB: Invalid bonus value");
        
        _SPLIT_BONUS = amount;
    }
}


// File contracts/LLDEX/interfaces/IRFQOrder.sol

// SPDX-License-Identifier: MIT

pragma solidity ^0.8.1;

interface IRFQOrder {
    event OrderFilledRFQ(bytes32 orderHash, uint256 takingAmount, uint256 makingAmount);

    struct OrderRFQ {
        uint256 info;
        uint256 feeAmount;
        address takerAsset;
        address makerAsset;
        address feeTokenAddress;
        address frontendAddress;
        bytes takerAssetData;
        bytes makerAssetData;
    }

    struct OrderRFQAmounts {
        uint256 takingAmount;
        uint256 makingAmount;
    }

    struct OrderRFQCallbackInfo {
        address takerAsset;
        address makerAsset;
        uint256 takingAmount;
        uint256 makingAmount;
    }

    /// @notice Cancels order's quote
    /// @param orderInfo order info containing timestamp and order id
    function cancelOrderRFQ(uint256 orderInfo) external;

    /// @notice Fills order's quote, fully or partially (whichever is possible)
    /// @param order Order quote to fill
    /// @param signature Signature to confirm quote ownership
    /// @param takingAmount Taking amount
    /// @param makingAmount Making amount
    /// @return amounts - filled taking and making amounts
    function fillOrderRFQ(
        OrderRFQ memory order,
        bytes calldata signature,
        uint256 takingAmount,
        uint256 makingAmount
    ) external returns (OrderRFQAmounts memory amounts);

    /// @notice Fills order's quote, fully or partially (whichever is possible) and calls external contract function
    /// @param order Order quote to fill
    /// @param signature Signature to confirm quote ownership
    /// @param takingAmount Taking amount
    /// @param makingAmount Making amount
    /// @param receiver Address of contract that will receive the call after successful validation of RFQ order and transfer from taker to maker
    /// @param data external call data
    /// @return amounts - filled taking and making amounts
    function fillOrderRFQCallPeriphery(
        OrderRFQ memory order,
        bytes calldata signature,
        uint256 takingAmount,
        uint256 makingAmount,
        address receiver,
        bytes calldata data
    ) external returns (OrderRFQAmounts memory amounts, bytes memory result);
}


// File contracts/LLDEX/interfaces/ITradingSession.sol

// SPDX-License-Identifier: MIT

pragma solidity ^0.8.1;

interface ITradingSession {
    /**
     * @notice Emitted on successful session creation
     * @param creator address of wallet creating session
     * @param sessionKey public key of session
     * @param expirationTime session expiration time
     */
    event SessionCreated(
        address indexed creator,
        address indexed sessionKey,
        uint256 expirationTime
    );

    /**
     * @notice Emitted on successful session creation
     * @param sender address of wallet updating session
     * @param sessionKey public key of session
     * @param expirationTime session expiration time
     */
    event SessionUpdated(
        address indexed sender,
        address indexed sessionKey,
        uint256 expirationTime
    );

    /**
     * @notice Emitted on successful session creation
     * @param sender address of wallet updating session
     * @param sessionKey public key of session
     */
    event SessionTerminated(address indexed sender, address indexed sessionKey);

    // Session status returned in createOrUpdateSession
    enum SessionStatus {
        Created,
        Updated
    }

    // Session data
    struct Session {
        // Address of creator
        address creator;
        // Public key of session
        address sessionKey;
        // Session expiration time (unix timestamp)
        uint256 expirationTime;
        // Number of transactions made in this session
        uint256 txCount;
    }

    /**
     * @notice Creates or updates session that lets maker and taker to trade without signing messages through wallet, ie. Metamask
     * @param sessionKey public key of session
     * @param expirationTime expiration time in unix seconds timestamp
     * @return session status, either Created or Updated
     */
    function createOrUpdateSession(address sessionKey, uint256 expirationTime)
        external
        returns (SessionStatus);

    /**
     * @notice Terminates active session
     * @dev sets session expiration timestamp to zero
     */
    function endSession() external;

    /**
     * @notice Returns expiration unix timestamp of @owner session
     * @param owner owner of the session
     * @return expirationTime - unix expiration timestamp in seconds
     */
    function sessionExpirationTime(address owner)
        external
        view
        returns (uint256 expirationTime);

    /**
     * @notice Returns session data
     * @param owner owner of the session
     * @return creator - session creator, owner
     * @return sessionKey - session public key
     * @return expirationTime - session expiration unix timestamp, might be zero if it was terminated
     * @return txCount - number of transactions made during session
     */
    function session(address owner)
        external
        view
        returns (
            address creator,
            address sessionKey,
            uint256 expirationTime,
            uint256 txCount
        );
}


// File contracts/LLDEX/interfaces/IBalanceAccessor.sol

// SPDX-License-Identifier: MIT

pragma solidity ^0.8.1;

interface IBalanceAccessor {
    /**
     * @notice Emitted on successful deposit of token
     * @param sender address of wallet depositing token
     * @param token address of deposited token
     * @param amount deposit amount
     * @param balance sender balance after deposit
     */
    event TokenDeposited(
        address indexed sender,
        address indexed token,
        uint256 amount,
        uint256 balance
    );

    /**
     * @notice Emitted on successful withdrawn of token
     * @param sender address of wallet withdrawing token
     * @param token address of withdrawn token
     * @param amount withdraw amount
     * @param balance sender balance after withdraw
     */
    event TokenWithdrawn(
        address indexed sender,
        address indexed token,
        uint256 amount,
        uint256 balance
    );

    /**
     * @notice Emitted on successful transfer of token
     * @param from address of wallet transfering token
     * @param recipient address of token recipient
     * @param token address of transfered token
     * @param amount transfer amount
     * @param balance sender balance after transfer
     */
    event TokenTransfered(
        address indexed from,
        address indexed recipient,
        address indexed token,
        uint256 amount,
        uint256 balance
    );

    /**
     * @notice Emitted on successful transfer of token - split between taker and frontend
     * @param from address of wallet that transfers token
     * @param recipient address of first recipient
     * @param splitTo address of second recipient
     * @param token address of deposited token
     * @param splitPercentage percentage used to split @amount between @recipient and @splitTo
     * @param amount deposit amount
     * @param balance sender balance after deposit
     */
    event SplitTokenTransfered(
        address indexed from,
        address indexed recipient,
        address indexed splitTo,
        address token, // Due to limitations only three event's arguments can be indexed
        uint256 splitPercentage,
        uint256 amount,
        uint256 balance
    );

    // Balance data
    struct Balance {
        // Balance in LLDEX token
        uint256 balance;
    }

    /**
     * @notice Deposits given token of frontend to the LLDEX contract and stores the balance information
     * @param token address of token to deposit, depositing wallet must give an allowance to the LLDEX contract for given @amount
     * @param amount amount of tokens to deposit
     * @return balance after depositing the tokens
     */
    function depositToken(address token, uint256 amount) external returns (uint256);

    /**
     * @notice Withdraws given token of frontend from the LLDEX contract
     * @param token address of token to withdraw
     * @param amount amount of tokens to withdraw
     * @return balance after withdrawing the tokens
     */
    function withdrawToken(address token, uint256 amount) external returns (uint256);

    /**
     * @notice Returns balance of token available for use in LLDEX
     * @param token address of token to check balance of
     * @return balance of given token
     */
    function balance(address token) external returns (uint256);
}


// File contracts/LLDEX/interfaces/IPeripheryCallback.sol

// SPDX-License-Identifier: MIT

pragma solidity ^0.8.1;

/// @title Callback for IRFQOrder#fillOrderRFQCallPeriphery
/// @notice Contract that calls IRFQOrder#fillOrderRFQCallPeriphery must implement this interface
interface IPeripheryCallback {
    /**
     * @notice Called to IPeripheryCallback(receiver).lldexPeripheryCallback after validating maker and taker session, order signature and transfering tokens from taker to maker
     * @dev The caller of this method must be checked to be a LLDEXProtocol
     * @param maker Address of the maker that fills the RFQOrder
     * @param info Info about the order containing token addresses and amounts
     * @param payload extra data passed through by the caller
     * @return Result data
     */
    function lldexPeripheryCallback(
        address maker,
        IRFQOrder.OrderRFQCallbackInfo calldata info,
        bytes memory payload
    ) external returns (bytes memory);
}


// File contracts/LLDEX/libraries/UncheckedAddress.sol

// SPDX-License-Identifier: MIT

pragma solidity ^0.8.1;

library UncheckedAddress {
    function uncheckedFunctionCall(
        address target,
        bytes memory data,
        string memory errorMessage
    ) internal returns (bytes memory) {
        return uncheckedFunctionCallWithValue(target, data, 0, errorMessage);
    }

    function uncheckedFunctionCallWithValue(
        address target,
        bytes memory data,
        uint256 value,
        string memory errorMessage
    ) internal returns (bytes memory) {
        require(address(this).balance >= value, "UA: insufficient balance");
        // Check turned off:
        // require(isContract(target), "Address: call to non-contract");

        // solhint-disable-next-line avoid-low-level-calls
        (bool success, bytes memory returndata) = target.call{value: value}(data);
        return _verifyCallResult(success, returndata, errorMessage);
    }

    //noinspection NoReturn
    function _verifyCallResult(
        bool success,
        bytes memory returndata,
        string memory errorMessage
    ) private pure returns (bytes memory) {
        if (success) {
            return returndata;
        } else {
            // Look for revert reason and bubble it up if present
            if (returndata.length > 0) {
                // The easiest way to bubble the revert reason is using memory via assembly

                // solhint-disable-next-line no-inline-assembly
                assembly {
                    revert(add(32, returndata), mload(returndata))
                }
            } else {
                revert(errorMessage);
            }
        }
    }
}


// File contracts/LLDEX/libraries/ArgumentsDecoder.sol

// SPDX-License-Identifier: MIT

pragma solidity ^0.8.1;

library ArgumentsDecoder {
    function decodeSelector(bytes memory data) internal pure returns (bytes4 selector) {
        assembly // solhint-disable-line no-inline-assembly
        {
            selector := mload(add(data, 0x20))
        }
    }

    function decodeAddress(bytes memory data, uint256 argumentIndex)
        internal
        pure
        returns (address account)
    {
        assembly // solhint-disable-line no-inline-assembly
        {
            account := mload(add(add(data, 0x24), mul(argumentIndex, 0x20)))
        }
    }

    function decodeUint256(bytes memory data, uint256 argumentIndex)
        internal
        pure
        returns (uint256 value)
    {
        assembly // solhint-disable-line no-inline-assembly
        {
            value := mload(add(add(data, 0x24), mul(argumentIndex, 0x20)))
        }
    }

    function patchAddress(
        bytes memory data,
        uint256 argumentIndex,
        address account
    ) internal pure {
        assembly // solhint-disable-line no-inline-assembly
        {
            mstore(add(add(data, 0x24), mul(argumentIndex, 0x20)), account)
        }
    }

    function patchUint256(
        bytes memory data,
        uint256 argumentIndex,
        uint256 value
    ) internal pure {
        assembly // solhint-disable-line no-inline-assembly
        {
            mstore(add(add(data, 0x24), mul(argumentIndex, 0x20)), value)
        }
    }
}


// File contracts/LLDEX/LLDEXProtocol.sol

// SPDX-License-Identifier: MIT

pragma solidity ^0.8.1;
















/*
    Abbreviations
    TA - Taker asset
    MA - Maker asset
    TAD - Taker asset data
    MAD - Maker asset data
    SK - Session key
*/

// @title LLDEX Protocol v1
contract LLDEXProtocol is
    EIP712("1inch Limit Order Protocol", "1"),
    ImmutableOwner(address(this)),
    MutableOwner(msg.sender),
    SplitBonus,
    ERC1155Proxy,
    ERC721Proxy,
    ReentrancyGuard,
    IRFQOrder,
    ITradingSession,
    IBalanceAccessor
{
    using SafeMath for uint256;
    using SafeERC20 for IERC20;
    using UncheckedAddress for address;
    using ArgumentsDecoder for bytes;

    modifier makerSessionNotExpired(OrderRFQ memory order, bytes memory signature) {
        // Require maker session to be valid, ie. not expired
        address maker = order.makerAssetData.decodeAddress(_FROM_INDEX);
        require(
            _sessions[maker].expirationTime > block.timestamp,
            "LLDEX: expired maker session"
        );

        _;
    }

    bytes32 public constant LIMIT_ORDER_RFQ_TYPEHASH =
        keccak256(
            "OrderRFQ(uint256 info,uint256 feeAmount,address takerAsset,address makerAsset,address feeTokenAddress,address frontendAddress,bytes takerAssetData,bytes makerAssetData)"
        );

    // solhint-disable-next-line var-name-mixedcase
    bytes4 private immutable _MAX_SELECTOR = bytes4(uint32(IERC20.transferFrom.selector) + 10);

    uint256 private constant _FROM_INDEX = 0;
    uint256 private constant _TO_INDEX = 1;
    uint256 private constant _AMOUNT_INDEX = 2;

    mapping(address => mapping(uint256 => uint256)) private _invalidator;

    // Mapping of balance owner (either maker or frontend) to amount
    mapping(address => mapping(address => Balance)) private _balances;

    // Mapping of session owner to session
    mapping(address => Session) private _sessions;

    constructor(uint256 splitBonus) 
        SplitBonus(splitBonus, 100)
    // solhint-disable-next-line no-empty-blocks
    {}

    // solhint-disable-next-line func-name-mixedcase
    function DOMAIN_SEPARATOR() external view returns (bytes32) {
        return _domainSeparatorV4();
    }

    function transferOwnership(address to)
        external
        onlyOwner
        returns (address oldOwner, address newOwner)
    {
        _validateTo(to);
        _mutateOwner(to);
        return (msg.sender, to);
    }

    function setReferralBonus(uint256 bonus)
        external
        onlyOwner
    {
        SplitBonus._setSplitBonus(bonus);
    }

    function _validateTo(address to) internal view {
        require(to != address(0), "LLDEX: invalid to address 0x1");
        require(to != address(this), "LLDEX: invalid to address 0x2");
        require(to != msg.sender, "LLDEX: invalid to address 0x3");
    }

    /// @notice Returns bitmask for double-spend invalidators based on lowest byte of order.info and filled quotes
    /// @return Result Each bit represents whenever corresponding quote was filled
    function invalidatorForOrderRFQ(address taker, uint256 slot)
        external
        view
        returns (uint256)
    {
        return _invalidator[taker][slot];
    }

    function cancelOrderRFQ(uint256 orderInfo) external override {
        _invalidator[msg.sender][uint64(orderInfo) >> 8] |= (1 << (orderInfo & 0xff));
    }

    function fillOrderRFQ(
        OrderRFQ memory order,
        bytes calldata signature,
        uint256 takingAmount,
        uint256 makingAmount
    )
        external
        override
        makerSessionNotExpired(order, signature)
        returns (OrderRFQAmounts memory amounts)
    {
        amounts = OrderRFQAmounts({takingAmount: takingAmount, makingAmount: makingAmount});

        fillOrderRFQTo(order, amounts, signature, msg.sender);
    }

    function fillOrderRFQCallPeriphery(
        OrderRFQ memory order,
        bytes calldata signature,
        uint256 takingAmount,
        uint256 makingAmount,
        address receiver,
        bytes calldata data
    )
        external
        override
        makerSessionNotExpired(order, signature)
        returns (OrderRFQAmounts memory amounts, bytes memory result)
    {
        // Contract receiving external function call cannot be empty
        require(receiver != address(0), "LLDEX: zero receiver address");
        // And the address cannot be the address of LLDEX contract
        require(receiver != address(this), "LLDEX: invalid receiver address");

        amounts = OrderRFQAmounts({takingAmount: takingAmount, makingAmount: makingAmount});

        // Validate and fill order, transfer assets from taker to maker then call external function on receiver
        // and finally transfer assets from maker to taker and emit OrderFilledRFQ event
        result = fillOrderRFQToWithCallback(order, amounts, signature, receiver, data);
    }

    function fillOrderRFQToWithCallback(
        OrderRFQ memory order,
        OrderRFQAmounts memory amounts,
        bytes calldata signature,
        address receiver,
        bytes calldata data
    ) private returns (bytes memory result) {
        // Validate order, check signature, calculate hash of the order
        bytes32 orderHash = _validateRFQOrder(order, amounts, signature);

        // Transfer Taker => Maker
        _callTakerAssetTransferFrom(
            order.takerAsset,
            order.takerAssetData,
            msg.sender,
            amounts.takingAmount
        );

        // Address of maker that fills this RFQ order
        address orderMakerAddress = order.makerAssetData.decodeAddress(_FROM_INDEX);

        // Callback info containing tokens and amounts
        OrderRFQCallbackInfo memory orderInfo = OrderRFQCallbackInfo({
            takerAsset: order.takerAsset,
            makerAsset: order.makerAsset,
            takingAmount: amounts.takingAmount,
            makingAmount: amounts.makingAmount
        });

        // Call provided receiver using peripery callback
        result = IPeripheryCallback(receiver).lldexPeripheryCallback(
            orderMakerAddress,
            orderInfo,
            data
        );

        // Transfer Maker => Taker
        _callMakerAssetTransferFrom(
            order.makerAsset,
            order.makerAssetData,
            amounts.makingAmount
        );

        _finishRFQOrder(order, amounts, orderHash);
    }

    function fillOrderRFQTo(
        OrderRFQ memory order,
        OrderRFQAmounts memory amounts,
        bytes calldata signature,
        address target
    ) private returns (uint256, uint256) {
        bytes32 orderHash = _validateRFQOrder(order, amounts, signature);

        // Transfer Taker => Maker
        _callTakerAssetTransferFrom(
            order.takerAsset,
            order.takerAssetData,
            target,
            amounts.takingAmount
        );

        // Transfer Maker => Taker
        _callMakerAssetTransferFrom(
            order.makerAsset,
            order.makerAssetData,
            amounts.makingAmount
        );

        _finishRFQOrder(order, amounts, orderHash);

        return (amounts.takingAmount, amounts.makingAmount);
    }

    function _validateRFQOrder(
        OrderRFQ memory order,
        OrderRFQAmounts memory amounts,
        bytes calldata signature
    ) internal returns (bytes32 orderHash) {
        // Check time expiration
        uint256 expiration = uint128(order.info) >> 64;
        require(expiration == 0 || block.timestamp <= expiration, "LLDEX: order expired"); // solhint-disable-line not-rely-on-time

        {
            // Stack too deep
            // Validate double spend
            address taker = order.takerAssetData.decodeAddress(_FROM_INDEX);
            uint256 invalidatorSlot = uint64(order.info) >> 8;
            uint256 invalidatorBit = 1 << uint8(order.info);
            uint256 invalidator = _invalidator[taker][invalidatorSlot];
            require(invalidator & invalidatorBit == 0, "LLDEX: already filled");
            _invalidator[taker][invalidatorSlot] = invalidator | invalidatorBit;
        }

        // Compute partial fill if needed
        uint256 orderTakerAmount = order.takerAssetData.decodeUint256(_AMOUNT_INDEX);
        uint256 orderMakerAmount = order.makerAssetData.decodeUint256(_AMOUNT_INDEX);

        require(
            orderTakerAmount > 0 && orderMakerAmount > 0,
            "LLDEX: one of order amounts is 0"
        );

        if (amounts.makingAmount == 0 && amounts.takingAmount == 0) {
            // Fill whole order
            amounts.takingAmount = orderTakerAmount;
            amounts.makingAmount = orderMakerAmount;
        } else if (
            amounts.takingAmount != 0 &&
            (amounts.makingAmount >
                (amounts.takingAmount * orderMakerAmount + orderTakerAmount - 1) /
                    orderTakerAmount)
        ) // solhint-disable-next-line no-empty-blocks
        {
            // Partial fill with positive slippage
        } else if (amounts.makingAmount == 0) {
            amounts.makingAmount =
                (amounts.takingAmount * orderMakerAmount + orderTakerAmount - 1) /
                orderTakerAmount;
        } else {
            revert("LLDEX: one amount should be 0");
        }

        require(
            amounts.takingAmount > 0 && amounts.makingAmount > 0,
            "LLDEX: cannot swap 0 amount"
        );

        require(amounts.takingAmount <= orderTakerAmount, "LLDEX: taking amount exceeded");

        // Validate order
        orderHash = _hash(order);
        _validate(order.takerAssetData, order.makerAssetData, signature, orderHash);
    }

    function _finishRFQOrder(
        OrderRFQ memory order,
        OrderRFQAmounts memory amounts,
        bytes32 orderHash
    ) internal {
        if (order.frontendAddress != address(0) && order.feeAmount != 0) {
            // Withdraw fee
            _withdrawFee(
                order.makerAssetData.decodeAddress(_FROM_INDEX),
                order.takerAssetData.decodeAddress(_FROM_INDEX),
                order.frontendAddress,
                order.feeTokenAddress,
                order.feeAmount
            );
        }

        _updateSessionTransactions(order.takerAssetData, order.makerAssetData);

        emit OrderFilledRFQ(orderHash, amounts.takingAmount, amounts.makingAmount);
    }

    function createOrUpdateSession(address sessionKey, uint256 expirationTime)
        external
        override
        nonReentrant
        returns (SessionStatus)
    {
        _validateSessionKey(sessionKey);
        require(expirationTime >= block.timestamp, "LLDEX: invalid expiration time");

        // Update current session if session slot exists
        if (_sessions[msg.sender].sessionKey != address(0)) {
            _sessions[msg.sender].expirationTime = expirationTime;

            // Update session key if its different from the storage key
            if (_sessions[msg.sender].sessionKey != sessionKey) {
                _sessions[msg.sender].sessionKey = sessionKey;
            }

            emit SessionUpdated(msg.sender, _sessions[msg.sender].sessionKey, expirationTime);

            return SessionStatus.Updated;
        } else {
            _sessions[msg.sender] = Session({
                creator: address(msg.sender),
                sessionKey: sessionKey,
                expirationTime: expirationTime,
                txCount: 0
            });

            emit SessionCreated(msg.sender, _sessions[msg.sender].sessionKey, expirationTime);
        }

        return SessionStatus.Created;
    }

    function endSession() external override nonReentrant {
        _validateSessionKey(_sessions[msg.sender].sessionKey);
        require(_sessions[msg.sender].expirationTime != 0, "LLDEX: invalid session");
        require(
            _sessions[msg.sender].expirationTime >= block.timestamp,
            "LLDEX: session expired"
        );

        _sessions[msg.sender].expirationTime = 0;

        emit SessionTerminated(msg.sender, _sessions[msg.sender].sessionKey);
    }

    function sessionExpirationTime(address owner)
        external
        view
        override
        returns (uint256 expirationTime)
    {
        return _sessions[owner].expirationTime;
    }

    function session(address owner)
        external
        view
        override
        returns (
            address creator,
            address sessionKey,
            uint256 expirationTime,
            uint256 txCount
        )
    {
        return (
            _sessions[owner].creator,
            _sessions[owner].sessionKey,
            _sessions[owner].expirationTime,
            _sessions[owner].txCount
        );
    }

    function _validateSessionKey(address sessionKey) internal view {
        require(sessionKey != address(0), "LLDEX: SK is empty");
        require(sessionKey != address(this), "LLDEX: invalid SK");
        require(sessionKey != msg.sender, "LLDEX: invalid SK - sender");
    }

    function _hash(OrderRFQ memory order) private view returns (bytes32) {
        return
            _hashTypedDataV4(
                keccak256(
                    abi.encode(
                        LIMIT_ORDER_RFQ_TYPEHASH,
                        order.info,
                        order.feeAmount,
                        order.takerAsset,
                        order.makerAsset,
                        order.feeTokenAddress,
                        order.frontendAddress,
                        keccak256(order.takerAssetData),
                        keccak256(order.makerAssetData)
                    )
                )
            );
    }

    function _validate(
        bytes memory takerAssetData,
        bytes memory makerAssetData,
        bytes memory signature,
        bytes32 orderHash
    ) private view {
        require(takerAssetData.length >= 100, "LLDEX: bad TAD length");
        require(makerAssetData.length >= 100, "LLDEX: bad MAD length");
        bytes4 takerSelector = takerAssetData.decodeSelector();
        bytes4 makerSelector = makerAssetData.decodeSelector();
        require(
            takerSelector >= IERC20.transferFrom.selector && takerSelector <= _MAX_SELECTOR,
            "LLDEX: bad TAD selector"
        );
        require(
            makerSelector >= IERC20.transferFrom.selector && makerSelector <= _MAX_SELECTOR,
            "LLDEX: bad MAD selector"
        );

        address taker = address(takerAssetData.decodeAddress(_FROM_INDEX));
        if (_sessions[taker].expirationTime > block.timestamp) {
            // Session not expired

            require(
                SignatureChecker.isValidSignatureNow(
                    _sessions[taker].sessionKey,
                    orderHash,
                    signature
                ),
                "LLDEX: SNE bad signature"
            );
        } else {
            // Sesssion is expired - checking if market taker has signed the request with it's own private key (used to save gas on the market taker side)

            require(
                SignatureChecker.isValidSignatureNow(taker, orderHash, signature),
                "LLDEX: SE bad signature"
            );
        }
    }

    function _callTakerAssetTransferFrom(
        address takerAsset,
        bytes memory takerAssetData,
        address maker,
        uint256 takingAmount
    ) private {
        // Patch receiver or validate private order
        address orderMakerAddress = takerAssetData.decodeAddress(_TO_INDEX);

        if (orderMakerAddress != address(0)) {
            require(
                msg.sender == _sessions[orderMakerAddress].sessionKey,
                "LLDEX: private order"
            );
        }

        if (orderMakerAddress != maker) {
            takerAssetData.patchAddress(
                _TO_INDEX,
                /*_sessionOwners[msg.sender]*/
                orderMakerAddress
            );
        }

        // Patch taker amount
        takerAssetData.patchUint256(_AMOUNT_INDEX, takingAmount);

        require(
            takerAsset != address(0) &&
                takerAsset != 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE,
            "LLDEX: raw ETH is not supported"
        );

        // Transfer asset from taker to maker
        bytes memory result = takerAsset.uncheckedFunctionCall(
            takerAssetData,
            "LLDEX: takerAsset.call failed"
        );
        if (result.length > 0) {
            require(abi.decode(result, (bool)), "LLDEX: TA call bad result");
        }
    }

    function _callMakerAssetTransferFrom(
        address makerAsset,
        bytes memory makerAssetData,
        uint256 makingAmount
    ) private {
        address orderMakerAddress = makerAssetData.decodeAddress(_FROM_INDEX);

        if (orderMakerAddress != address(0)) {
            require(
                msg.sender == _sessions[orderMakerAddress].sessionKey,
                "LLDEX: private order"
            );
        }

        // Patch maker amount
        makerAssetData.patchUint256(_AMOUNT_INDEX, makingAmount);

        require(
            makerAsset != address(0) &&
                makerAsset != 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE,
            "LLDEX: raw ETH is not supported"
        );

        // Transfer asset from maker to taker
        bytes memory result = makerAsset.uncheckedFunctionCall(
            makerAssetData,
            "LLDEX: makerAsset.call failed"
        );
        if (result.length > 0) {
            require(abi.decode(result, (bool)), "LLDEX: MA call bad result");
        }
    }

    function _updateSessionTransactions(
        bytes memory takerAssetData,
        bytes memory makerAssetData
    ) internal returns (uint256 txCountTaker, uint256 txCountMaker) {
        address orderTakerAddress = takerAssetData.decodeAddress(_TO_INDEX);
        require(orderTakerAddress != address(0), "LLDEX: maker address is empty");

        address orderMakerAddress = makerAssetData.decodeAddress(_TO_INDEX);
        require(orderMakerAddress != address(0), "LLDEX: taker address is empty");

        txCountTaker = ++_sessions[orderTakerAddress].txCount;
        txCountMaker = ++_sessions[orderMakerAddress].txCount;
    }

    function _withdrawFee(
        address maker,
        address taker,
        address frontend,
        address feeToken,
        uint256 feeAmount
    ) internal {
        require(frontend != taker, "LLDEX: invalid frontend 0");
        require(frontend != maker, "LLDEX: invalid frontend 1");
        require(feeToken != address(0), "LLDEX: fee token empty");
        require(feeToken != address(this), "LLDEX: invalid fee token address");
        require(
            _balances[maker][feeToken].balance >= feeAmount,
            "LLDEX: insufficient maker fee"
        );

        _balances[maker][feeToken].balance -= feeAmount;
        if (SplitBonus.getSplitBonus() > 0) {
            (uint256 bonusAmount, uint256 amountLeft) = SplitBonus._calculateBonus(feeAmount);

            _balances[frontend][feeToken].balance += bonusAmount;
            _balances[mutableOwner()][feeToken].balance += amountLeft;

            emit SplitTokenTransfered(
                maker, 
                taker, 
                frontend, 
                feeToken, 
                SplitBonus.getSplitBonus(), 
                feeAmount, 
                _balances[maker][feeToken].balance
            );
        } else {
            _balances[frontend][feeToken].balance += feeAmount;

            emit TokenTransfered(
                maker, 
                frontend, 
                feeToken, 
                feeAmount, 
                _balances[maker][feeToken].balance
            );
        }
    }

    function depositToken(address token, uint256 amount)
        external
        override
        nonReentrant
        returns (uint256)
    {
        require(token != address(0), "LLDEX: empty fee token");
        require(token != address(this), "LLDEX: invalid fee token");
        require(amount > 0, "LLDEX: amount is 0");

        IERC20 tokenERC20 = IERC20(token);
        tokenERC20.safeTransferFrom(msg.sender, address(this), amount);

        _balances[msg.sender][token].balance += amount;
        return _balances[msg.sender][token].balance;
    }

    function withdrawToken(address token, uint256 amount)
        external
        override
        nonReentrant
        returns (uint256)
    {
        require(token != address(0), "LLDEX: empty fee token");
        require(token != address(this), "LLDEX: invalid fee token");
        require(amount > 0, "LLDEX: amount is 0");
        require(_balances[msg.sender][token].balance >= amount, "LLDEX: insufficient balance");

        IERC20 tokenERC20 = IERC20(token);
        tokenERC20.safeTransfer(msg.sender, amount);

        _balances[msg.sender][token].balance -= amount;

        return _balances[msg.sender][token].balance;
    }

    function balance(address token) external view override returns (uint256) {
        return _balances[msg.sender][token].balance;
    }
}
