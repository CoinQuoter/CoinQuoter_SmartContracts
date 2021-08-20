import { LimitOrderBuilder, LimitOrderPredicateBuilder, LimitOrderPredicateCallData, LimitOrderProtocolFacade, PrivateKeyProviderConnector } from "@1inch/limit-order-protocol";
import * as PubNub from "pubnub";
import Web3 from "web3"
import Decimal from 'decimal.js';
import * as $ from "jquery";
import { ethers } from "ethers";

let allowanceFetched = false;

let takerLastPacket: any;

const lopAddress = "0xc3e53F4d16Ae77Db1c982e75a937B9f60FE63690";
const uuid_client = PubNub.generateUUID();
const pubnub_client = new PubNub({
    publishKey: "pub-dd76188a-d8cc-42cf-9625-335ef44bb3a1",
    subscribeKey: "sub-4c298de8-a12e-11e1-bd35-5d12de0b12ad",
    uuid: uuid_client
});

const ABIERC20: string[] = [
    "function allowance(address _owner, address _spender) public view returns (uint256 remaining)",
    "function approve(address _spender, uint256 _value) public returns (bool success)",
    "function balanceOf(address) view returns (uint)"
];

const ABILOP: string[] = [
    "function session(address owner) external view returns(address maker, address sessionKey, uint256 expirationTime, uint256 txCount)",
    "function createOrUpdateSession(address sessionKey, uint256 expirationTime) external returns(int256)",
    "function sessionExpirationTime(address owner) external view returns(uint256 expirationTime)",
    "function endSession() external",
    "event OrderFilledRFQ(bytes32 orderHash, uint256 makingAmount)",
    "event SessionTerminated(address indexed sender, address indexed sessionKey)",
    "event SessionCreated(address indexed creator, address indexed sessionKey, uint256 expirationTime)",
    "event SessionUpdated(address indexed sender, address indexed sessionKey, uint256 expirationTime)",
];

enum TxType {
    Bid = 1,
    Ask = 2
}

interface ConnectInfo {
    chainId: string;
}

$(document).ready(async function () {
    $("#amount-in-token").text($("#token-sell option:selected").text())
    $("#amount-out-token").text($("#token-buy option:selected").text())

    $("#token-sell").on("change", function () {
        updateTxButtons()

        allowanceFetched = false;
    });

    $("#token-buy").on("change", function () {
        $("#amount-out-token").text($("#token-buy option:selected").text());
        $("#amount-in-token").text($("#token-sell option:selected").text());

        updateTxButtons()

        allowanceFetched = false;
    });

    $("#update-allowance-sell-token").on("click", async function () {
        const provider = new ethers.providers.Web3Provider(window.ethereum)
        const token0Contract = new ethers.Contract($("#token-sell").data("token"), ABIERC20, provider)

        const newAllowance = new Decimal($("#amount-in-approved").val().toString()).mul(new Decimal(10).pow($("#token-sell").data("tokenDecimals")))
        await token0Contract.connect(provider.getSigner(0)).approve(takerLastPacket.contractAddress, newAllowance.toFixed())
    });

    if ($("#token-sell").prop('selectedIndex') == 0) {
        $("#bid-button").prop("disabled", false);
        $("#ask-button").prop("disabled", true);
    } else {
        $("#bid-button").prop("disabled", true);
        $("#ask-button").prop("disabled", false);
    }

    $("#end-session").hide();

    $("#generate-session").on("click", async function () {
        createSession();
    });

    $("#end-session").on("click", async function () {
        endSession();
    });

    $("#private-key").prop("disabled", true);

    const provider = new ethers.providers.Web3Provider(window.ethereum)
    const LOPContract = new ethers.Contract(lopAddress, ABILOP, provider)

    LOPContract.on("OrderFilledRFQ", (orderHash, makingAmount, event) => {
        console.log("OrderFilledRFQ", orderHash);

        if (!takerLastPacket)
            return;

        allowanceFetched = false;
        updateAllowance(takerLastPacket);

    });

    updateAccountData();
})

