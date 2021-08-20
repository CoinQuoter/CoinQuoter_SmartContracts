
import { Contract, ethers } from "ethers";
import * as PubNub from "pubnub";
import Decimal from 'decimal.js';
import Web3 from "web3";
import * as $ from "jquery";

// Hardhat default accounts (1) private key
const takerPrivateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
var streamingPrices: boolean = false;

declare global {
    interface Window {
        ethereum: any;
    }
}

interface ConnectInfo {
    chainId: string;
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
        const provider = new ethers.providers.Web3Provider(window.ethereum)
        const signer = provider.getSigner(0)
        address = await signer.getAddress()
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
    //console.info('content_to_send', content_to_send);

    $("#streaming-now-bid").text(bid);
    $("#streaming-now-ask").text(ask);

    if (streamingPrices) {
        appendPriceToList(content_to_send);

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
    }
};

async function txConfirm(data: any, sender: string) {
    console.log(streamingPrices);

    if (!streamingPrices)
        return;

    if (!$("#auto-accept").is(':checked')) {
        const confirmation = window.confirm(`Incoming RFQ fill order from ${sender}.\nType: ${data.type == 1 ? "BID" : "ASK"}\nMaker amount: ${data.makerAmount}\nTaker amount: ${data.takerAmount}`);
        if (!confirmation)
            return;
    }

    const provider = new ethers.providers.Web3Provider(window.ethereum)
    const signer = new ethers.Wallet(takerPrivateKey, provider);
    const contract: Contract = new ethers.Contract(
        Config.limitOrderProtocolAddress,
        Config.limitOrderProtocolABI,
        provider
    );

    let makerAmount = "0"
    let takerAmount = "0"

    // Bid
    if (data.type == 1)
        makerAmount = data.makerAmount;
    else  // Ask
        takerAmount = data.takerAmount;

    console.log("Session key: " + data.sessionKey)
    try {
        const result = await contract.connect(signer).fillOrderRFQ(
            data.limitOrder,
            data.limitOrderSignature,
            makerAmount,
            takerAmount,
            { gasLimit: 1000000 }
        );

        appendTransactionToList(data, result.hash);

        await provider.waitForTransaction(result.hash)
        txSuccess(result.hash);
    } catch (err) {
        console.error(err);
        if (err.transaction.hash) {
            appendTransactionToList(data, err.transaction.hash);
            txFail(err.transaction.hash);
        }
    }
}

async function txSuccess(hash: String) {
    $(`#${hash}`).append("<p style=\"color:green\">RFQ Order filled successfully</p>")
}

async function txFail(hash: String) {
    $(`#${hash}`).append("<p style=\"color:red\">Filling RFQ Order failed</p>")
}

function appendTransactionToList(data: any, hash: string) {
    let pElement = document.createElement('p');
    pElement.setAttribute("id", hash);
    pElement.appendChild(document.createTextNode(JSON.stringify({
        signature: data.limitOrderSignature,
        ...data.limitOrder,
        takerAmount: data.takerAmount,
        makerAmount: data.makerAmount,
        type: data.type
    }, null, 4)));

    $("#trade-execution-list").append(pElement);
}

function appendPriceToList(data: any) {
    let pElement = document.createElement('p');
    pElement.appendChild(document.createTextNode(JSON.stringify({
        ...data,
    }, null, 4)));

    $("#stream-scrollable-feed").append(pElement);
    $("#stream-scrollable-feed").scrollTop($("#stream-scrollable-feed")[0].scrollHeight);
}

$(document).ready(async function () {
    $("#end-session").hide();

    await updateAccountData();

    $("#streaming-prices-frames").hide();
    $("#start-streaming").on("click", function () {
        streamingPrices = !streamingPrices;

        if (streamingPrices) {
            $("#start-streaming").text("Stop streaming");
            $("#streaming-prices-frames").show();
        } else {
            $("#start-streaming").text("Start streaming");
            $("#streaming-prices-frames").hide();
        }
    });

    $("#generate-keyset").on("click", function () {
        generateKeyset();
    });

    $("#sender-session-balance-refresh").on("click", function () {
        updateETHBalance();
    });

    $("#sender-session-session-activate").on("click", function () {
        createSession();
    });

    $("#end-session").on("click", function () {
        endSession();
    });

    $("#sender-session-private-key-copy").on("click", async function () {
        copyToClipboard($("#sender-session-private-key-input").val().toString());
    });

    $("#sender-session-private-key-input").on("input", async function () {
        try {
            generateKeyset($("#sender-session-private-key-input").val().toString())
            updatePublicKey();
        } catch (err) {
        }
    });

    $("#update-allowance-token0").on("click", async function () {
        const provider = new ethers.providers.Web3Provider(window.ethereum)
        const token0Contract = new ethers.Contract(Config.token0, Config.ERC20ABI, provider)

        const newAllowance = new Decimal($("#amount-token0-approved").val().toString()).mul(new Decimal(10).pow(Config.token0Dec))
        await token0Contract.connect(provider.getSigner(0)).approve(Config.limitOrderProtocolAddress, newAllowance.toFixed())
    });

    $("#update-allowance-token1").on("click", async function () {
        const provider = new ethers.providers.Web3Provider(window.ethereum)
        const token0Contract = new ethers.Contract(Config.token1, Config.ERC20ABI, provider)

        const newAllowance = new Decimal($("#amount-token1-approved").val().toString()).mul(new Decimal(10).pow(Config.token1Dec))
        await token0Contract.connect(provider.getSigner(0)).approve(Config.limitOrderProtocolAddress, newAllowance.toFixed())
    });

    setInterval(function () {
        updateETHBalance();
        //updateAllowance();
    }, 1000);
})


