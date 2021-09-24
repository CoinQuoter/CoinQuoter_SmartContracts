import { BigNumber, Contract, ethers } from "ethers"
import PubNub from "pubnub"
import Decimal from 'decimal.js'
import $ from "jquery"
import "jquery-ui/ui/widgets/dialog";
import { RFQOrder } from "limit-order-protocol-lldex"
import OrderDecoder from "./utils/order_decoder"
import Config from "./utils/config"
import { OrderType } from "./models/order_type"
import { BinanceStreamSnapshot } from "./models/binance_stream_snapshot"
import ERC20ABI from './abi/ERC20ABI.json'

var streamingPrices: boolean = false
var streamLatestSnapshot: BinanceStreamSnapshot = {
    bidInbound: new Decimal(0),
    askInbound: new Decimal(0),
    bidOutbound: new Decimal(0),
    askOutbound: new Decimal(0),
    lastUpdateId: "0",
}
const defaultPair = Config.pairs[Config.defaultPair]

declare global {
    interface Window {
        ethereum: any
    }
}

interface ConnectInfo {
    chainId: string
}

const uuid = PubNub.generateUUID()
const pubnub = new PubNub({
    publishKey: "pub-dd76188a-d8cc-42cf-9625-335ef44bb3a1",
    subscribeKey: "sub-4c298de8-a12e-11e1-bd35-5d12de0b12ad",
    uuid: uuid
})

pubnub.subscribe({
    channels: ['eth-usdt-tx-1'],
    withPresence: true
})

pubnub.addListener({
    message: function (event) {
        const evtData = event.message.content

        if (evtData.type == "action" && evtData.method == "bid_execute") {
            txConfirm(evtData.data, event.message.sender)
        }
    },
    presence: function (event) {
        let pElement = document.createElement('p')
        pElement.appendChild(document.createTextNode(event.uuid + " has joined. That's you!"))
        document.body.appendChild(pElement)
    }
})

const conn = new WebSocket("wss://stream.binance.com:9443/ws/ethusdt@depth5@1000ms")
conn.onopen = function (evt) {
    console.log("Connected to binance ETH/USDT pricing stream")
}

conn.onmessage = async function (evt) {
    if (streamingPrices && !await _validateBalance()) {
        stopStreamingPrices();
    }

    const evtJson = JSON.parse(evt.data)

    const _bidInbound = new Decimal(evtJson.bids[0][0])
    const _askInbound = new Decimal(evtJson.asks[0][0])

    streamLatestSnapshot = {
        bidInbound: _bidInbound,
        askInbound: _askInbound,
        bidOutbound: _bidInbound.add(defaultPair.spread),
        askOutbound: _askInbound.add(defaultPair.spread),
        lastUpdateId: evtJson.lastUpdateId,
    }

    const _outboundBidWithDec = new Decimal(streamLatestSnapshot.bidOutbound).mul(new Decimal(10).pow(defaultPair.token0Dec))
    const _outboundAskWithDec = new Decimal(streamLatestSnapshot.askOutbound).mul(new Decimal(10).pow(defaultPair.token1Dec))

    let makerWalletAddress = "0x00"

    try {
        const provider = new ethers.providers.Web3Provider(window.ethereum)
        const signer = provider.getSigner(0)
        makerWalletAddress = await signer.getAddress()
    } catch (e) { }

    const content_to_send = {
        lastUpdateId: evtJson.lastUpdateId,
        bid: streamLatestSnapshot.bidOutbound,
        ask: streamLatestSnapshot.askOutbound,
        bidAmount: _outboundBidWithDec.toString(),
        askAmount: _outboundAskWithDec.toString(),
        makerAddress: makerWalletAddress,
        amount0Address: defaultPair.token0,
        amount1Address: defaultPair.token1,
        amount0Dec: defaultPair.token0Dec,
        amount1Dec: defaultPair.token1Dec,
        contractAddress: Config.limitOrderProtocolAddress
    }

    $("#streaming-now-bid-inbound").text(streamLatestSnapshot.bidInbound.toString())
    $("#streaming-now-ask-inbound").text(streamLatestSnapshot.askInbound.toString())

    $("#streaming-now-bid-outbound").text(streamLatestSnapshot.bidOutbound.toString())
    $("#streaming-now-ask-outbound").text(streamLatestSnapshot.askOutbound.toString())

    if (streamingPrices) {
        appendPriceToList(content_to_send)

        pubnub.publish({
            channel: "eth-usdt-tx-1",
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
        })
    }
}

