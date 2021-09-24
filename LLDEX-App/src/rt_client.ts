import { LimitOrderBuilder, PrivateKeyProviderConnector } from "limit-order-protocol-lldex"
import { ethers } from "ethers"
import { OrderType } from "./models/order_type"

import ERC20ABI from './abi/ERC20ABI.json'
import Config from "./utils/config"
import PubNub from "pubnub"
import Web3 from "web3"
import Decimal from 'decimal.js'
import $ from "jquery"
import { TakerTokenPair } from "./models/taker_token_pair"

let allowanceFetched: boolean = false

let receivedPairs: Array<TakerTokenPair> = new Array<TakerTokenPair>();

const uuid = PubNub.generateUUID()
const pubnubClient = new PubNub({
    publishKey: Config.pubNubPublishKey,
    subscribeKey: Config.pubNubSubscribeKey,
    uuid: uuid
})

interface ConnectInfo {
    chainId: string
}

$(document).ready(async function () {
    $("#amount-in-token").text($("#token-sell option:selected").text())
    $("#amount-out-token").text($("#token-buy option:selected").text())

    $("#token-sell").on("change", function () {
        updateTxButtons()

        allowanceFetched = false
    })

    $("#token-buy").on("change", function () {
        $("#amount-out-token").text($("#token-buy option:selected").text())
        $("#amount-in-token").text($("#token-sell option:selected").text())

        updateTxButtons()

        allowanceFetched = false
    })

    $("#update-allowance-sell-token").on("click", async function () {
        const provider = new ethers.providers.Web3Provider(window.ethereum)
        const token0Contract = new ethers.Contract($("#token-sell").data("token"), ERC20ABI, provider)

        const newAllowance = new Decimal($("#amount-in-approved").val().toString()).mul(new Decimal(10).pow($("#token-sell").data("tokenDecimals")))
        await token0Contract.connect(provider.getSigner(0)).approve(Config.limitOrderProtocolAddress, newAllowance.toFixed())
    })

    if ($("#token-sell").prop('selectedIndex') == 0) {
        $("#bid-button").prop("disabled", false)
        $("#ask-button").prop("disabled", true)
    } else {
        $("#bid-button").prop("disabled", true)
        $("#ask-button").prop("disabled", false)
    }

    $("#end-session").hide()

    $("#generate-session").on("click", async function () {
        createSession()
    })

    $("#end-session").on("click", async function () {
        endSession()
    })

    $("#private-key").prop("disabled", true)

    const provider = new ethers.providers.Web3Provider(window.ethereum)
    const LOPContract = new ethers.Contract(
        Config.limitOrderProtocolAddress, 
        Config.limitOrderProtocolABI, 
        provider
    )

    LOPContract.on("OrderFilledRFQ", (orderHash, takingAmount, event) => {
        console.log("OrderFilledRFQ", orderHash)

        const takerTokenPair = dropdownTokensToPair();

        if (!takerTokenPair)
            return;

        allowanceFetched = false
        updateAllowance(takerTokenPair)

    })

    updateAccountData()
})