function copyToClipboard(text: string) {
    var $temp = $("<input>");
    $("body").append($temp);
    $temp.val(text).select();
    document.execCommand("copy");
    $temp.remove();
}

async function updateAllowance() {
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    const tokenContract0 = new ethers.Contract(Config.token0, Config.ERC20ABI, provider);
    const tokenContract1 = new ethers.Contract(Config.token1, Config.ERC20ABI, provider);

    const makerAddress = await provider.getSigner(0).getAddress();
    const allowanceToken0 = new Decimal((await tokenContract0.connect(makerAddress).allowance(makerAddress, Config.limitOrderProtocolAddress)).toString()).div(new Decimal(10).pow(Config.token0Dec));
    const allowanceToken1 = new Decimal((await tokenContract1.connect(makerAddress).allowance(makerAddress, Config.limitOrderProtocolAddress)).toString()).div(new Decimal(10).pow(Config.token1Dec));

    $("#amount-token0-approved").val(allowanceToken0.toFixed(8));
    $("#amount-token1-approved").val(allowanceToken1.toFixed(8));

}

async function privateKeyToPublic(privateKey: string) {
    if (!privateKey)
        return "No private key";

    try {
        const provider = new ethers.providers.Web3Provider(window.ethereum)
        const wallet = new ethers.Wallet(privateKey.replace("0x", ""), provider);

        return await wallet.getAddress();
    } catch (err) {
        return "Invalid private key";
    }
}

async function generateKeyset(privateKey?: string) {
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    const signer = provider.getSigner(0)
    const wallet = ethers.Wallet.createRandom()

    localStorage.setItem('session-taker', JSON.stringify({
        session_private_key: privateKey ? privateKey : wallet.privateKey,
        session_creator: await signer.getAddress()
    }));

    $("#sender-session-private-key-input").val(wallet.privateKey);

    updatePublicKey();
}

async function updatePublicKey() {
    const publicKey = await privateKeyToPublic($("#sender-session-private-key-input").val().toString())
    console.log(publicKey)

    $("#current-session-key").text(publicKey);
}

async function createSession() {
    try {
        const provider = new ethers.providers.Web3Provider(window.ethereum)
        const LOPContract = new ethers.Contract(
            Config.limitOrderProtocolAddress,
            Config.limitOrderProtocolABI,
            provider
        )

        const sessionLength = Number($("#sender-session-length-input").val().toString())

        if (sessionLength < 120) {
            alert("Minimum session length is 120 seconds");
            return;
        }

        const signer = provider.getSigner(0)
        const wallet = ethers.Wallet.createRandom()
        // Session expires in 2 minutes
        const expirationTime = Math.round(Date.now() / 1000) + sessionLength;

        const result = await LOPContract.connect(signer).createOrUpdateSession(wallet.address, expirationTime);
        await provider.waitForTransaction(result.hash);

        updateSessionData();
    } catch (err) {

    }
}

async function updateAccountData() {
    const provider = new ethers.providers.Web3Provider(window.ethereum)

    console.log("ABCD: " + localStorage.getItem('session-taker') != null);

    if (localStorage.getItem('session-taker') != null) {
        const session = JSON.parse(localStorage.getItem('session-taker'));

        $("#current-session-key").val(await privateKeyToPublic(session.session_private_key));
        $("#sender-session-private-key-input").val(session.session_private_key);
    }

    window.ethereum.on('accountsChanged', async (accounts: any) => {
        const signer = provider.getSigner(0)
        $("#public-key").text(await signer.getAddress())
        updateSessionData();
    })

    window.ethereum.on('connect', async (connectInfo: ConnectInfo) => {
        const signer = provider.getSigner(0)
        $("#public-key").text(await signer.getAddress())
        updateSessionData();
    });

    updatePublicKey();
    updateETHBalance();
    updateAllowance();

    try {
        const signer = provider.getSigner(0)

        $("#public-key").text(await signer.getAddress())
        updateSessionData();
    } catch (err) {
        $("#public-key").text("Not connected to provider");
        console.error(err);
    }
}

