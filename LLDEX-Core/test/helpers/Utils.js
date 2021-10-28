const { BN, ether } = require('@openzeppelin/test-helpers');

function price (val) {
    return ether(val).toString();
}

function toBN (num) {
    return new BN(num);
}

function trim0x (bigNumber) {
    const s = bigNumber.toString();
    if (s.startsWith('0x')) {
        return s.substring(2);
    }
    return s;
}

function cutSelector (data) {
    const hexPrefix = '0x';
    return hexPrefix + data.substr(hexPrefix.length + 8);
}

function cutLastArg (data, padding=0) {
    return data.substr(0, data.length - 64 - padding);
}

module.exports = {
    price,
    toBN,
    cutSelector,
    cutLastArg,
    trim0x,
};