window.addEventListener('DOMContentLoaded', (event) => {
    const bidButton = <HTMLInputElement>document.getElementById('bid-button')
    const askButton = <HTMLInputElement>document.getElementById('ask-button')

    const privateKeyInput = <HTMLInputElement>document.getElementById('private-key')
    const amountInput = <HTMLInputElement>document.getElementById('amount-in')
    const amountOutput = <HTMLInputElement>document.getElementById('amount-out')

    bidButton.addEventListener('click', async () => {
        publishMessageToMaker(OrderType.bid)
    })

    askButton.addEventListener('click', async () => {
        publishMessageToMaker(OrderType.ask)
    })


    pubnubClient.subscribe({
        channels: ['eth-usdt-1', 'btc-usdt-1'],
        withPresence: true
    })

    pubnubClient.addListener({
        message: async function (event) {
            const evtData = event.message.content

            if (evtData.type == "stream_depth") {
                const pair: TakerTokenPair = await _updateReceivedPairs(event, evtData.data);

                //makerLastPacket = evtData.data

                updateAllowance(pair)
                updateButtons(pair)
                updateOutputValue(pair)
            } else if (evtData.type == "transaction_posted") {
                $('#tx-status').append(`<p style=\"color:blue\"> [${evtData.data.hash}] RFQ Order posted on blockchain</p>`)
            } else if (evtData.type == "transaction_filled") {
                $('#tx-status').append(`<p style=\"color:green\"> [${evtData.data.hash}] RFQ Order filled successfully</p>`)
            } else if (evtData.type == "transaction_failed") {
                $('#tx-status').append(`<p style=\"color:red\"> [${evtData.data.hash}] Filling RFQ Order failed (reason: ${evtData.data.reason})</p>`)
            } else if (evtData.type == "transaction_rejected") {
                $('#tx-status').append(`<p style=\"color:red\"> [-] Filling RFQ Order failed - order rejected (reason: ${evtData.data.reason})</p>`)
            }
        },
        presence: function (event) {
            let pElement = document.createElement('p')
            pElement.appendChild(document.createTextNode(event.uuid + " has joined."))
            document.body.appendChild(pElement)
        }
    })

    function updateOutputValue(data: TakerTokenPair) {
        if ($("#bid-button").prop("disabled")) {
            amountOutput.value = (Number(amountInput.value) * (1 / Number(data.ask))).toString()
        } else {
            amountOutput.value = (Number(amountInput.value) * Number(data.bid)).toString()
        }
    }

    function updateButtons(data: TakerTokenPair) {
        bidButton.value = "BID:" + data.bid.toFixed(4)
        askButton.value = "ASK:" + data.ask.toFixed(4)

        bidButton.dataset.data = JSON.stringify(data)
    }

    async function sign1InchOrder(type: OrderType, data: any) {
        if (localStorage.getItem('session-taker') == "null")
            return

        const session = JSON.parse(localStorage.getItem('session-taker'))
        const sessionPrivateKey = session.session_private_key.replaceAll("0x", "")
        const sessionPublicKey = session.session_public_key

        const web3 = new Web3(window.ethereum)
        const provider = new ethers.providers.Web3Provider(window.ethereum)
        const walletAddress = await provider.getSigner(0).getAddress()
        const providerConnector = new PrivateKeyProviderConnector(sessionPrivateKey, web3)

        let limitOrderBuilder: LimitOrderBuilder = new LimitOrderBuilder(
            Config.limitOrderProtocolAddress,
            (await provider.getNetwork()).chainId,
            providerConnector
        )

        let amountIn
        let amountOut
        let takerAssetAddres
        let makerAssetAddres

        if (type == OrderType.ask) {
            amountOutput.value = (Number(amountInput.value) * (1 / Number(data.ask))).toString()

            amountIn = new Decimal(amountInput.value).mul(new Decimal(10).pow(data.amount0Dec)).toFixed()
            amountOut = new Decimal(amountOutput.value).mul(new Decimal(10).pow(data.amount1Dec)).toFixed()
            takerAssetAddres = data.amount1Address
            makerAssetAddres = data.amount0Address
        } else {
            amountOutput.value = (Number(amountInput.value) * Number(data.bid)).toString()

            amountIn = new Decimal(amountInput.value).mul(new Decimal(10).pow(data.amount0Dec))/*.sub("10000000000000")*/.toFixed()
            amountOut = new Decimal(amountOutput.value).mul(new Decimal(10).pow(data.amount1Dec))/*.add("10000000000000000")*/.toFixed()
            takerAssetAddres = data.amount0Address
            makerAssetAddres = data.amount1Address
        }

        var array = new Uint32Array(1)
        window.crypto.getRandomValues(array)

        console.log("Order id: " + array[0])

        const limitOrder = limitOrderBuilder.buildRFQOrder({
            id: array[0],
            expiresInTimestamp: Math.round(Date.now() / 1000) + 1800,
            takerAssetAddress: takerAssetAddres,
            makerAssetAddress: makerAssetAddres,
            takerAddress: walletAddress,
            makerAddress: data.makerAddress,
            takerAmount: amountIn,
            makerAmount: amountOut,
            feeTokenAddress: "0xa513E6E4b8f2a923D98304ec87F64353C4D5C853",
            feeAmount: "0",
            frontendAddress: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
        })

        const resultEIP712 = limitOrderBuilder.buildRFQOrderTypedData(limitOrder)

        const limitOrderSignature = await limitOrderBuilder.buildOrderSignature(
            sessionPublicKey,
            resultEIP712
        )

        return {
            takerAmount: amountIn,
            makerAmonut: amountOut,
            limitOrderSignature: limitOrderSignature,
            limitOrder: limitOrder,
            sessionKey: sessionPublicKey
        }
    }

    async function publishMessageToMaker(type: OrderType) {
        const takerTokenPair = dropdownTokensToPair();
        const oneInchOrder = await sign1InchOrder(type, JSON.parse(bidButton.dataset.data))

        if (!oneInchOrder)
            return

        pubnubClient.publish({
            channel: takerTokenPair.channelName,
            message: {
                content: {
                    type: "action",
                    method: "execute_order",
                    data: {
                        type: type,
                        takerAmount: oneInchOrder.takerAmount,
                        makerAmount: oneInchOrder.makerAmonut,
                        limitOrderSignature: oneInchOrder.limitOrderSignature,
                        limitOrder: oneInchOrder.limitOrder,
                        sessionKey: oneInchOrder.sessionKey,
                    }
                },
                sender: uuid
            }
        })
    }
})