async function updateETHBalance() {
    if (localStorage.getItem('session-taker') != "null") {
        const session = JSON.parse(localStorage.getItem('session-taker'));
        const provider = new ethers.providers.Web3Provider(window.ethereum)
        const sessionBalance = await provider.getBalance(await privateKeyToPublic(session.session_private_key));
        $("#sender-session-balance").text(ethers.utils.formatEther(sessionBalance) + " ETH");
    } else {
        $("#sender-session-balance").text("No private key")
    }
}

async function endSession() {
    try {
        const provider = new ethers.providers.Web3Provider(window.ethereum)
        const LOPContract = new ethers.Contract(Config.limitOrderProtocolAddress, Config.limitOrderProtocolABI, provider)
        const signer = provider.getSigner(0)

        const result = await LOPContract.connect(signer).endSession();
        await provider.waitForTransaction(result.hash);

        updateSessionData();
    } catch (err) {
        console.error(err);
        clearSessionData();
    }
}

let timeLeftInterval: NodeJS.Timer;

function clearSessionData() {
    $("#private-key").val("No session");
    $("#session-active-key").text("No session");
    $("#session-exp").text("No session")
    $("#session-time-left").text("No session");
    $("#end-session").hide();

    clearInterval(timeLeftInterval);
}

async function updateSessionData() {
    if (localStorage.getItem('session-taker') == "null") {
        clearSessionData();

        return;
    }

    const session = JSON.parse(localStorage.getItem('session-taker'));
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    const LOPContract = new ethers.Contract(Config.limitOrderProtocolAddress, Config.limitOrderProtocolABI, provider)
    const signer = provider.getSigner(0)
    const signerAddress = await signer.getAddress();

    const expirationTime = await LOPContract.connect(signer).sessionExpirationTime(signerAddress);
    const expirationDate = new Date(Number(expirationTime.toString()) * 1000)
    const dateNow = new Date().getTime() / 1000;

    clearInterval(timeLeftInterval);

    if (expirationTime > dateNow) {
        $("#end-session").show();
        $("#private-key").val(session.session_private_key);
        $("#session-active-key").text(await privateKeyToPublic(session.session_private_key));
        $("#session-exp").text(expirationDate.toString())

        timeLeftInterval = setInterval(async function () {
            var now = new Date().getTime();
            var distance = expirationDate.getTime() - now;

            var days = Math.floor(distance / (1000 * 60 * 60 * 24));
            var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            var seconds = Math.floor((distance % (1000 * 60)) / 1000);

            $("#session-time-left").text(days + "d " + hours + "h " + minutes + "m " + seconds + "s ");

            if (distance / 1000 < 60) {
                $("#bid-button").prop("disabled", true);
                $("#ask-button").prop("disabled", true);
            }

            if (distance < 0) {
                clearSessionData();
            }
        }, 1000);
    } else {
        clearSessionData();
    }
}

class Config {
    static limitOrderProtocolABI: string[] = [
        "function fillOrder(tuple(uint256 salt, address makerAsset, address takerAsset, bytes makerAssetData, bytes takerAssetData, bytes getMakerAmount, bytes getTakerAmount, bytes predicate, bytes permit, bytes interaction), bytes calldata signature, uint256 makingAmount, uint256 takingAmount, uint256 thresholdAmount) external returns(uint256, uint256)",
        "function fillOrderRFQ(tuple(uint256 info, address makerAsset, address takerAsset, bytes makerAssetData, bytes takerAssetData), bytes calldata signature, uint256 makingAmount, uint256 takingAmount) external returns(uint256, uint256)",
        "function session(address owner) external view returns(address maker, address sessionKey, uint256 expirationTime, uint256 txCount)",
        "function createOrUpdateSession(address sessionKey, uint256 expirationTime) external returns(int256)",
        "function sessionExpirationTime(address owner) external view returns(uint256 expirationTime)",
        "function endSession() external",
    ];
    static ERC20ABI: string[] = [
        "function allowance(address _owner, address _spender) public view returns (uint256 remaining)",
        "function approve(address _spender, uint256 _value) public returns (bool success)",
        "function balanceOf(address) view returns (uint)"
    ];
    static limitOrderProtocolAddress: string = "0xc3e53F4d16Ae77Db1c982e75a937B9f60FE63690";
    static token0: string = "0xa513E6E4b8f2a923D98304ec87F64353C4D5C853";
    static token1: string = "0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e";
    static token0Dec: number = 18;
    static token1Dec: number = 18;
}
