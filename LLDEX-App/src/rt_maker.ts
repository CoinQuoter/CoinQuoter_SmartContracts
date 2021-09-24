import { BigNumber, Contract, ethers } from "ethers"
import { OrderType } from "./models/order_type"
import { BinanceStreamSnapshot } from "./models/binance_stream_snapshot"
import { TokenPair } from "./models/token_pair";
import { html, render } from 'lit'
import { RFQOrder } from "limit-order-protocol-lldex"

import PubNub from "pubnub"
import Decimal from 'decimal.js'
import $ from "jquery"
import OrderDecoder from "./utils/order_decoder"
import Config from "./utils/config"
import ERC20ABI from './abi/ERC20ABI.json'

import "jquery-ui/ui/widgets/dialog";
import "jquery-ui/ui/widgets/accordion";

declare global {
    interface Window {
        ethereum: any
    }
}

interface ConnectInfo {
    chainId: string
}

var streamLatestSnapshot: Map<string, BinanceStreamSnapshot> = new Map<string, BinanceStreamSnapshot>();

const uuid = PubNub.generateUUID()
const pubnubClient = new PubNub({
    publishKey: Config.pubNubPublishKey,
    subscribeKey: Config.pubNubSubscribeKey,
    uuid: uuid
})

// const binance = new Binance().options({
//   APIKEY: BinanceConfig.binanceTestnetAPIKey,
//   APISECRET: BinanceConfig.binanceTestnetSecretKey,
// });

pubnubClient.addListener({
    message: function (event) {
        const evtData = event.message.content

        if (evtData.type == "action" && evtData.method == "execute_order") {
            _confirmOrder(evtData.data, event.message.sender, event.channel)
        }
    },
    presence: function (event) {
        let pElement = document.createElement('p')
        pElement.appendChild(document.createTextNode(event.uuid + " has joined."))
        document.body.appendChild(pElement)
    }
})