async function _updateReceivedPairs(event: any, data: any): Promise<TakerTokenPair> {
    var pair = receivedPairs.find(x => x.channelName == event.channel && 
        x.token0Address == data.token0Address && 
        x.token1Address == data.token1Address
    )

    if (pair) {
        pair.bid = new Decimal(data.bid);
        pair.ask = new Decimal(data.ask);
        pair.maxToken0 = new Decimal(data.maxToken0);
        pair.maxToken1 = new Decimal(data.maxToken1);
        pair.lastUpdateId = data.lastUpdateId;

        return pair;
    }

    const provider = new ethers.providers.Web3Provider(window.ethereum)
    const token0Contract = new ethers.Contract(data.token0Address, ERC20ABI, provider)
    const token1Contract = new ethers.Contract(data.token1Address, ERC20ABI, provider)
    const token0Symbol = await token0Contract.symbol();
    const token1Symbol =  await token1Contract.symbol();
    pair = {
        channelName: event.channel,
        makerAddress: data.makerAddress,
        token0Address: data.token0Address,
        token1Address: data.token1Address,
        token0Symbol: token0Symbol,
        token1Symbol: token1Symbol,
        token0Dec: data.token0Dec,
        token1Dec: data.token1Dec,
        bid: new Decimal(data.bid),
        ask: new Decimal(data.ask),
        maxToken0: new Decimal(data.maxToken0),
        maxToken1: new Decimal(data.maxToken1),
        lastUpdateId: data.lastUpdateId,
    };

    receivedPairs.push(pair)

    updateDropdownPairs(token0Symbol, token1Symbol);
    updateTxButtons();

    return pair;
}

function updateDropdownPairs(token0Symbol: string, token1Symbol: string) {
    if ($(`#token-buy:contains('<option value="${token0Symbol}">${token0Symbol}</option>')`).length == 0)
        $("#token-buy").append(`<option value="${token0Symbol}">${token0Symbol}</option>`);
    if ($(`#token-buy:contains('<option value="${token1Symbol}">${token1Symbol}</option>')`).length == 0)
        $("#token-buy").append(`<option value="${token1Symbol}">${token1Symbol}</option>`);

    if ($(`#token-sell:contains('<option value="${token0Symbol}">${token0Symbol}</option>')`).length == 0)
        $("#token-sell").append(`<option value="${token0Symbol}">${token0Symbol}</option>`);
    if ($(`#token-sell:contains('<option value="${token1Symbol}">${token1Symbol}</option>')`).length == 0)
        $("#token-sell").append(`<option value="${token1Symbol}">${token1Symbol}</option>`);
}

async function updateAllowance(data: TakerTokenPair) {
    $("#token-sell").data("token", $("#token-sell").prop('selectedIndex') == 0 ? data.token0Address : data.token1Address)
    $("#token-sell").data("tokenDecimals", $("#token-sell").prop('selectedIndex') == 0 ? data.token0Dec : data.token1Dec)

    if (allowanceFetched)
        return

    const provider = new ethers.providers.Web3Provider(window.ethereum)
    const tokenContract = new ethers.Contract($("#token-sell").data("token"), ERC20ABI, provider)

    const takerAddress = await provider.getSigner(0).getAddress()

    if (takerAddress != Config.limitOrderProtocolAddress) {
        const allowanceToken = new Decimal((await tokenContract
            .connect(takerAddress)
            .allowance(takerAddress, Config.limitOrderProtocolAddress))
            .toString())
                .div(new Decimal(10)
                .pow(data.token0Dec))

        $("#amount-in-approved").val(allowanceToken.toFixed(8))

        allowanceFetched = true
    } else {
        console.log("taker and Limit-Order-Protocol address is the same")
    }
}

async function updateAccountData() {
    const provider = new ethers.providers.Web3Provider(window.ethereum)

    window.ethereum.on('accountsChanged', async (accounts: any) => {
        const signer = provider.getSigner(0)
        $("#public-key").text(await signer.getAddress())
        updateSessionData()
    })

    window.ethereum.on('connect', async (connectInfo: ConnectInfo) => {
        const signer = provider.getSigner(0)
        $("#public-key").text(await signer.getAddress())
        updateSessionData()
    })

    try {
        const signer = provider.getSigner(0)

        $("#public-key").text(await signer.getAddress())
        updateSessionData()
    } catch (err) {
        $("#public-key").text("Not connected to provider")
        console.error(err)
    }
}