window.addEventListener('DOMContentLoaded', (event) => {
    const bidButton = <HTMLInputElement>document.getElementById('bid-button');
    const askButton = <HTMLInputElement>document.getElementById('ask-button');

    const privateKeyInput = <HTMLInputElement>document.getElementById('private-key');
    const amountInput = <HTMLInputElement>document.getElementById('amount-in');
    const amountOutput = <HTMLInputElement>document.getElementById('amount-out');

    bidButton.addEventListener('click', async () => {
        publishMessageToTaker(TxType.Bid);
    })

    askButton.addEventListener('click', async () => {
        publishMessageToTaker(TxType.Ask);
    })


    pubnub_client.subscribe({
        channels: ['eth-usdt-tx'],
        withPresence: true
    });

    pubnub_client.addListener({
        message: function (event) {
            const evtData = event.message.content;

            if (evtData.type == "stream_depth") {
                takerLastPacket = evtData.data;

                updateAllowance(evtData.data);
                updateButtons(evtData.data);
            }
        },
        presence: function (event) {
            let pElement = document.createElement('p');
            pElement.appendChild(document.createTextNode(event.uuid + " has joined."));
            document.body.appendChild(pElement);
        }
    });

    function updateButtons(data: any) {
        bidButton.value = "BID:" + data.bid;
        askButton.value = "ASK:" + data.ask;

        bidButton.dataset.data = JSON.stringify(data);
    }

    async function sign1InchOrder(type: TxType, data: any) {
        if (localStorage.getItem('session-maker') == "null")
            return;

        const session = JSON.parse(localStorage.getItem('session-maker'));
        const sessionPrivateKey = session.session_private_key.replaceAll("0x", "");
        const sessionPublicKey = session.session_public_key;

        const web3 = new Web3(window.ethereum);
        const provider = new ethers.providers.Web3Provider(window.ethereum)
        const walletAddress = await provider.getSigner(0).getAddress();
        const providerConnector = new PrivateKeyProviderConnector(sessionPrivateKey, web3);

        let limitOrderBuilder: LimitOrderBuilder = new LimitOrderBuilder(
            data.contractAddress,
            await web3.eth.getChainId(),
            providerConnector
        );

        let amountIn;
        let amountOut;
        let makerAssetAddres;
        let takerAssetAddres;

        if (type == TxType.Ask) {
            amountOutput.value = (Number(amountInput.value) * (1 / Number(data.ask))).toString();

            amountIn = new Decimal(amountInput.value).mul(new Decimal(10).pow(data.amount0Dec)).toFixed();
            amountOut = new Decimal(amountOutput.value).mul(new Decimal(10).pow(data.amount1Dec)).toFixed();
            makerAssetAddres = data.amount1Address;
            takerAssetAddres = data.amount0Address;
        } else {
            amountOutput.value = (Number(amountInput.value) * Number(data.bid)).toString();

            amountIn = new Decimal(amountInput.value).mul(new Decimal(10).pow(data.amount0Dec)).toFixed();
            amountOut = new Decimal(amountOutput.value).mul(new Decimal(10).pow(data.amount1Dec)).toFixed();
            makerAssetAddres = data.amount0Address;
            takerAssetAddres = data.amount1Address;
        }

        var array = new Uint32Array(1);
        window.crypto.getRandomValues(array);

        const limitOrder = limitOrderBuilder.buildRFQOrder({
            id: array[0],
            expiresInTimestamp: Math.round(Date.now() / 1000) + 1800,
            makerAssetAddress: makerAssetAddres,
            takerAssetAddress: takerAssetAddres,
            makerAddress: walletAddress,
            takerAddress: data.takerAddress,
            makerAmount: amountIn,
            takerAmount: amountOut
        });

        const resultEIP712 = limitOrderBuilder.buildRFQOrderTypedData(limitOrder);

        const limitOrderSignature = await limitOrderBuilder.buildOrderSignature(
            sessionPublicKey,
            resultEIP712
        );

        return {
            makerAmount: amountIn,
            takerAmonut: amountOut,
            limitOrderSignature: limitOrderSignature,
            limitOrder: limitOrder,
            sessionKey: sessionPublicKey
        };
    }

    async function publishMessageToTaker(type: TxType) {
        const oneInchOrder = await sign1InchOrder(type, JSON.parse(bidButton.dataset.data));
        if (!oneInchOrder)
            return;

        pubnub_client.publish({
            channel: "eth-usdt-tx",
            message: {
                content: {
                    type: "action",
                    method: "bid_execute",
                    data: {
                        type: type,
                        price: bidButton.dataset.price,
                        makerAmount: oneInchOrder.makerAmount,
                        takerAmount: oneInchOrder.takerAmonut,
                        limitOrderSignature: oneInchOrder.limitOrderSignature,
                        limitOrder: oneInchOrder.limitOrder,
                        sessionKey: oneInchOrder.sessionKey,
                    }
                },
                sender: uuid_client
            }
        });
    }
});