async function txConfirm(data: any, sender: string) {
    console.log(streamingPrices)

    if (!streamingPrices)
        return

    if (!$("#auto-accept").is(':checked')) {
        const confirmation = window.confirm(`Incoming RFQ fill order from ${sender}.\nType: ${data.type == 1 ? "BID" : "ASK"}\ntaker amount: ${data.takerAmount}\nmaker amount: ${data.makerAmount}`)
        if (!confirmation)
            return
    }

    if (localStorage.getItem('session-maker') == null)
        return

    const session = JSON.parse(localStorage.getItem('session-maker'))

    const provider = new ethers.providers.Web3Provider(window.ethereum)
    const signer = new ethers.Wallet(session.session_private_key, provider)
    const contract: Contract = new ethers.Contract(
        Config.limitOrderProtocolAddress,
        Config.limitOrderProtocolABI,
        provider
    )

    let takerAmount = "0"
    let makerAmount = "0"


    // Bid
    if (data.type == 1)
        makerAmount = new Decimal(data.makerAmount).add(new Decimal("0").mul(new Decimal(10).pow(defaultPair.token0Dec))).toFixed()
    else  // Ask
        makerAmount = new Decimal(data.makerAmount).add(new Decimal("0").mul(new Decimal(10).pow(defaultPair.token1Dec))).toFixed()

    try {
        if (!_validateOrder(data.limitOrder)) {
            return
        }

        const result = await contract.connect(signer).fillOrderRFQ(
            data.limitOrder,
            data.limitOrderSignature,
            takerAmount,
            makerAmount,
            { gasLimit: 1000000 }
        )

        publishMessage("eth-usdt-tx-1", "transaction_posted", {
            hash: result.hash
        })

        appendTransactionToList(data, result.hash)

        await provider.waitForTransaction(result.hash)
        txSuccess(result.hash)
    } catch (err) {
        console.error(err)
        if (err.transaction.hash) {
            appendTransactionToList(data, err.transaction.hash)
            txFail(err.transaction.hash, err.data?.message ?? '')
        }
    }
}

function _validateOrder(order: RFQOrder): boolean {
    const orderInfo = OrderDecoder.decodeInfo(order.info)
    const takerAssetData = OrderDecoder.decodeAssetData(order.takerAssetData)
    const makerAssetData = OrderDecoder.decodeAssetData(order.makerAssetData)

    console.log("INFO: " + order.info)
    console.log("EXPIRATION TIMESTAMP: " + orderInfo.expirationTimestamp)
    console.log("MESSAGE ID: " + orderInfo.orderId)

    console.log("FEE AMOUNT: " + order.feeAmount)
    console.log("FEE TOKEN ADDRESS: " + order.feeTokenAddress)
    console.log("FRONTEND ADDRESS: " + order.frontendAddress)
    console.log("MAKER ASSET: " + order.makerAsset)
    console.log("TAKER ASSET: " + order.takerAsset)

    console.log("TAKER FROM ADDRESS: " + takerAssetData.fromAddress)
    console.log("TAKER TO ADDRESS: " + takerAssetData.toAddress)
    console.log("TAKER AMOUNT: " + takerAssetData.amount)

    console.log("MAKER FROM ADDRESS: " + makerAssetData.fromAddress)
    console.log("MAKER TO ADDRESS: " + makerAssetData.toAddress)
    console.log("MAKER AMOUNT: " + makerAssetData.amount)

    if (takerAssetData.fromAddress != makerAssetData.toAddress || 
        takerAssetData.toAddress != makerAssetData.fromAddress) {
        publishMessage("eth-usdt-tx-1", "transaction_rejected", {
            reason: "Invalid taker/makerAssetData"
        })

        return
    }

    const orderType: OrderType = order.takerAsset == defaultPair.token0 ? OrderType.bid : OrderType.ask
    const price = orderType == OrderType.bid ? 
        new Decimal(makerAssetData.amount).div(new Decimal(takerAssetData.amount)) : 
        new Decimal(takerAssetData.amount).div(new Decimal(makerAssetData.amount))
    
    const amountToken0 = (orderType == OrderType.bid ? new Decimal(takerAssetData.amount) : new Decimal(makerAssetData.amount))
        .div(new Decimal(10)
        .pow(defaultPair.token0Dec))

    const amountToken1 = (orderType == OrderType.bid ? new Decimal(makerAssetData.amount) : new Decimal(takerAssetData.amount))
        .div(new Decimal(10)
        .pow(defaultPair.token1Dec))

    var _reject: boolean = false

    if (amountToken0.greaterThan(defaultPair.maxToken0)) {
        publishMessage("eth-usdt-tx-1", "transaction_rejected", {
            reason: "Max amount of token0 exceeded by " + (amountToken0.sub(defaultPair.maxToken0).toString())
        })

        _reject = true
    }

    if (amountToken1.greaterThan(defaultPair.maxToken1)) {
        publishMessage("eth-usdt-tx-1", "transaction_rejected", {
            reason: "Max amount of token1 exceeded by " + (amountToken1.sub(defaultPair.maxToken1).toString())
        })

        _reject = true
    }

    if (_reject)
        return

    var slippageExceeded = false
    const slippagePercentageBid = price
        .sub(streamLatestSnapshot.bidOutbound)
        //.abs()
        .div(price)
        .mul(100)

    const slippagePercentageAsk = price
        .sub(streamLatestSnapshot.askOutbound)
        .mul(-1)
        .div(price)
        .mul(100)

    console.log("Slippage percentage bid: " + slippagePercentageBid)
    console.log("Slippage percentage ask: " + slippagePercentageAsk)
    console.log("ASK PRICE: " + streamLatestSnapshot.askOutbound)
    console.log("BID PRICE: " + streamLatestSnapshot.bidOutbound)

    if (slippagePercentageBid.greaterThan(defaultPair.slippage) && 
        orderType == OrderType.bid
    ) {
        publishMessage("eth-usdt-tx-1", "transaction_rejected", {
            reason: "Bid - Price exceeded slippage"
        })

        slippageExceeded = true
    }

    if (slippagePercentageAsk.greaterThan(defaultPair.slippage) && 
        orderType == OrderType.ask
    ) {
        publishMessage("eth-usdt-tx-1", "transaction_rejected", {
            reason: "Ask - Price exceeded slippage"
        })
        
        slippageExceeded = true
    }
    
    console.log("ORDER TYPE: " + OrderType[orderType])
    console.log("PRICE: " + price.toFixed(5))
    console.log("SLIPPAGE EXCEEDED: " + slippageExceeded)

    return !slippageExceeded
}

