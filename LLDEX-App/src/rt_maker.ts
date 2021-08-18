
import { Contract, ethers } from "ethers";
import * as PubNub from "pubnub";
import Decimal from 'decimal.js';
import Web3 from "web3";

// Hardhat default accounts (1) private key
const takerPrivateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

declare global {
    interface Window {
        ethereum: any;
    }
}

const uuid = PubNub.generateUUID();
const pubnub = new PubNub({
    publishKey: "pub-dd76188a-d8cc-42cf-9625-335ef44bb3a1",
    subscribeKey: "sub-4c298de8-a12e-11e1-bd35-5d12de0b12ad",
    uuid: uuid
});

pubnub.subscribe({
    channels: ['eth-usdt-tx'],
    withPresence: true
});

pubnub.addListener({
    message: function (event) {
        const evtData = event.message.content;

        if (evtData.type == "action" && evtData.method == "bid_execute") {
            txConfirm(evtData.data, event.message.sender);
        } else if (evtData.type == "action" && evtData.method == "ask_execute") {
            txConfirm(evtData.data, event.message.sender);
        }
    },
    presence: function (event) {
        let pElement = document.createElement('p');
        pElement.appendChild(document.createTextNode(event.uuid + " has joined. That's you!"));
        document.body.appendChild(pElement);
    }
});

const conn = new WebSocket("wss://stream.binance.com:9443/ws/ethusdt@depth5@1000ms");
conn.onopen = function (evt) {
}

conn.onmessage = async function (evt) {
    const evtJson = JSON.parse(evt.data);
    const bid = evtJson.bids[0][0];
    const ask = evtJson.asks[0][0];
    const bigNumberBid = new Decimal(bid).mul(new Decimal(10).pow(Config.token0Dec));
    const bigNumberAsk = new Decimal(ask).mul(new Decimal(10).pow(Config.token1Dec));

    let address = "0x00";

    try {
        address = new Web3(window.ethereum).eth.accounts.privateKeyToAccount(takerPrivateKey).address;
    } catch (e) { }

    const content_to_send = {
        lastUpdateId: evtJson.lastUpdateId,
        bid: bid,
        ask: ask,
        bidAmount: bigNumberBid.toString(),
        askAmount: bigNumberAsk.toString(),
        takerAddress: address,
        amount0Address: Config.token0,
        amount1Address: Config.token1,
        amount0Dec: Config.token0Dec,
        amount1Dec: Config.token1Dec,
        contractAddress: Config.limitOrderProtocolAddress
    };
    console.info('content_to_send', content_to_send);

    pubnub.publish({
        channel: "eth-usdt-tx",
        message: {
            content: {
                type: "stream_depth",
                data: content_to_send
            },
            sender: uuid
        },
        meta: {
            uuid: pubnub.getUUID()
        }
    });
};

async function txConfirm(data: any, sender: string) {
    const confirmation = window.confirm(`TX FROM ${sender}, message: ${JSON.stringify(data)}`);

    if (confirmation) {
        const provider = ethers.getDefaultProvider("http://127.0.0.1:8545/")
        const signer = new ethers.Wallet(takerPrivateKey, provider);
        const contract: Contract = new ethers.Contract(
            Config.limitOrderProtocolAddress,
            Config.limitOrderProtocolABI,
            provider
        );

        appendToBodyTx(data);

        let makerAmount = "0"
        let takerAmount = "0"

        // Bid
        if (data.type == 1)
            makerAmount = data.makerAmount;
        else  // Ask
            takerAmount = data.takerAmount;

        console.log("Session key: " + data.sessionKey)

        const result = await contract.connect(signer).fillOrderRFQ(
            data.limitOrder,
            data.limitOrderSignature,
            data.sessionKey,
            makerAmount,
            takerAmount,
            { gasLimit: 1000000 }
        );

        await provider.waitForTransaction(result.hash)
    }
}

function appendToBodyTx(data: any) {
    let pElement = document.createElement('p');
    pElement.appendChild(document.createTextNode(JSON.stringify({
        signature: data.limitOrderSignature,
        ...data.limitOrder,
        takerAmount: data.takerAmount,
        makerAmount: data.makerAmount,
        type: data.type
    }, null, 4)));
    document.body.appendChild(pElement);
}

class Config {
    static limitOrderProtocolABI: string[] = [
        "function fillOrder(tuple(uint256 salt, address makerAsset, address takerAsset, bytes makerAssetData, bytes takerAssetData, bytes getMakerAmount, bytes getTakerAmount, bytes predicate, bytes permit, bytes interaction), bytes calldata signature, uint256 makingAmount, uint256 takingAmount, uint256 thresholdAmount) external returns(uint256, uint256)",
        "function fillOrderRFQ(tuple(uint256 info, address makerAsset, address takerAsset, bytes makerAssetData, bytes takerAssetData), bytes calldata signature, address sessionKey, uint256 makingAmount, uint256 takingAmount) external returns(uint256, uint256)"
    ];
    static limitOrderProtocolAddress: string = "0xc3e53F4d16Ae77Db1c982e75a937B9f60FE63690";
    static token0: string = "0xa513E6E4b8f2a923D98304ec87F64353C4D5C853";
    static token1: string = "0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e";
    static token0Dec: number = 18;
    static token1Dec: number = 18;
}