async function _confirmOrder(data: any, sender: string, channel: string) {
    const limitOrder = data.limitOrder;
    const pair: TokenPair = Config.pairs.find(x => {
        return ((x.token0 === limitOrder.makerAsset.toString() && x.token1 === limitOrder.takerAsset.toString()) || 
            (x.token0 === limitOrder.takerAsset.toString() && x.token1 === limitOrder.makerAsset.toString())) &&
            x.channelName == channel.toString()
    }
    );

    if (!pair) {
        publishMessage(channel, "transaction_rejected", {
            reason: "Maker and taker token does not belong to any available pair"
        })

        return
    }
    
    const streamingPrices: boolean = $(`#start-${pair.mappingBinance}`).is(":checked")
    const autoAccept: boolean = $(`#auto-accept-${pair.mappingBinance}`).is(":checked")

    if (!streamingPrices)
        return

    if (!autoAccept) {
        const confirmation = window.confirm(`Incoming RFQ fill order from ${sender}.\nType: ${data.type == OrderType.bid ? "BID" : "ASK"}\ntaker amount: ${data.takerAmount}\nmaker amount: ${data.makerAmount}`)
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

    let takerAmount: string = "0"
    let makerAmount: string = "0"
    let makerFeeAmount: Decimal = new Decimal(0);

    /*
        Bid order 
    */
    if (data.type == OrderType.bid) {
        makerAmount = new Decimal(data.makerAmount)
            .add(makerFeeAmount
                .mul(new Decimal(10)
                .pow(pair.token0Dec)))
                .toFixed()
    }
    else  {
    /*
        Ask order 
    */
        makerAmount = new Decimal(data.makerAmount)
            .add(makerFeeAmount
                .mul(new Decimal(10)
                .pow(pair.token1Dec)))
                .toFixed()
    }

    try {
        if (!_validateOrder(pair, data.limitOrder)) {
            return
        }

        const result = await contract.connect(signer).fillOrderRFQ(
            data.limitOrder,
            data.limitOrderSignature,
            takerAmount,
            makerAmount,
            { gasLimit: 1000000 }
        )

        $(`#${channel}-logs`).append("<li style=\"color:blue\">RFQ Order posted on blockchain</li>")

        publishMessage(pair.channelName, "transaction_posted", {
            hash: result.hash
        })

        await provider.waitForTransaction(result.hash)
        txSuccess(pair.channelName, result.hash)
    } catch (err) {
        console.error(err)

        if (err.transaction.hash) {
            txFail(
                pair.channelName, 
                err.transaction.hash, 
                err.data?.message ?? ''
            )
        }
    }
}

function _validateOrder(pair: TokenPair, order: RFQOrder): boolean {
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
        publishMessage(pair.channelName, "transaction_rejected", {
            reason: "Invalid taker/makerAssetData"
        })

        return
    }

    const orderType: OrderType = order.takerAsset == pair.token0 ? OrderType.bid : OrderType.ask
    const price = orderType == OrderType.bid ? 
        new Decimal(makerAssetData.amount).div(new Decimal(takerAssetData.amount)) : 
        new Decimal(takerAssetData.amount).div(new Decimal(makerAssetData.amount))
    
    const amountToken0 = (orderType == OrderType.bid ? new Decimal(takerAssetData.amount) : new Decimal(makerAssetData.amount))
        .div(new Decimal(10)
        .pow(pair.token0Dec))

    const amountToken1 = (orderType == OrderType.bid ? new Decimal(makerAssetData.amount) : new Decimal(takerAssetData.amount))
        .div(new Decimal(10)
        .pow(pair.token1Dec))

    var _reject: boolean = false

    if (amountToken0.greaterThan(pair.maxToken0)) {
        publishMessage(pair.channelName, "transaction_rejected", {
            reason: "Max amount of token0 exceeded by " + (amountToken0.sub(pair.maxToken0).toString())
        })

        _reject = true
    }

    if (amountToken1.greaterThan(pair.maxToken1)) {
        publishMessage(pair.channelName, "transaction_rejected", {
            reason: "Max amount of token1 exceeded by " + (amountToken1.sub(pair.maxToken1).toString())
        })

        _reject = true
    }

    if (_reject)
        return

    var slippageExceeded = false
    const slippagePercentageBid = price
        .sub(streamLatestSnapshot.get(pair.mappingBinance).bidOutbound)
        .div(price)
        .mul(100)

    const slippagePercentageAsk = price
        .sub(streamLatestSnapshot.get(pair.mappingBinance).askOutbound)
        .mul(-1)
        .div(price)
        .mul(100)

    console.log("Slippage percentage bid: " + slippagePercentageBid)
    console.log("Slippage percentage ask: " + slippagePercentageAsk)
    console.log("ASK PRICE: " + streamLatestSnapshot.get(pair.mappingBinance).askOutbound)
    console.log("BID PRICE: " + streamLatestSnapshot.get(pair.mappingBinance).bidOutbound)

    if (slippagePercentageBid.greaterThan(pair.slippage) && 
        orderType == OrderType.bid
    ) {
        publishMessage(pair.channelName, "transaction_rejected", {
            reason: "Bid - Price exceeded slippage"
        })

        slippageExceeded = true
    }

    if (slippagePercentageAsk.greaterThan(pair.slippage) && 
        orderType == OrderType.ask
    ) {
        publishMessage(pair.channelName, "transaction_rejected", {
            reason: "Ask - Price exceeded slippage"
        })
        
        slippageExceeded = true
    }
    
    console.log("ORDER TYPE: " + OrderType[orderType])
    console.log("PRICE: " + price.toFixed(5))
    console.log("SLIPPAGE EXCEEDED: " + slippageExceeded)

    return !slippageExceeded
}

async function txSuccess(channel: string, hash: String) {
    $(`#${channel}-logs`).append("<li style=\"color:green\">RFQ Order filled successfully</li>")

    publishMessage(channel, "transaction_filled", {
        hash: hash
    })
}

async function txFail(channel: string, hash: String, reason: String) {
    $(`#${channel}-logs`).append("<li style=\"color:red\">Filling RFQ Order failed</li>")

    publishMessage(channel, "transaction_failed", {
        hash: hash,
        reason: reason
    })
}

