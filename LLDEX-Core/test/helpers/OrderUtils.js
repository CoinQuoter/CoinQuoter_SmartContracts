const { EIP712Domain } = require('./eip712');

const OrderRFQ = [
    { name: 'info', type: 'uint256' },
    { name: 'feeAmount', type: 'uint256' },
    { name: 'takerAsset', type: 'address' },
    { name: 'makerAsset', type: 'address' },
    { name: 'feeTokenAddress', type: 'address' },
    { name: 'frontendAddress', type: 'address' },
    { name: 'takerAssetData', type: 'uint256' },
    { name: 'makerAssetData', type: 'uint256' },
];

const name = '1inch Limit Order Protocol';
const version = '1';

function buildOrderRFQData (chainId, verifyingContract, order) {
    return {
        primaryType: 'OrderRFQ',
        types: { EIP712Domain, OrderRFQ },
        domain: { name, version, chainId, verifyingContract },
        message: order,
    };
}

module.exports = {
    buildOrderRFQData,
    name,
    version,
};