let timeLeftInterval: NodeJS.Timer

async function updateSessionData() {
    if (localStorage.getItem('session-taker') == "null") {
        $("#private-key").val("No session")
        $("#current-session-key").text("No session")
        $("#session-exp").text("No session")
        $("#session-time-left").text("No session")
        $("#end-session").hide()

        clearInterval(timeLeftInterval)

        return
    }

    const session = JSON.parse(localStorage.getItem('session-taker'))
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    const LOPContract = new ethers.Contract(
        Config.limitOrderProtocolAddress, 
        Config.limitOrderProtocolABI, 
        provider
    )
    const signer = provider.getSigner(0)
    const signerAddress = await signer.getAddress()

    const expirationTime = await LOPContract.connect(signer).sessionExpirationTime(signerAddress)
    const expirationDate = new Date(Number(expirationTime.toString()) * 1000)
    const dateNow = new Date().getTime() / 1000

    clearInterval(timeLeftInterval)
    updateTxButtons()

    if (expirationTime > dateNow) {
        $("#end-session").show()
        $("#private-key").val(session.session_private_key)
        $("#current-session-key").text(session.session_public_key)
        $("#session-exp").text(expirationDate.toString())

        timeLeftInterval = setInterval(async function () {
            var now = new Date().getTime()
            var distance = expirationDate.getTime() - now

            var days = Math.floor(distance / (1000 * 60 * 60 * 24))
            var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
            var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
            var seconds = Math.floor((distance % (1000 * 60)) / 1000)

            $("#session-time-left").text(days + "d " + hours + "h " + minutes + "m " + seconds + "s ")

            if (distance / 1000 < 60) {
                $("#bid-button").prop("disabled", true)
                $("#ask-button").prop("disabled", true)
            }

            if (distance < 0) {
                clearInterval(timeLeftInterval)
                localStorage.setItem('session-taker', null)

                $("#end-session").hide()
                $("#session-time-left").text("Session expired")
            }
        }, 1000)
    } else {
        localStorage.setItem('session-taker', null)
    }
}

async function createSession() {
    try {
        const provider = new ethers.providers.Web3Provider(window.ethereum)
        const LOPContract = new ethers.Contract(
            Config.limitOrderProtocolAddress, 
            Config.limitOrderProtocolABI, 
            provider
        )
        const signer = provider.getSigner(0)
        const wallet = ethers.Wallet.createRandom()
        const expirationTime = Math.round(Date.now() / 1000) + 1800
        // Session expires in 2 minutes

        const result = await LOPContract.connect(signer).createOrUpdateSession(wallet.address, expirationTime)
        await provider.waitForTransaction(result.hash)

        localStorage.setItem('session-taker', JSON.stringify({
            session_private_key: wallet.privateKey,
            session_public_key: wallet.address,
            session_creator: await signer.getAddress()
        }))

        updateSessionData()
    } catch (err) {

    }
}

async function endSession() {
    try {
        const provider = new ethers.providers.Web3Provider(window.ethereum)
        const LOPContract = new ethers.Contract(
            Config.limitOrderProtocolAddress, 
            Config.limitOrderProtocolABI, 
            provider
        )
        const signer = provider.getSigner(0)

        const result = await LOPContract.connect(signer).endSession()
        await provider.waitForTransaction(result.hash)
        localStorage.setItem('session-taker', null)

        updateSessionData()
    } catch (err) {
        console.error(err)
        updateSessionData()
    }
}

function updateTxButtons() {
    if ($("#token-sell").prop('selectedIndex') == 0) {
        $("#bid-button").prop("disabled", false)
        $("#ask-button").prop("disabled", true)
    } else {
        $("#bid-button").prop("disabled", true)
        $("#ask-button").prop("disabled", false)
    }

    if ($("#token-sell").prop('selectedIndex') == $("#token-buy").prop('selectedIndex')) {
        $("#bid-button").prop("disabled", true)
        $("#ask-button").prop("disabled", true)
    }
}

function dropdownTokensToPair(): TakerTokenPair {
    const buyTokenSymbol = $("#token-buy option:selected").text();
    const sellTokenSymbol = $("#token-sell option:selected").text();

    return receivedPairs.find(x => (x.token0Symbol === buyTokenSymbol && x.token1Symbol === sellTokenSymbol) || 
        (x.token0Symbol === sellTokenSymbol && x.token1Symbol === buyTokenSymbol)
    )
}