function publishMessage(channel: string, type: string, data: any) {
    pubnubClient.publish({
        channel: channel,
        message: {
            content: {
                type: type,
                data: data
            },
            sender: uuid
        },
        meta: {
            uuid: pubnubClient.getUUID()
        }
    })

    if (type == "transaction_rejected") {
        $(`#${channel}-logs`).append(`<li style=\"color:red\">Transaction rejected: ${data.reason}</li>`)
    }

    $(`#${channel}-logs`).scrollTop($(`#${channel}-logs`)[0].scrollHeight)
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

$(document).ready(async function () {
    _initializePairs();
    _initializePubNub();

    await updateAccountData()

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

    setInterval(function () {
        updateETHBalance()
    }, 5000)
})

function _initializePubNub() {
    pubnubClient.subscribe({
        channels: Config.pairs.map(x => x.channelName),
        withPresence: true
    })
}

async function _initializePairs() {
    for (const pair of Config.pairs) {
        _appendPair(pair);
    }

}

async function _appendPair(pair: TokenPair) {
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    const token0Contract = new ethers.Contract(pair.token0, ERC20ABI, provider)
    const token1Contract = new ethers.Contract(pair.token1, ERC20ABI, provider)
    const token0Symbol = await token0Contract.symbol();
    const token1Symbol =  await token1Contract.symbol();
    const tokenPairName = token0Symbol + " / " + token1Symbol;

    _initBinanceStream(pair);

    const _pair = html`        
    <div class="accordion">
        <h3>${tokenPairName}</h3>
        <div>
            <div id="controls" style="margin: 0px; padding: 0px;">
                <fieldset id="${pair.mappingBinance}-streaming-controls">
                    <legend>Price streaming: </legend>
                    <label for="start-${pair.mappingBinance}">START</label>
                        <input type="radio" name="${pair.mappingBinance}" id="start-${pair.mappingBinance}" value="START">
                    <label for="stop-${pair.mappingBinance}">STOP</label>
                        <input type="radio" name="${pair.mappingBinance}" id="stop-${pair.mappingBinance}" value="STOP" checked>
                </fieldset>
            </div>
            <div id="${pair.mappingBinance}-stream">
                <p style="padding-top: 5px;">Streaming now: </p>

                <div class="row" id="${pair.mappingBinance}-stream-prices">
                    <div id="inbound-prices" class="column">
                        <h3 style="margin: 0px; padding: 0px;">Inbound: </h3>

                        <div class="row">
                            <p class="column" id="bid-label-inbound">Bid: </p>
                            <p class="column" id="${pair.mappingBinance}-bid-inbound">4.2</p>
                        </div>

                        <div class="row">
                            <p class="column" id="ask-label-inbound">Ask: </p>
                            <p class="column" id="${pair.mappingBinance}-ask-inbound">7.5</p>
                        </div>
                    </div>

                    <div id="outbound-prices" class="column">
                        <h3 style="margin: 0px; padding: 0px;">Outbound: </h3>

                        <div class="row">
                            <p class="column" id="bid-label-outbound">Bid: </p>
                            <p class="column" id="${pair.mappingBinance}-bid-outbound">2.5</p>
                        </div>

                        <div class="row">
                            <p class="column" id="ask-label-outbound">Ask: </p>
                            <p class="column" id="${pair.mappingBinance}-ask-outbound">3.2</p>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row">
                <div class="column" style="padding-top: 10px;">
                    <div>
                        <p style="display:inline;">Bid spread: </p>
                            <input type="number" id="${pair.mappingBinance}-bid-spread" name="${pair.mappingBinance}-bid-spread" value="${pair.spreadBid}"><br>
                    </div>
                    <div>
                        <p style="display:inline;">Ask spread: </p>
                            <input type="number" id="${pair.mappingBinance}-ask-spread" name="${pair.mappingBinance}-ask-spread" value="${pair.spreadAsk}"><br>
                    </div>
                    <div>
                        <p style="display:inline;">Slippage in %: </p>
                            <input type="number" id="${pair.mappingBinance}-slippage" name="${pair.mappingBinance}-slippage" value="${pair.slippage}">
                    </div>
                </div>
                <div class="column">
                    <div id="${pair.mappingBinance}-allowance" style="padding-top: 10px;">
                        <p style="display:inline">Allowance: </p>
                            <input type="number" id="${pair.mappingBinance}-amount-token0-approved" name="${pair.mappingBinance}-amount-token0-approved">
                        <p style="display:inline">${token0Symbol}</p>
                            <input id="${pair.mappingBinance}-update-allowance-token0" type="submit" value="Approve" style="float: right;" />
                    </div>
                    <div>
                        <p style="display:inline">Allowance: </p>
                            <input type="number" id="${pair.mappingBinance}-amount-token1-approved" name="${pair.mappingBinance}-amount-token1-approved">
                        <p style="display:inline">${token1Symbol}</p>
                            <input id="${pair.mappingBinance}-update-allowance-token1" type="submit" value="Approve" style="float: right;" />
                    </div>
                </div>
            </div>

            <hr>

            <div class="row">
                <div class="column" style="padding-top: 10px;">
                    <div>
                        <p style="display:inline;">Max ${token0Symbol} per trade: </p>
                            <input type="number" id="${pair.mappingBinance}-max-token0" name="${pair.mappingBinance}-max-token0" value="${pair.maxToken0}">
                        <p style="display:inline; padding-left: 5px;">${token0Symbol} balance: </p>
                        <p style="display:inline;" id="${pair.mappingBinance}-balance-token0">-</p><br>
                    </div>
                    <div>
                        <p style="display:inline;">Max ${token1Symbol} per trade: </p>
                            <input type="number" id="${pair.mappingBinance}-max-token1" name="${pair.mappingBinance}-max-token1" value="${pair.maxToken1}">
                        <p style="display:inline; padding-left: 5px;">${token1Symbol} balance: </p>
                        <p style="display:inline;" id="${pair.mappingBinance}-balance-token1">-</p><br>
                    </div>
                    <div>
                        <p style="display:inline;">Gas fee in ${token0Symbol} : </p>
                        <p style="display:inline;" id="${pair.mappingBinance}-gas-fee">-</p><br>
                    </div>
                </div>
                <div style="flex: 30%;">
                    <ol id="${pair.channelName}-logs">
                    </ol>
                </div>
            </div>
            <div class="row">
                <input type="checkbox" id="auto-accept-${pair.mappingBinance}" name="auto-accept-${pair.mappingBinance}" checked>
                <label for="auto-accept-${pair.mappingBinance}">Auto accept incoming orders</label>
            </div>

        </div>
    </div>`;
    
    const divRender = document.createElement('div');
    render(_pair, divRender);
 
    $("#pairs").append(divRender)
    $(".accordion").accordion({collapsible: true, active: false, heightStyle: 'content'});
    $(`#${pair.mappingBinance}-stream`).hide();

    _attachEventsToPair(pair);
    _updateAllowanceData(pair);
    _updateBalanceData(pair);
}

function _initBinanceStream(pair: TokenPair) {
    const streamBNB = new WebSocket(`wss://stream.binance.com:9443/ws/${pair.mappingBinance}@depth5@1000ms`)
    streamBNB.onopen = function (_) {
        console.log(`Connected to binance ${pair.mappingBinance} pricing stream`)
    }

    streamBNB.onmessage = async function (evt) {
        const streamingPrices: boolean = $(`#start-${pair.mappingBinance}`).is(":checked")

        if (streamingPrices && !await _validateBalance(pair)) {
            _stopStreamingPrices(pair);

            return;
        }

        const evtJson = JSON.parse(evt.data)

        const streamSnapshot = _convertMessageToSnapshot(evtJson, pair);
        const contentToSend = await _parseStreamMessage(evtJson, pair, streamSnapshot);
        _updatePairWithSnapshot(pair, streamSnapshot);

        console.log(JSON.stringify(contentToSend))

        if (streamingPrices) {
            pubnubClient.publish({
                channel: pair.channelName,
                message: {
                    content: {
                        type: "stream_depth",
                        data: contentToSend
                    },
                    sender: uuid
                },
                meta: {
                    uuid: pubnubClient.getUUID()
                }
            })
        }
    }
}

function _attachEventsToPair(pair: TokenPair) {
    $(`#start-${pair.mappingBinance}`).on("change", async function(value) {
        if (!await _validateBalance(pair)) {
            _stopStreamingPrices(pair);

            return;
        }

        $(`#${pair.mappingBinance}-stream`).show();
    });

    $(`#stop-${pair.mappingBinance}`).on("change", async function(value) {
        _stopStreamingPrices(pair);
    });

    $(`#${pair.mappingBinance}-bid-spread`).on("change", function () {
        const spread = new Decimal($(`#${pair.mappingBinance}-bid-spread`).val() + '')

        pair.spreadBid = new Decimal(spread);
    });

    $(`#${pair.mappingBinance}-ask-spread`).on("change", function () {
        const spread = new Decimal($(`#${pair.mappingBinance}-ask-spread`).val() + '')

        pair.spreadAsk = new Decimal(spread);
    });

    $(`#${pair.mappingBinance}-slippage`).on("change", function () {
        const slippage = new Decimal($(`#${pair.mappingBinance}-slippage`).val() + '')

        pair.slippage = new Decimal(slippage);
    });

    $(`#${pair.mappingBinance}-max-token0`).on("change", function () {
        const maxToken0 = new Decimal($(`#${pair.mappingBinance}-max-token0`).val() + '')

        pair.maxToken0 = new Decimal(maxToken0);
    });

    $(`#${pair.mappingBinance}-max-token1`).on("change", function () {
        const maxToken1 = new Decimal($(`#${pair.mappingBinance}-max-token1`).val() + '')

        pair.maxToken1 = new Decimal(maxToken1);
    });

    $(`#${pair.mappingBinance}-update-allowance-token0`).on("click", async function() {
        const provider = new ethers.providers.Web3Provider(window.ethereum)
        const token0Contract = new ethers.Contract(pair.token0, ERC20ABI, provider)

        const newAllowance = new Decimal($(`#${pair.mappingBinance}-amount-token0-approved`).val().toString()).mul(new Decimal(10).pow(pair.token0Dec))
        const result = await token0Contract.connect(provider.getSigner(0)).approve(Config.limitOrderProtocolAddress, newAllowance.toFixed())
        await provider.waitForTransaction(result.hash);

        Config.pairs.forEach(x => _updateAllowanceData(x));
    });

    $(`#${pair.mappingBinance}-update-allowance-token1`).on("click", async function() {
        const provider = new ethers.providers.Web3Provider(window.ethereum)
        const token1Contract = new ethers.Contract(pair.token1, ERC20ABI, provider)

        const newAllowance = new Decimal($(`#${pair.mappingBinance}-amount-token1-approved`).val().toString()).mul(new Decimal(10).pow(pair.token1Dec))
        const result = await token1Contract.connect(provider.getSigner(0)).approve(Config.limitOrderProtocolAddress, newAllowance.toFixed())
        await provider.waitForTransaction(result.hash);

        Config.pairs.forEach(x => _updateAllowanceData(x));
    });
}

function _convertMessageToSnapshot(evtJson: any, pair: TokenPair): BinanceStreamSnapshot {
    const _bidInbound = new Decimal(evtJson.bids[0][0])
    const _askInbound = new Decimal(evtJson.asks[0][0])

    const streamSnapshot = {
        bidInbound: _bidInbound,
        askInbound: _askInbound,
        bidOutbound: _bidInbound.sub(pair.spreadBid),
        askOutbound: _askInbound.add(pair.spreadAsk),
        lastUpdateId: evtJson.lastUpdateId,
    }

    return streamSnapshot;
}

async function _parseStreamMessage(evtJson: any, pair: TokenPair, streamSnapshot: BinanceStreamSnapshot) {
    const _outboundBidWithDec = new Decimal(streamSnapshot.bidOutbound).mul(new Decimal(10).pow(pair.token0Dec))
    const _outboundAskWithDec = new Decimal(streamSnapshot.askOutbound).mul(new Decimal(10).pow(pair.token1Dec))

    let makerWalletAddress = "0x00"

    try {
        const provider = new ethers.providers.Web3Provider(window.ethereum)
        const signer = provider.getSigner(0)
        makerWalletAddress = await signer.getAddress()
    } catch (e) { }

    const contentToSend = {
        lastUpdateId: evtJson.lastUpdateId,
        bid: streamSnapshot.bidOutbound,
        ask: streamSnapshot.askOutbound,
        bidAmount: _outboundBidWithDec.toString(),
        askAmount: _outboundAskWithDec.toString(),
        makerAddress: makerWalletAddress,
        amount0Address: pair.token0,
        amount1Address: pair.token1,
        amount0Dec: pair.token0Dec,
        amount1Dec: pair.token1Dec,
        maxToken0: pair.maxToken0,
        maxToken1: pair.maxToken1,
        contractAddress: Config.limitOrderProtocolAddress
    }

    return contentToSend;
}

function _updatePairWithSnapshot(pair: TokenPair, streamSnapshot: BinanceStreamSnapshot) {
    $(`#${pair.mappingBinance}-bid-inbound`).text(streamSnapshot.bidInbound.toString())
    $(`#${pair.mappingBinance}-ask-inbound`).text(streamSnapshot.askInbound.toString())
    $(`#${pair.mappingBinance}-bid-outbound`).text(streamSnapshot.bidOutbound.toString())
    $(`#${pair.mappingBinance}-ask-outbound`).text(streamSnapshot.askOutbound.toString())

    streamLatestSnapshot.set(pair.mappingBinance, streamSnapshot);
}

function _stopStreamingPrices(pair: TokenPair) {
    $(`#start-${pair.mappingBinance}`).prop('checked', false);
    $(`#stop-${pair.mappingBinance}`).prop('checked', true);

    $(`#${pair.mappingBinance}-stream`).hide();
}


function copyToClipboard(text: string) {
    var $temp = $("<input>")
    $("body").append($temp)
    $temp.val(text).select()
    document.execCommand("copy")
    $temp.remove()
}

async function _updateBalanceData(pair: TokenPair) {
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    const tokenContract0 = new ethers.Contract(pair.token0, ERC20ABI, provider)
    const tokenContract1 = new ethers.Contract(pair.token1, ERC20ABI, provider)

    const makerAddress = await provider.getSigner(0).getAddress()
    const balanceToken0 = new Decimal((await tokenContract0
        .connect(makerAddress)
        .balanceOf(makerAddress))
        .toString())
        .div(new Decimal(10).pow(pair.token0Dec))
        
    const balanceToken1 = new Decimal((await tokenContract1
        .connect(makerAddress)
        .balanceOf(makerAddress))
        .toString())
        .div(new Decimal(10).pow(pair.token1Dec))
    
    const gasPrice: BigNumber = await provider.getGasPrice();
    const transactionGasFee: Decimal = new Decimal(gasPrice.toString())
        .mul(Config.fillOrderRFQEstimatedGasUsage)
        .div(new Decimal(10)
            .pow(pair.token0Dec));

    $(`#${pair.mappingBinance}-balance-token0`).text(balanceToken0.toFixed(8))
    $(`#${pair.mappingBinance}-balance-token1`).text(balanceToken1.toFixed(8))
    $(`#${pair.mappingBinance}-gas-fee`).text(transactionGasFee.toFixed(8));
}

async function _updateAllowanceData(pair: TokenPair) {
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    const tokenContract0 = new ethers.Contract(pair.token0, ERC20ABI, provider)
    const tokenContract1 = new ethers.Contract(pair.token1, ERC20ABI, provider)

    const makerAddress = await provider.getSigner(0).getAddress()
    const allowanceToken0 = new Decimal((await tokenContract0
        .connect(makerAddress)
        .allowance(makerAddress, Config.limitOrderProtocolAddress))
        .toString())
        .div(new Decimal(10).pow(pair.token0Dec))
        
    const allowanceToken1 = new Decimal((await tokenContract1
        .connect(makerAddress)
        .allowance(makerAddress, Config.limitOrderProtocolAddress))
        .toString())
        .div(new Decimal(10).pow(pair.token1Dec))

    if (!$(`#${pair.mappingBinance}-amount-token0-approved`).is(":focus"))
        $(`#${pair.mappingBinance}-amount-token0-approved`).val(allowanceToken0.toFixed(8))

    if (!$(`#${pair.mappingBinance}-amount-token1-approved`).is(":focus"))
        $(`#${pair.mappingBinance}-amount-token1-approved`).val(allowanceToken1.toFixed(8))
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

async function _validateBalance(pair: TokenPair): Promise<boolean> {
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    const signerAddress = await provider.getSigner(0).getAddress()

    const tokenContract0 = new ethers.Contract(pair.token0, ERC20ABI, provider)
    const tokenContract1 = new ethers.Contract(pair.token1, ERC20ABI, provider)

    const maxToken0 = BigNumber.from(pair.maxToken0.mul(new Decimal(10).pow(pair.token0Dec)).toFixed(0))
    const maxToken1 = BigNumber.from(pair.maxToken1.mul(new Decimal(10).pow(pair.token1Dec)).toFixed(0))

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
    //updateAllowance()

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

    Config.pairs.forEach(x => {
        _updateBalanceData(x)
    });
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

