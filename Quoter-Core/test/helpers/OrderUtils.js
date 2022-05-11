const { EIP712Domain } = require('./eip712');
const { BN } = require('@openzeppelin/test-helpers');

const OrderRFQ = [
    { name: 'info', type: 'uint256' },
    { name: 'feeAmount', type: 'uint256' },
    { name: 'takerAsset', type: 'address' },
    { name: 'makerAsset', type: 'address' },
    { name: 'feeTokenAddress', type: 'address' },
    { name: 'frontendAddress', type: 'address' },
    { name: 'takerAssetData', type: 'bytes' },
    { name: 'makerAssetData', type: 'bytes' },
];

const name = 'Quoter Protocol';
const version = '1';

function buildOrderRFQData (chainId, verifyingContract, order) {
    return {
        primaryType: 'OrderRFQ',
        types: { EIP712Domain, OrderRFQ },
        domain: { name, version, chainId, verifyingContract },
        message: order,
    };
}

function generateRFQOrderInfo(
    id,
    expiresInTimestamp
) {
    return ((BigInt(expiresInTimestamp) << BigInt(64)) | BigInt(id)).toString(
        10
    );
}

module.exports = {
    buildOrderRFQData,
    generateRFQOrderInfo,
    name,
    version,
};