async function txSuccess(hash: String) {
    $(`#${hash}`).append("<p style=\"color:green\">RFQ Order filled successfully</p>")

    publishMessage("eth-usdt-tx-1", "transaction_filled", {
        hash: hash
    })
}

async function txFail(hash: String, reason: String) {
    $(`#${hash}`).append("<p style=\"color:red\">Filling RFQ Order failed</p>")

    publishMessage("eth-usdt-tx-1", "transaction_failed", {
        hash: hash,
        reason: reason
    })
}

function publishMessage(channel: string, type: string, data: any) {
    pubnub.publish({
        channel: channel,
        message: {
            content: {
                type: type,
                data: data
            },
            sender: uuid
        },
        meta: {
            uuid: pubnub.getUUID()
        }
    })
}


function appendTransactionToList(data: any, hash: string) {
    let pElement = document.createElement('p')
    pElement.setAttribute("id", hash)
    pElement.appendChild(document.createTextNode(JSON.stringify({
        signature: data.limitOrderSignature,
        ...data.limitOrder,
        makerAmount: data.makerAmount,
        takerAmount: data.takerAmount,
        type: data.type
    }, null, 4)))

    $("#trade-execution-list").append(pElement)
}

function appendPriceToList(data: any) {
    let pElement = document.createElement('p')
    pElement.appendChild(document.createTextNode(JSON.stringify({
        ...data,
    }, null, 4)))

    $("#stream-scrollable-feed").append(pElement)
    $("#stream-scrollable-feed").scrollTop($("#stream-scrollable-feed")[0].scrollHeight)
}