async function updateAllowance(data: any) {
    $("#token-sell").data("token", $("#token-sell").prop('selectedIndex') == 0 ? takerLastPacket.amount0Address : takerLastPacket.amount1Address)
    $("#token-sell").data("tokenDecimals", $("#token-sell").prop('selectedIndex') == 0 ? takerLastPacket.amount0Dec : takerLastPacket.amount1Dec)

    if (allowanceFetched)
        return;

    const provider = new ethers.providers.Web3Provider(window.ethereum)
    const tokenContract = new ethers.Contract($("#token-sell").data("token"), ABIERC20, provider);

    const makerAddress = await provider.getSigner(0).getAddress();
    const limitOrderProtocolAddress = data.contractAddress;

    if (makerAddress != limitOrderProtocolAddress) {
        const allowanceToken = new Decimal((await tokenContract.connect(makerAddress).allowance(makerAddress, limitOrderProtocolAddress)).toString()).div(new Decimal(10).pow(data.amount0Dec));
        $("#amount-in-approved").val(allowanceToken.toFixed(8));

        allowanceFetched = true;
    } else {
        console.log("Maker and Limit-Order-Protocol address is the same");
    }
}

async function updateAccountData() {
    const provider = new ethers.providers.Web3Provider(window.ethereum)

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

    try {
        const signer = provider.getSigner(0)

        $("#public-key").text(await signer.getAddress())
        updateSessionData();
    } catch (err) {
        $("#public-key").text("Not connected to provider");
        console.error(err);
    }
}

let timeLeftInterval: NodeJS.Timer;

async function updateSessionData() {
    if (localStorage.getItem('session-maker') == "null") {
        $("#private-key").val("No session");
        $("#current-session-key").text("No session");
        $("#session-exp").text("No session")
        $("#session-time-left").text("No session");
        $("#end-session").hide();

        clearInterval(timeLeftInterval);

        return;
    }

    const session = JSON.parse(localStorage.getItem('session-maker'));
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    const LOPContract = new ethers.Contract(lopAddress, ABILOP, provider)
    const signer = provider.getSigner(0)
    const signerAddress = await signer.getAddress();

    const expirationTime = await LOPContract.connect(signer).sessionExpirationTime(signerAddress);
    const expirationDate = new Date(Number(expirationTime.toString()) * 1000)
    const dateNow = new Date().getTime() / 1000;

    clearInterval(timeLeftInterval);
    updateTxButtons();

    if (expirationTime > dateNow) {
        $("#end-session").show();
        $("#private-key").val(session.session_private_key);
        $("#current-session-key").text(session.session_public_key);
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
                clearInterval(timeLeftInterval);
                localStorage.setItem('session-maker', null);

                $("#end-session").hide();
                $("#session-time-left").text("Session expired");
            }
        }, 1000);
    } else {
        localStorage.setItem('session-maker', null);
    }
}

async function createSession() {
    try {
        const provider = new ethers.providers.Web3Provider(window.ethereum)
        const LOPContract = new ethers.Contract(lopAddress, ABILOP, provider)
        const signer = provider.getSigner(0)
        const wallet = ethers.Wallet.createRandom()
        const expirationTime = Math.round(Date.now() / 1000) + 120;
        // Session expires in 2 minutes

        const result = await LOPContract.connect(signer).createOrUpdateSession(wallet.address, expirationTime);
        await provider.waitForTransaction(result.hash);

        localStorage.setItem('session-maker', JSON.stringify({
            session_private_key: wallet.privateKey,
            session_public_key: wallet.address,
            session_creator: await signer.getAddress()
        }));

        updateSessionData();
    } catch (err) {

    }
}

async function endSession() {
    try {
        const provider = new ethers.providers.Web3Provider(window.ethereum)
        const LOPContract = new ethers.Contract(lopAddress, ABILOP, provider)
        const signer = provider.getSigner(0)

        const result = await LOPContract.connect(signer).endSession();
        await provider.waitForTransaction(result.hash);
        localStorage.setItem('session-maker', null);

        updateSessionData();
    } catch (err) {
        console.error(err);
        updateSessionData();
    }
}

function updateTxButtons() {
    if ($("#token-sell").prop('selectedIndex') == 0) {
        $("#bid-button").prop("disabled", false);
        $("#ask-button").prop("disabled", true);
    } else {
        $("#bid-button").prop("disabled", true);
        $("#ask-button").prop("disabled", false);
    }

    if ($("#token-sell").prop('selectedIndex') == $("#token-buy").prop('selectedIndex')) {
        $("#bid-button").prop("disabled", true);
        $("#ask-button").prop("disabled", true);
    }
}