$(document).ready(async function () {
    $("#end-session").hide()

    await updateAccountData()

    $("#streaming-prices-frames").hide()
    $("#start-streaming").on("click", async function () {
        if (!streamingPrices && !await _validateBalance()) {
            return;
        }

        streamingPrices = !streamingPrices

        if (streamingPrices) {
           startStreamingPrices();
        } else {
            stopStreamingPrices();
        }
    })

    $("#generate-keyset").on("click", function () {
        generateKeyset()
    })

    $("#sender-session-balance-refresh").on("click", function () {
        updateETHBalance()
    })

    $("#sender-session-session-activate").on("click", function () {
        createSession()
    })

    $("#end-session").on("click", function () {
        endSession()
    })

    $("#sender-session-private-key-copy").on("click", async function () {
        copyToClipboard($("#sender-session-private-key-input").val().toString())
    })

    $("#sender-session-private-key-input").on("input", async function () {
        try {
            generateKeyset($("#sender-session-private-key-input").val().toString())
            updatePublicKey()
        } catch (err) {
        }
    })

    $("#update-allowance-token0").on("click", async function () {
        const provider = new ethers.providers.Web3Provider(window.ethereum)
        const token0Contract = new ethers.Contract(defaultPair.token0, ERC20ABI, provider)

        const newAllowance = new Decimal($("#amount-token0-approved").val().toString()).mul(new Decimal(10).pow(defaultPair.token0Dec))
        await token0Contract.connect(provider.getSigner(0)).approve(Config.limitOrderProtocolAddress, newAllowance.toFixed())
    })

    $("#update-allowance-token1").on("click", async function () {
        const provider = new ethers.providers.Web3Provider(window.ethereum)
        const token0Contract = new ethers.Contract(defaultPair.token1, ERC20ABI, provider)

        const newAllowance = new Decimal($("#amount-token1-approved").val().toString()).mul(new Decimal(10).pow(defaultPair.token1Dec))
        await token0Contract.connect(provider.getSigner(0)).approve(Config.limitOrderProtocolAddress, newAllowance.toFixed())
    })

    setInterval(function () {
        updateETHBalance()
        //updateAllowance()
    }, 1000)
})

function stopStreamingPrices() {
    $("#start-streaming").text("Start streaming")
    $("#streaming-prices-frames").hide()

    streamingPrices = false;
}

function startStreamingPrices() {
    $("#start-streaming").text("Stop streaming")
    $("#streaming-prices-frames").show()

    $("#amount-slippage").val(defaultPair.slippage.toString())
    $("#amount-slippage").on("change", function () {
        const slippage = new Decimal($("#amount-slippage").val() + '')
        console.log("Slippage: " + slippage)

        defaultPair.slippage = new Decimal(slippage)
    })

    streamingPrices = true;
}


function copyToClipboard(text: string) {
    var $temp = $("<input>")
    $("body").append($temp)
    $temp.val(text).select()
    document.execCommand("copy")
    $temp.remove()
}

async function updateAllowance() {
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    const tokenContract0 = new ethers.Contract(defaultPair.token0, ERC20ABI, provider)
    const tokenContract1 = new ethers.Contract(defaultPair.token1, ERC20ABI, provider)

    const takerAddress = await provider.getSigner(0).getAddress()
    const allowanceToken0 = new Decimal((await tokenContract0
        .connect(takerAddress)
        .allowance(takerAddress, Config.limitOrderProtocolAddress))
        .toString())
        .div(new Decimal(10).pow(defaultPair.token0Dec))
        
    const allowanceToken1 = new Decimal((await tokenContract1
        .connect(takerAddress)
        .allowance(takerAddress, Config.limitOrderProtocolAddress))
        .toString())
        .div(new Decimal(10).pow(defaultPair.token1Dec))

    $("#amount-token0-approved").val(allowanceToken0.toFixed(8))
    $("#amount-token1-approved").val(allowanceToken1.toFixed(8))

}

async function privateKeyToPublic(privateKey: string) {
    if (!privateKey)
        return "No private key"

    try {
        const provider = new ethers.providers.Web3Provider(window.ethereum)
        const wallet = new ethers.Wallet(privateKey.replace("0x", ""), provider)

        return await wallet.getAddress()
    } catch (err) {
        return "Invalid private key"
    }
}

async function generateKeyset(privateKey?: string) {
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    const signer = provider.getSigner(0)
    const wallet = ethers.Wallet.createRandom()

    localStorage.setItem('session-maker', JSON.stringify({
        session_private_key: privateKey ? privateKey : wallet.privateKey,
        session_creator: await signer.getAddress()
    }))

    $("#sender-session-private-key-input").val(wallet.privateKey)

    updatePublicKey()
}

async function _validateBalance(): Promise<boolean> {
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    const signerAddress = await provider.getSigner(0).getAddress()

    const tokenContract0 = new ethers.Contract(defaultPair.token0, ERC20ABI, provider)
    const tokenContract1 = new ethers.Contract(defaultPair.token1, ERC20ABI, provider)

    const maxToken0 = BigNumber.from(defaultPair.maxToken0.toString()).mul(BigNumber.from(10).pow(defaultPair.token0Dec))
    const maxToken1 = BigNumber.from(defaultPair.maxToken1.toString()).mul(BigNumber.from(10).pow(defaultPair.token1Dec))

    const token0Balance = await tokenContract0.balanceOf(signerAddress)
    const token1Balance = await tokenContract1.balanceOf(signerAddress)
    const token0Allowance = await tokenContract0.allowance(signerAddress, Config.limitOrderProtocolAddress)
    const token1Allowance = await tokenContract1.allowance(signerAddress, Config.limitOrderProtocolAddress)

    if (maxToken0.gt(token0Balance) || maxToken0.gt(token0Allowance)) {
        $("<div>Token0 allowance or balance is lower than maximum order value</div>").dialog();

        return false
    }

    if (maxToken1.gt(token1Balance) || maxToken1.gt(token1Allowance)) {
        $("<div>Token1 allowance or balance is lower than maximum order value</div>").dialog();

        return false
    }

    return true
}

async function updatePublicKey() {
    const publicKey = await privateKeyToPublic($("#sender-session-private-key-input").val().toString())
    console.log(publicKey)

    $("#current-session-key").text(publicKey)
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
            alert("Minimum session length is 120 seconds")
            return
        }

        if (localStorage.getItem('session-maker') == null)
            return

        const session = JSON.parse(localStorage.getItem('session-maker'))

        const signer = provider.getSigner(0)
        const expirationTime = Math.round(Date.now() / 1000) + sessionLength

        const result = await LOPContract.connect(signer)
            .createOrUpdateSession(
                await privateKeyToPublic(session.session_private_key),
                expirationTime
            )
        await provider.waitForTransaction(result.hash)

        updateSessionData()
    } catch (err) {

    }
}



async function updateAccountData() {
    const provider = new ethers.providers.Web3Provider(window.ethereum)

    console.log("ABCD: " + localStorage.getItem('session-maker') != null)

    if (localStorage.getItem('session-maker') != null) {
        const session = JSON.parse(localStorage.getItem('session-maker'))

        $("#current-session-key").val(await privateKeyToPublic(session.session_private_key))
        $("#sender-session-private-key-input").val(session.session_private_key)
    }

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

    updatePublicKey()
    updateETHBalance()
    updateAllowance()

    try {
        const signer = provider.getSigner(0)

        $("#public-key").text(await signer.getAddress())
        updateSessionData()
    } catch (err) {
        $("#public-key").text("Not connected to provider")
        console.error(err)
    }
}

async function updateETHBalance() {
    if (localStorage.getItem('session-maker') != "null") {
        const session = JSON.parse(localStorage.getItem('session-maker'))
        const provider = new ethers.providers.Web3Provider(window.ethereum)
        const sessionBalance = await provider.getBalance(await privateKeyToPublic(session.session_private_key))
        $("#sender-session-balance").text(ethers.utils.formatEther(sessionBalance) + " ETH")
    } else {
        $("#sender-session-balance").text("No private key")
    }
}

async function endSession() {
    try {
        const provider = new ethers.providers.Web3Provider(window.ethereum)
        const LOPContract = new ethers.Contract(Config.limitOrderProtocolAddress, Config.limitOrderProtocolABI, provider)
        const signer = provider.getSigner(0)

        const result = await LOPContract.connect(signer).endSession()
        await provider.waitForTransaction(result.hash)

        updateSessionData()
    } catch (err) {
        console.error(err)
        clearSessionData()
    }
}

let timeLeftInterval: NodeJS.Timer

function clearSessionData() {
    $("#private-key").val("No session")
    $("#session-active-key").text("No session")
    $("#session-exp").text("No session")
    $("#session-time-left").text("No session")
    $("#end-session").hide()

    clearInterval(timeLeftInterval)
}

async function updateSessionData() {
    if (localStorage.getItem('session-maker') == "null") {
        clearSessionData()

        return
    }

    const session = JSON.parse(localStorage.getItem('session-maker'))
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    const LOPContract = new ethers.Contract(Config.limitOrderProtocolAddress, Config.limitOrderProtocolABI, provider)
    const signer = provider.getSigner(0)
    const signerAddress = await signer.getAddress()

    const expirationTime = await LOPContract.connect(signer).sessionExpirationTime(signerAddress)
    const expirationDate = new Date(Number(expirationTime.toString()) * 1000)
    const dateNow = new Date().getTime() / 1000

    clearInterval(timeLeftInterval)

    if (expirationTime > dateNow) {
        $("#end-session").show()
        $("#private-key").val(session.session_private_key)
        $("#session-active-key").text(await privateKeyToPublic(session.session_private_key))
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
                clearSessionData()
            }
        }, 1000)
    } else {
        clearSessionData()
    }
}

