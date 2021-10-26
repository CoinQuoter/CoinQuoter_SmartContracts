import { BigNumber, Contract, ethers } from 'ethers'
import { OrderType } from './models/order_type'
import { BinanceStreamSnapshot } from './models/binance_stream_snapshot'
import { TokenPair } from './models/token_pair';
import { html, render } from 'lit'
import { RFQOrder } from 'limit-order-protocol-lldex'
import MakerConfig from './Maker_Config.json'

import PubNub from 'pubnub'
import Decimal from 'decimal.js'
import $ from 'jquery'
import OrderDecoder from './utils/order_decoder'
import Config from './utils/config'
import ERC20ABI from './abi/ERC20ABI.json'

import 'jquery-ui/ui/widgets/dialog';
import 'jquery-ui/ui/widgets/accordion';
import { LimitOrder } from './models/limit_order';
import { SignedLimitOrder } from './models/signed_limit_order';
import { DealBlotterRow } from './models/deal_blotter_row';
import BinanceConfig from './utils/binance_config';
import { PostedTransaction } from './models/posted_transaction';
import { Web3Provider } from '@ethersproject/providers';

var createHmac = require('create-hmac')

declare global {
    interface Window {
        ethereum: any
    }
}

interface ConnectInfo {
    chainId: string
}

var streamLatestSnapshot: Map<string, BinanceStreamSnapshot> = new Map<string, BinanceStreamSnapshot>();
var postedTransactions: Map<string, PostedTransaction> = new Map<string, PostedTransaction>();
var gasPrice: BigNumber = BigNumber.from(0)
var web3Provider: ethers.providers.BaseProvider;

const uuid = PubNub.generateUUID()
const pubnubQuoteClient = new PubNub({
    publishKey: Config.pubNubQuotePublishKey,
    subscribeKey: Config.pubNubQuoteSubscribeKey,
    uuid: uuid
})

const pubnubOrdersClient = new PubNub({
    publishKey: Config.pubNubOrderPublishKey,
    subscribeKey: Config.pubNubOrderSubscribeKey,
    uuid: uuid
})

pubnubOrdersClient.addListener({
    message: function (event) {
        const evtData = event.message.content

        if (evtData.type == 'action' && evtData.method == 'execute_order') {
            const messageFrom = event.publisher;

            _confirmOrder(
                evtData.data, 
                event.message.sender, 
                event.channel,
                messageFrom
            )
        }
    },
    presence: function (event) {
        console.log(event.uuid + ' has joined orders channel.')
    }
})

pubnubQuoteClient.addListener({
    presence: function (event) {
        console.log(event.uuid + ' has joined quotes channel.')
    }
})

async function _confirmOrder(
    data: SignedLimitOrder, 
    sender: string, 
    channel: string, 
    publisher: string
) {
    const limitOrder: RFQOrder = data.limitOrder;
    const pair: TokenPair = Config.pairs.find(x => {
        return ((x.token0 === limitOrder.makerAsset.toString() && x.token1 === limitOrder.takerAsset.toString()) || 
            (x.token0 === limitOrder.takerAsset.toString() && x.token1 === limitOrder.makerAsset.toString())) &&
            x.channelName + Config.quoteExecutionsMarker == channel.toString()
    }
    );

    if (!pair) {
        publishOrderMessage(limitOrder, 
            'transaction_rejected', 
            {
                reason: 'Maker and taker token does not belong to any available pair'
            }
        )

        return
    }
    
    const streamingPrices: boolean = $(`#start-${pair.mappingBinance}`).is(':checked')
    const autoAccept: boolean = $(`#auto-accept-${pair.mappingBinance}`).is(':checked')
    const autoHedge: boolean = $(`#auto-hedge-${pair.mappingBinance}`).is(':checked')

    if (!streamingPrices)
        return

    if (!autoAccept) {
        const confirmation = window.confirm(`Incoming RFQ fill order from ${sender}.\nType: ${data.type == OrderType.bid ? 'BID' : 'ASK'}\ntaker amount: ${data.takerAmount}\nmaker amount: ${data.makerAmount}`)
        if (!confirmation)
            return
    }

    if (localStorage.getItem('session-maker') == null)
        return

    const session = JSON.parse(localStorage.getItem('session-maker'))

    const signer = new ethers.Wallet(session.session_private_key, web3Provider)
    const contract: Contract = new ethers.Contract(
        Config.limitOrderProtocolAddress,
        Config.limitOrderProtocolABI,
        web3Provider
    )

    let takerAmount: string = '0'
    let makerAmount: string = '0'
    let makerFeeAmount: Decimal = new Decimal(0);

    /*
        Bid order 
    */
    if (data.type == OrderType.bid) {
        takerAmount = new Decimal(data.takerAmount)
            //.add('1000000000000000')
            .add(makerFeeAmount
                .mul(new Decimal(10)
                .pow(pair.token0Dec)))
                .toFixed()

        // makerAmount = new Decimal(data.makerAmount).add('1000000000000000').toFixed()
    }
    else  {
    /*
        Ask order 
    */
        takerAmount = new Decimal(data.takerAmount)
            .add(makerFeeAmount
                .mul(new Decimal(10)
                .pow(pair.token0Dec)))
                .toFixed()
    }

    /*
        Deal blotter row
    */
    var blotterRow: DealBlotterRow = {
        takerAddress: '',
        orderType: '',
        amountToken0: '',
        amountToken1: '',
        price: ''
    }

    try {
        if (!_validateOrder(pair, data.limitOrder, blotterRow)) {
            return
        }

        if (autoHedge && !await _binanceCreateOrder(pair, data.limitOrder)) {
            _appendRowToBlotter(pair, blotterRow, '-', 'Auto hedging with Binance failed');

            publishOrderMessage(limitOrder, 'transaction_failed', {
                hash: '-',
                reason: 'Auto hedging with Binance failed'
            })

            return;
        }

        //await _approveDelegation();

        // const AAVEBridgeABI = [
        //     "function borrow(address maker, address borrowToken, uint256 amountBorrow) public",
        //     "function depositAndBorrow(address maker, address depositToken, address borrowToken, uint256 amountDeposit, uint256 amountBorrow) public"
        // ]

        // const bridgeIface = new ethers.utils.Interface(AAVEBridgeABI);
        // const dataEncoded = bridgeIface.encodeFunctionData("depositAndBorrow", [ 
        //     "0xA4CcEF1A4f039346DD72115a958712A65BF2f155", // Maker address
        //     "0xbd21a10f619be90d6066c941b04e340841f1f989", // Deposit USDT
        //     "0x3c68ce8504087f89c640d02d133646d98e64ddd9", // Borrow WETH
        //     "10000000", // Deposit 10 USDT
        //     "5000000000000000" // Borrow 0.05 WETH
        // ])

        const dataEncoded = ethers.utils.defaultAbiCoder.encode(['address', 'address', 'uint256', 'uint256'], 
        [
            '0xbd21a10f619be90d6066c941b04e340841f1f989', // Deposit token
            '0x3c68ce8504087f89c640d02d133646d98e64ddd9', // Borrow token
            '10000000', // Deposit amount - 10 USDT
            '5000000000000000' // Borrow amount - 0.05 WETH
        ])

        // const dataEncoded = bridgeIface.encodeFunctionData("borrow", [
        //     "0x000000000",
        //     "0xA4CcEF1A4f039346DD72115a958712A65BF2f155", // Maker address
        //     "0x3c68ce8504087f89c640d02d133646d98e64ddd9", // Borrow WETH
        //     "5000000000000000" // Borrow 0.05 WETH
        // ])

        const result = await contract.connect(signer).fillOrderRFQCallPeriphery(
            data.limitOrder,
            data.limitOrderSignature,
            takerAmount,
            makerAmount,
            MakerConfig.aaveBridge, // Bridge address
            dataEncoded,
            {gasLimit: 1000000}
        )

        // const result = await contract.connect(signer).fillOrderRFQ(
        //     data.limitOrder,
        //     data.limitOrderSignature,
        //     takerAmount,
        //     makerAmount,
        //     {gasLimit: 1000000}
        // )

        _appendRowToBlotter(pair, blotterRow, result.hash);
        publishOrderMessage(limitOrder, 'transaction_posted', {
            hash: result.hash
        })

        postedTransactions.set(result.hash, {
            order: limitOrder,
            pair: pair
        });

        const receipt = await web3Provider.waitForTransaction(result.hash, 1)

        if (receipt.status == 0) {
            txFail(
                limitOrder, 
                result.hash, 
                'Unknown error'
            )

            return;
        }

        txSuccess(limitOrder, result.hash)
    } catch (err) {
        if (err?.transaction?.hash) {
            _appendRowToBlotter(pair, blotterRow, err.transaction.hash);

            txFail(
                limitOrder, 
                err.transaction.hash, 
                err.data?.message ?? ''
            )
        } else {
            const errorMessage = err.data?.message ?? 'Unknown error'
            
            txFail(
                limitOrder, 
                '-', 
                errorMessage
            )
        }
    }
}

async function _approveDelegation() {
    const _web3Provider = new ethers.providers.Web3Provider(window.ethereum)
    const _signer = _web3Provider.getSigner(0)

    // AAVE Lending pool contract - Mumbai testnet
    const contractAAVELendingPool: Contract = new ethers.Contract(
        "0x0f2656e068b77cda65213ef25705b728d5c73340",
        [
            "function approveDelegation(address delegatee, uint256 amount)"
        ],
        _web3Provider
    )  

    const contractERC20: Contract = new ethers.Contract(
        "0xbd21a10f619be90d6066c941b04e340841f1f989",
        ERC20ABI,
        _web3Provider
    )  

    const resultApproveToken = await contractERC20
        .connect(_signer)
        .approve(
            MakerConfig.aaveBridge, // Address of AAVE bridge
            "9999999999999999999999999" // Approve amount
        )
    await _web3Provider.waitForTransaction(resultApproveToken.hash)

    const resultApproveDelegation = await contractAAVELendingPool
        .connect(_signer)
        .approveDelegation(
            MakerConfig.aaveBridge, // Address of AAVE bridge
            "9999999999999999999999999" // Approve amount
        )
    await _web3Provider.waitForTransaction(resultApproveDelegation.hash)
}

function _appendRowToBlotter(pair: TokenPair,blotterRow: DealBlotterRow, hash: String, status: String = 'Confirmed') {
    $(`#${pair.mappingBinance}-deal-blotter`).append(`
    <tr>
        <td>${blotterRow.takerAddress}</td>
        <td>${blotterRow.orderType}</td>
        <td id='${hash}-amount-in'>${blotterRow.amountToken0}</td>
        <td id='${hash}-amount-out'>${blotterRow.amountToken1}</td>
        <td>${blotterRow.price}</td>
        <td>${new Date(Date.now()).toLocaleString()}</td>
        <td><a href="${Config.networkScannerURL}/${hash}" target="_blank">${hash}</a></td>
        <td id='${hash}-deal-status' style='color: red'>${status}</td>
    </tr>`);
}

async function _binanceCreateOrder(pair: TokenPair, order: RFQOrder): Promise<boolean> {
    try {
        const takerAssetData = OrderDecoder.decodeAssetData(order.takerAssetData)
        const makerAssetData = OrderDecoder.decodeAssetData(order.makerAssetData)
        const orderType: OrderType = order.takerAsset == pair.token0 ? OrderType.bid : OrderType.ask

        const amountToken0 = (orderType == OrderType.bid ? new Decimal(takerAssetData.amount) : new Decimal(makerAssetData.amount))
            .div(new Decimal(10)
            .pow(pair.token0Dec))

        const queryString = {
            symbol: pair.mappingBinance.toUpperCase(),
            side: orderType == OrderType.bid ? 
                'SELL' : 
                'BUY',
            type: 'MARKET',
            ...(orderType == OrderType.bid && { quantity : amountToken0.toFixed(8) }),
            ...(orderType == OrderType.ask && { quoteOrderQty : amountToken0.toFixed(8) }),
            timestamp: Date.now(),
            recvWindow: 50000
        }

        // Create sha256 signature from query string
        const signature = _queryToSignature(queryString);

        var startTime = performance.now()

        const result = await $.post({
            url: `${BinanceConfig.testnetURL}/order`,
            data: {
                ...queryString,
                signature: signature,
            },
            headers: {
                'X-MBX-APIKEY': BinanceConfig.testnetAPIKey,
            },
        });

        var endTime = performance.now()

        return true;
    } catch(err) {
        console.error('Binance API error occured: ' + JSON.stringify(err));

        return false;
    }

}

async function _binancePrintBalance() {
    try {
        const queryString = {
            timestamp: Date.now(),
            recvWindow: 50000
        }

        // Create sha256 signature from query string
        const signature = _queryToSignature(queryString);

        const result = await $.get({
            url: `${BinanceConfig.testnetURL}/account`,
            data: {
                ...queryString,
                signature: signature,
            },
            headers: {
                'X-MBX-APIKEY': BinanceConfig.testnetAPIKey,
            },
        });

        console.log('Balance: ' + JSON.stringify(result, null, 2));

        return true;
    } catch(err) {
        console.error('Binance API error occured: ' + JSON.stringify(err));

        return false;
    }
}

async function _binancePrintTrades() {
    try {
        const queryString = {
            symbol: 'ETHUSDT',
            timestamp: Date.now(),
            recvWindow: 50000
        }

        // Create sha256 signature from query string
        const signature = _queryToSignature(queryString);

        const result = await $.get({
            url: `${BinanceConfig.testnetURL}/myTrades`,
            data: {
                ...queryString,
                signature: signature,
            },
            headers: {
                'X-MBX-APIKEY': BinanceConfig.testnetAPIKey,
            },
        });

        console.log('Previous transactions: ' + JSON.stringify(result, null, 2));

        return true;
    } catch(err) {
        console.error('Binance API error occured: ' + JSON.stringify(err));

        return false;
    }
}

function _queryToSignature(query: any) {
    return createHmac('sha256', Buffer.from(BinanceConfig.testnetSecretKey))
        .update($.param(query))
        .digest('hex')
}

function _validateOrder(pair: TokenPair, order: RFQOrder, blotterRow: DealBlotterRow): boolean {
    const takerAssetData = OrderDecoder.decodeAssetData(order.takerAssetData)
    const makerAssetData = OrderDecoder.decodeAssetData(order.makerAssetData)

    if (takerAssetData.fromAddress != makerAssetData.toAddress || 
        takerAssetData.toAddress != makerAssetData.fromAddress) {
        publishOrderMessage(order, 'transaction_rejected', {
            reason: 'Invalid taker/makerAssetData'
        })

        _appendRowToBlotter(pair, blotterRow, '-', 'Invalid\ntaker/makerAssetData');

        return
    }

    const orderType: OrderType = order.takerAsset == pair.token0 ? OrderType.bid : OrderType.ask
    
    var amountToken0 = new Decimal(takerAssetData.amount)
        .div(new Decimal(10)
        .pow(orderType == OrderType.bid ? pair.token0Dec: pair.token1Dec))

    var amountToken1 = new Decimal(makerAssetData.amount)
        .div(new Decimal(10)
        .pow(orderType == OrderType.bid ? pair.token1Dec: pair.token0Dec))

    const price = orderType == OrderType.bid ? 
        amountToken1.div(amountToken0) : 
        amountToken0.div(amountToken1)

    const blotterAmountToken0 = amountToken0;
    const blotterAmountToken1 = amountToken1;

    blotterRow.takerAddress = takerAssetData.fromAddress;
    blotterRow.orderType = OrderType[orderType];
    blotterRow.amountToken0 = blotterAmountToken0.toFixed(5);
    blotterRow.amountToken1 = blotterAmountToken1.toFixed(5);
    blotterRow.price = price.toFixed(5);

    var rejectMaxAmount: boolean = false

    if (orderType == OrderType.ask) {
        const t = amountToken0;

        amountToken0 = amountToken1;
        amountToken1 = t;
    }

    console.log("amountToken0 " + amountToken0);
    console.log("amountToken1 " + amountToken1);

    console.log("pair.maxToken0 " + pair.maxToken0);
    console.log("pair.maxToken1 " + pair.maxToken1);

    if (amountToken0.greaterThan(pair.maxToken0) && orderType == OrderType.ask) {
        publishOrderMessage(order, 'transaction_rejected', {
            reason: 'Max amount of token0 exceeded by ' + (amountToken0.sub(pair.maxToken0).toString())
        })

        rejectMaxAmount = true
    }

    if (amountToken1.greaterThan(pair.maxToken1) && orderType == OrderType.bid) {
        publishOrderMessage(order, 'transaction_rejected', {
            reason: 'Max amount of token1 exceeded by ' + (amountToken1.sub(pair.maxToken1).toString())
        })

        rejectMaxAmount = true
    }

    if (rejectMaxAmount) {
        _appendRowToBlotter(pair, blotterRow, '-', 'Max amount of token0 or token1 exceeded');

        return
    }

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

    if (slippagePercentageBid.greaterThan(pair.slippage) && 
        orderType == OrderType.bid
    ) {
        publishOrderMessage(order, 'transaction_rejected', {
            reason: 'Bid - Price exceeded slippage'
        })

        slippageExceeded = true
    }

    if (slippagePercentageAsk.greaterThan(pair.slippage) && 
        orderType == OrderType.ask
    ) {
        publishOrderMessage(order, 'transaction_rejected', {
            reason: 'Ask - Price exceeded slippage'
        })
        
        slippageExceeded = true
    }

    if (slippageExceeded)
        _appendRowToBlotter(pair, blotterRow, '-', 'Slippage exceeded');

    return !slippageExceeded
}

async function txSuccess(order: RFQOrder, hash: String) {
    $(`#${hash}-deal-status`).text('Filled').css('color', 'green');

    publishOrderMessage(order, 'transaction_filled', {
        hash: hash
    })

    Config.pairs.forEach(async function(pair) {
        const streamingPrices: boolean = $(`#start-${pair.mappingBinance}`).is(':checked')

        setTimeout(async function() {
            if (streamingPrices && !await _validateBalance(pair)) {
                _stopStreamingPrices(pair);

                return;
            }
        }, 1000);
    })
}

async function txFail(order: RFQOrder, hash: String, reason: String) {
    $(`#${hash}-deal-status`).text(`Failed: ${reason}`).css('color', 'red');

    publishOrderMessage(order, 'transaction_failed', {
        hash: hash,
        reason: reason
    })
}

function orderToChannelId(order: RFQOrder) {
    return OrderDecoder.decodeInfo(order.info).orderId
}

function publishOrderMessage(order: RFQOrder, type: string, data: any) {
    publishMessage(orderToChannelId(order), type, data);
}

function publishMessage(channel: string, type: string, data: any) {
    pubnubOrdersClient.publish({
        channel: channel,
        message: {
            content: {
                type: type,
                data: data
            },
            sender: uuid
        },
        meta: {
            uuid: pubnubOrdersClient.getUUID()
        }
    })
}

$(document).ready(async function () {
    await updateAccountData()

    _initializePairs();
    _initializePubNub();
    _initalizeLOPEvents();

    $('#generate-keyset').on('click', async function () {
        await generateKeyset()

        if (localStorage.getItem('session-maker') == null)
            return

        const session = JSON.parse(localStorage.getItem('session-maker'))
        $('#sender-session-private-key-input').val(session.session_private_key)

        updatePublicKey()
    })

    $('#sender-session-balance-refresh').on('click', function () {
        updateETHBalance()
    })

    $('#sender-session-session-activate').on('click', function () {
        createSession()
    })

    $('#end-session').on('click', function () {
        endSession()
    })

    $('#sender-session-private-key-copy').on('click', async function () {
        copyToClipboard($('#sender-session-private-key-input').val().toString())
    })

    $('#sender-session-private-key-input').on('input', async function () {
        try {
            await generateKeyset($('#sender-session-private-key-input').val().toString())
            updatePublicKey()
        } catch (err) {
        }
    })

    $('#public-key').on('input', async function () {
        try {
            localStorage.setItem('external-public-key', $('#public-key').val().toString())
            updateAccountData();
        } catch (err) {
        }
    })

    setInterval(function () {
        updateETHBalance()
    }, 5000)

    setInterval(async function() {
        Config.pairs.forEach(async function(pair) {
            const streamingPrices: boolean = $(`#start-${pair.mappingBinance}`).is(':checked')

            if (streamingPrices && !await _validateBalance(pair)) {
                _stopStreamingPrices(pair);

                return;
            }
        })

    }, 300000);
})

function _initalizeLOPEvents() {
    const LOPContract = new ethers.Contract(
        Config.limitOrderProtocolAddress, 
        Config.limitOrderProtocolABI, 
        web3Provider
    )

    LOPContract.on("OrderFilledRFQ", (orderHash, takingAmount, makingAmount, event) => {
        const hash = event.transactionHash;
        if (!postedTransactions.has(hash))
            return;

        const transaction: PostedTransaction = postedTransactions.get(hash);

        const takerAssetData = OrderDecoder.decodeAssetData(transaction.order.takerAssetData)
        const makerAssetData = OrderDecoder.decodeAssetData(transaction.order.makerAssetData)

        const orderType: OrderType = transaction.order.takerAsset == transaction.pair.token0 ? 
            OrderType.bid : 
            OrderType.ask

        const amountToken0 = new Decimal(takerAssetData.amount)
            .div(new Decimal(10)
            .pow(orderType == OrderType.bid ? transaction.pair.token0Dec: transaction.pair.token1Dec))

        const amountToken1 = new Decimal(makerAssetData.amount)
            .div(new Decimal(10)
            .pow(orderType == OrderType.bid ? transaction.pair.token1Dec: transaction.pair.token0Dec))

        $(`#${hash}-amount-in`).text($(`#${hash}-amount-in`).text() + '\n(' + amountToken0.toFixed(5) + ')');
        $(`#${hash}-amount-out`).text($(`#${hash}-amount-out`).text() + '\n(' + amountToken1.toFixed(5) + ')');
    });
}

function _initializePubNub() {
    pubnubOrdersClient.subscribe({
        channels: Config.pairs.map(x => x.channelName + Config.quoteExecutionsMarker),
        withPresence: true
    })
}

async function _initializePairs() {
    for (const pair of Config.pairs) {
        await _appendPair(pair);
    }
}

async function _appendPair(pair: TokenPair) {
    const token0Contract = new ethers.Contract(pair.token0, ERC20ABI, web3Provider)
    const token1Contract = new ethers.Contract(pair.token1, ERC20ABI, web3Provider)
    const token0Symbol = await token0Contract.symbol();
    const token1Symbol =  await token1Contract.symbol();
    const token0Decimals = await token0Contract.decimals();
    const token1Decimals =  await token1Contract.decimals();
    const tokenPairName = token0Symbol + ' / ' + token1Symbol;

    pair.token0Dec = token0Decimals
    pair.token1Dec = token1Decimals

    _initBinanceStream(pair);

    const _pair = html`        
    <div class='accordion'>
        <h3>${tokenPairName}</h3>
        <div>
            <div id='controls' style='margin: 0px; padding: 0px;'>
                <fieldset id='${pair.mappingBinance}-streaming-controls'>
                    <legend>Price streaming: </legend>
                    <label for='start-${pair.mappingBinance}'>START</label>
                        <input type='radio' name='${pair.mappingBinance}' id='start-${pair.mappingBinance}' value='START'>
                    <label for='stop-${pair.mappingBinance}'>STOP</label>
                        <input type='radio' name='${pair.mappingBinance}' id='stop-${pair.mappingBinance}' value='STOP' checked>
                </fieldset>
            </div>
            <div id='${pair.mappingBinance}-stream'>
                <p style='padding-top: 5px;'>Streaming now: </p>

                <div class='row' id='${pair.mappingBinance}-stream-prices'>
                    <div id='inbound-prices' class='column'>
                        <h3 style='margin: 0px; padding: 0px;'>Inbound: </h3>

                        <div class='row'>
                            <p class='column' id='bid-label-inbound'>Bid: </p>
                            <p class='column' id='${pair.mappingBinance}-bid-inbound'>-</p>
                        </div>

                        <div class='row'>
                            <p class='column' id='ask-label-inbound'>Ask: </p>
                            <p class='column' id='${pair.mappingBinance}-ask-inbound'>-</p>
                        </div>
                    </div>

                    <div id='outbound-prices' class='column'>
                        <h3 style='margin: 0px; padding: 0px;'>Outbound: </h3>

                        <div class='row'>
                            <p class='column' id='bid-label-outbound'>Bid: </p>
                            <p class='column' id='${pair.mappingBinance}-bid-outbound'>-</p>
                        </div>

                        <div class='row'>
                            <p class='column' id='ask-label-outbound'>Ask: </p>
                            <p class='column' id='${pair.mappingBinance}-ask-outbound'>-</p>
                        </div>
                    </div>
                </div>
            </div>

            <div class='row'>
                <div class='column' style='padding-top: 10px;'>
                    <div>
                        <p style='display:inline;'>Bid spread: </p>
                            <input type='number' id='${pair.mappingBinance}-bid-spread' name='${pair.mappingBinance}-bid-spread' value='${pair.spreadBid}'><br>
                    </div>
                    <div>
                        <p style='display:inline;'>Ask spread: </p>
                            <input type='number' id='${pair.mappingBinance}-ask-spread' name='${pair.mappingBinance}-ask-spread' value='${pair.spreadAsk}'><br>
                    </div>
                    <div>
                        <p style='display:inline;'>Slippage in %: </p>
                            <input type='number' id='${pair.mappingBinance}-slippage' name='${pair.mappingBinance}-slippage' value='${pair.slippage}'>
                    </div>
                </div>
                <div class='column'>
                    <div id='${pair.mappingBinance}-allowance' style='padding-top: 10px;'>
                        <p style='display:inline'>Allowance: </p>
                            <input type='number' id='${pair.mappingBinance}-amount-token0-approved' name='${pair.mappingBinance}-amount-token0-approved'>
                        <p style='display:inline'>${token0Symbol}</p>
                            <input id='${pair.mappingBinance}-update-allowance-token0' type='submit' value='Approve' style='float: right;' />
                    </div>
                    <div>
                        <p style='display:inline'>Allowance: </p>
                            <input type='number' id='${pair.mappingBinance}-amount-token1-approved' name='${pair.mappingBinance}-amount-token1-approved'>
                        <p style='display:inline'>${token1Symbol}</p>
                            <input id='${pair.mappingBinance}-update-allowance-token1' type='submit' value='Approve' style='float: right;' />
                    </div>
                </div>
            </div>

            <hr>

            <div class='row'>
                <div class='column' style='padding-top: 10px;'>
                    <div>
                        <p style='display:inline;'>Max ${token0Symbol} per trade: </p>
                            <input type='number' id='${pair.mappingBinance}-max-token0' name='${pair.mappingBinance}-max-token0' value='${pair.maxToken0}'>
                        <p style='display:inline; padding-left: 5px;'>${token0Symbol} balance: </p>
                        <p style='display:inline;' id='${pair.mappingBinance}-balance-token0'>-</p><br>
                    </div>
                    <div>
                        <p style='display:inline;'>Max ${token1Symbol} per trade: </p>
                            <input type='number' id='${pair.mappingBinance}-max-token1' name='${pair.mappingBinance}-max-token1' value='${pair.maxToken1}'>
                        <p style='display:inline; padding-left: 5px;'>${token1Symbol} balance: </p>
                        <p style='display:inline;' id='${pair.mappingBinance}-balance-token1'>-</p><br>
                    </div>
                    <div>
                        <p style='display:inline;'>Gas fee in ${token0Symbol} : </p>
                        <p style='display:inline;' id='${pair.mappingBinance}-gas-fee'>-</p><br>
                    </div>
                </div>
            </div>
            <div class='row'>
                <div class='column'>
                    <input type='checkbox' id='auto-accept-${pair.mappingBinance}' name='auto-accept-${pair.mappingBinance}' checked>
                    <label for='auto-accept-${pair.mappingBinance}'>Auto accept incoming orders</label>
                </div>

                <div class='column'>
                    <input style='padding-left: 10px;' type='checkbox' id='auto-hedge-${pair.mappingBinance}' name='auto-hedge-${pair.mappingBinance}'>
                    <label for='auto-hedge-${pair.mappingBinance}'>Auto hedge with binance</label>
                </div>

                <!-- <div class='column'>
                    <input id='print-binance-balance' type='submit' value='Print binance balance' style='float: right;' />
                </div> -->
            </div>
            <div class='row' style='padding-top: 12px'>
                <p style='display:inline;'>Deal blotter: </p><br>
                <div style='padding-left: 5px; overflow:hidden; overflow-y:scroll; max-height:200px; width:100%'>
                    <table id='${pair.mappingBinance}-deal-blotter'>
                        <tr>
                            <th>Taker</th>
                            <th>Type</th>
                            <th>Amount in</th>
                            <th>Amount out</th>
                            <th>Price</th>
                            <th>Timestamp</th>
                            <th>Hash</th>
                            <th>Status</th>
                        </tr>
                    </table>
                </div>
            </div>
        </div>
    </div>`;
    
    const divRender = document.createElement('div');
    render(_pair, divRender);
 
    $('#pairs').append(divRender)
    $('.accordion').accordion({collapsible: true, active: false, heightStyle: 'content'});
    $(`#${pair.mappingBinance}-stream`).hide();

    _attachEventsToPair(pair);
    _updateAllowanceData(pair);
    _updateBalanceData(pair);
}

function _initBinanceStream(pair: TokenPair) {
    const streamBNB = new WebSocket(`${BinanceConfig.testnetWebSocket}/${pair.mappingBinance}@depth5@1000ms`)
    streamBNB.onopen = function (_) {
        console.log(`Connected to binance ${pair.mappingBinance} pricing stream`)
    }

    streamBNB.onmessage = async function (evt) {
        const streamingPrices: boolean = $(`#start-${pair.mappingBinance}`).is(':checked')
        const evtJson = JSON.parse(evt.data)

        if (!evtJson.bids)
            return;

        const streamSnapshot = _convertMessageToSnapshot(evtJson, pair);
        const contentToSend = await _parseStreamMessage(evtJson, pair, streamSnapshot);
        _updatePairWithSnapshot(pair, streamSnapshot);

        if (streamingPrices) {
            pubnubQuoteClient.publish({
                channel: pair.channelName,
                message: {
                    content: {
                        type: 'stream_depth',
                        data: contentToSend
                    },
                    sender: uuid
                },
                meta: {
                    uuid: pubnubQuoteClient.getUUID()
                }
            })
        }
    }
}

function _attachEventsToPair(pair: TokenPair) {
    $(`#start-${pair.mappingBinance}`).on('change', async function(value) {
        if (!await _validateBalance(pair)) {
            _stopStreamingPrices(pair);

            return;
        }

        $(`#${pair.mappingBinance}-stream`).show();
    });

    
    $(`#print-binance-balance`).on('click', async function(value) {
        _binancePrintBalance();
        _binancePrintTrades();
    });

    $(`#stop-${pair.mappingBinance}`).on('change', async function(value) {
        _stopStreamingPrices(pair);
    });

    $(`#${pair.mappingBinance}-bid-spread`).on('change', function () {
        const spread = new Decimal($(`#${pair.mappingBinance}-bid-spread`).val() + '')

        pair.spreadBid = new Decimal(spread);
    });

    $(`#${pair.mappingBinance}-ask-spread`).on('change', function () {
        const spread = new Decimal($(`#${pair.mappingBinance}-ask-spread`).val() + '')

        pair.spreadAsk = new Decimal(spread);
    });

    $(`#${pair.mappingBinance}-slippage`).on('change', function () {
        const slippage = new Decimal($(`#${pair.mappingBinance}-slippage`).val() + '')

        pair.slippage = new Decimal(slippage);
    });

    $(`#${pair.mappingBinance}-max-token0`).on('change', function () {
        const maxToken0 = new Decimal($(`#${pair.mappingBinance}-max-token0`).val() + '')
        // pair.maxToken0 = new Decimal(maxToken0);

        _validateBalance(pair);
    });

    $(`#${pair.mappingBinance}-max-token1`).on('change', function () {
        const maxToken1 = new Decimal($(`#${pair.mappingBinance}-max-token1`).val() + '')
        // pair.maxToken1 = new Decimal(maxToken1);

        _validateBalance(pair);
    });

    $(`#${pair.mappingBinance}-update-allowance-token0`).on('click', async function() {
        if (typeof window.ethereum === 'undefined')
            return;

        const web3Provider = new ethers.providers.Web3Provider(window.ethereum)
        const token0Contract = new ethers.Contract(pair.token0, ERC20ABI, web3Provider)

        const newAllowance = new Decimal($(`#${pair.mappingBinance}-amount-token0-approved`).val().toString()).mul(new Decimal(10).pow(pair.token0Dec))
        const result = await token0Contract.connect(web3Provider.getSigner(0)).approve(Config.limitOrderProtocolAddress, newAllowance.toFixed())
        await web3Provider.waitForTransaction(result.hash);

        Config.pairs.forEach(x => _updateAllowanceData(x));
    });

    $(`#${pair.mappingBinance}-update-allowance-token1`).on('click', async function() {
        if (typeof window.ethereum === 'undefined')
            return;

        const web3Provider = new ethers.providers.Web3Provider(window.ethereum)
        const token1Contract = new ethers.Contract(pair.token1, ERC20ABI, web3Provider)

        const newAllowance = new Decimal($(`#${pair.mappingBinance}-amount-token1-approved`).val().toString()).mul(new Decimal(10).pow(pair.token1Dec))
        const result = await token1Contract.connect(web3Provider.getSigner(0)).approve(Config.limitOrderProtocolAddress, newAllowance.toFixed())
        await web3Provider.waitForTransaction(result.hash);

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

    let makerWalletAddress = $('#public-key').val().toString()
    const transactionGasFee: Decimal = new Decimal(gasPrice.toString())
        .mul(Config.fillOrderRFQEstimatedGasUsage)
        .div(new Decimal(10)
            .pow(pair.token0Dec));

    const contentToSend: LimitOrder = {
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
        gasFee: transactionGasFee.toFixed(0),
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
    var $temp = $('<input>')
    $('body').append($temp)
    $temp.val(text).select()
    document.execCommand('copy')
    $temp.remove()
}

async function _updateBalanceData(pair: TokenPair) {
    try {
        const tokenContract0 = new ethers.Contract(pair.token0, ERC20ABI, web3Provider)
        const tokenContract1 = new ethers.Contract(pair.token1, ERC20ABI, web3Provider)

        const makerAddress = getExternalPublicKey()
        if (!makerAddress)
            return;

        const balanceToken0 = new Decimal((await tokenContract0
            .balanceOf(makerAddress))
            .toString())
            .div(new Decimal(10).pow(pair.token0Dec))
            
        const balanceToken1 = new Decimal((await tokenContract1
            .balanceOf(makerAddress))
            .toString())
            .div(new Decimal(10).pow(pair.token1Dec))
        
        gasPrice = await web3Provider.getGasPrice();
        const transactionGasFee: Decimal = new Decimal(gasPrice.toString())
            .mul(Config.fillOrderRFQEstimatedGasUsage)
            .div(new Decimal(10)
                .pow(pair.token0Dec));

        $(`#${pair.mappingBinance}-balance-token0`).text(balanceToken0.toFixed(8))
        $(`#${pair.mappingBinance}-balance-token1`).text(balanceToken1.toFixed(8))
        $(`#${pair.mappingBinance}-gas-fee`).text('0')
    } catch (err) {
        console.error('Failed to update balances: ' + err)
    }
}

async function _updateAllowanceData(pair: TokenPair) {
    const tokenContract0 = new ethers.Contract(pair.token0, ERC20ABI, web3Provider)
    const tokenContract1 = new ethers.Contract(pair.token1, ERC20ABI, web3Provider)

    const makerAddress = getExternalPublicKey()
    const allowanceToken0 = new Decimal((await tokenContract0
        .allowance(makerAddress, Config.limitOrderProtocolAddress))
        .toString())
        .div(new Decimal(10).pow(pair.token0Dec))
        
    const allowanceToken1 = new Decimal((await tokenContract1
        .allowance(makerAddress, Config.limitOrderProtocolAddress))
        .toString())
        .div(new Decimal(10).pow(pair.token1Dec))

    if (!$(`#${pair.mappingBinance}-amount-token0-approved`).is(':focus'))
        $(`#${pair.mappingBinance}-amount-token0-approved`).val(allowanceToken0.toFixed(8))

    if (!$(`#${pair.mappingBinance}-amount-token1-approved`).is(':focus'))
        $(`#${pair.mappingBinance}-amount-token1-approved`).val(allowanceToken1.toFixed(8))
}

async function privateKeyToPublic(privateKey: string) {
    if (!privateKey)
        return 'No private key'

    try {
        const wallet = new ethers.Wallet(privateKey.replace('0x', ''), web3Provider)

        return await wallet.getAddress()
    } catch (err) {
        return 'Invalid private key'
    }
}

async function generateKeyset(privateKey?: string) {
    const wallet = ethers.Wallet.createRandom()

    localStorage.setItem('session-maker', JSON.stringify({
        session_private_key: privateKey ? privateKey : wallet.privateKey,
    }))

    updatePublicKey()
}

async function _validateBalance(pair: TokenPair): Promise<boolean> {
    try {
        const signerAddress = getExternalPublicKey();

        const tokenContract0 = new ethers.Contract(pair.token0, ERC20ABI, web3Provider)
        const tokenContract1 = new ethers.Contract(pair.token1, ERC20ABI, web3Provider)

        const maxToken0 = new Decimal($(`#${pair.mappingBinance}-max-token0`).val() as number).mul(new Decimal(10).pow(pair.token0Dec)).toFixed(0)
        const maxToken1 = new Decimal($(`#${pair.mappingBinance}-max-token1`).val() as number).mul(new Decimal(10).pow(pair.token1Dec)).toFixed(0)

        const token0Balance = new Decimal((await tokenContract0.balanceOf(signerAddress)).toString())
        const token1Balance = new Decimal((await tokenContract1.balanceOf(signerAddress)).toString())
        const token0Allowance = new Decimal((await tokenContract0.allowance(signerAddress, Config.limitOrderProtocolAddress)).toString())
        const token1Allowance = new Decimal((await tokenContract1.allowance(signerAddress, Config.limitOrderProtocolAddress)).toString())

        const minToken0 = Decimal.min(token0Allowance, token0Balance, maxToken0)
        const minToken1 = Decimal.min(token1Allowance, token1Balance, maxToken1)

        const minToken0Scaled = minToken0.div(new Decimal(10).pow(pair.token0Dec));
        const minToken1Scaled = minToken1.div(new Decimal(10).pow(pair.token1Dec))

        pair.maxToken0 = minToken0Scaled; 
        pair.maxToken1 = minToken1Scaled;

        if (minToken0.gt(token0Balance) || minToken0.gt(token0Allowance)) {
            $('<div>Token0 allowance or balance is lower than maximum order value</div>').dialog();

            return false
        }

        if (minToken1.gt(token1Balance) || minToken1.gt(token1Allowance)) {
            $('<div>Token1 allowance or balance is lower than maximum order value</div>').dialog();

            return false
        }

        return true
    } catch(_) {
        return false
    }
}

async function updatePublicKey() {
    const publicKey = await privateKeyToPublic($('#sender-session-private-key-input').val().toString())

    $('#current-session-key').text(publicKey)
}

async function createSession() {
    try {
        const web3Provider = new ethers.providers.Web3Provider(window.ethereum)
        const LOPContract = new ethers.Contract(
            Config.limitOrderProtocolAddress,
            Config.limitOrderProtocolABI,
            web3Provider
        )

        const sessionLength = Number($('#sender-session-length-input').val().toString())

        if (sessionLength < 120) {
            alert('Minimum session length is 120 seconds')
            return
        }

        if (localStorage.getItem('session-maker') == null)
            return

        const session = JSON.parse(localStorage.getItem('session-maker'))

        const signer = web3Provider.getSigner(0)
        const expirationTime = Math.round(Date.now() / 1000) + sessionLength

        const result = await LOPContract.connect(signer)
            .createOrUpdateSession(
                await privateKeyToPublic(session.session_private_key),
                expirationTime
            )
        await web3Provider.waitForTransaction(result.hash)

        updateSessionData()
    } catch (err) {

    }
}

function updateProvider() {
    if (typeof window.ethereum !== 'undefined' && !localStorage.getItem('external-public-key')) {
        web3Provider = new ethers.providers.Web3Provider(window.ethereum)
    } else {
        web3Provider = ethers.getDefaultProvider(Config.defaultNetwork)
    }
    web3Provider.pollingInterval = 100
}

function getExternalPublicKey() {
    return $('#public-key').val().toString();
}

async function updateAccountData() {
    try {
        updateProvider()

        const ethInjected = typeof window.ethereum !== 'undefined'

        if (localStorage.getItem('session-maker') != null) {
            const session = JSON.parse(localStorage.getItem('session-maker'))

            if (!session?.session_private_key) {
                localStorage.removeItem('session-maker');
            }

            $('#current-session-key').val(await privateKeyToPublic(session.session_private_key))
            $('#sender-session-private-key-input').val(session.session_private_key)
        }

        if (ethInjected) {
            window.ethereum.on('accountsChanged', async (accounts: any) => {
                const web3Provider = new ethers.providers.Web3Provider(window.ethereum)
                const signer = web3Provider.getSigner(0)
                web3Provider.pollingInterval = 100

                $('#public-key').val(await signer.getAddress())
                updateSessionData()
            })
        }

        if (ethInjected) {
            window.ethereum.on('connect', async (connectInfo: ConnectInfo) => {
                const web3Provider = new ethers.providers.Web3Provider(window.ethereum)
                const signer = web3Provider.getSigner(0)
                web3Provider.pollingInterval = 100

                const externalPublicKey: string = localStorage.getItem('external-public-key');

                if (externalPublicKey && externalPublicKey.startsWith('0x')) {
                    $('#public-key').val(externalPublicKey)
                    updateSessionData()

                    return;
                }

                $('#public-key').val(await signer.getAddress())
                updateSessionData()
            })
        }

        updatePublicKey()
        updateETHBalance()

        try {
            const externalPublicKey: string = localStorage.getItem('external-public-key');

            if (externalPublicKey && externalPublicKey.startsWith('0x')) {
                $('#public-key').val(externalPublicKey)
                updateSessionData()

                return;
            }

            const web3Provider = new ethers.providers.Web3Provider(window.ethereum)
            const signer = web3Provider.getSigner(0)
            $('#public-key').val(await signer.getAddress())

            updateSessionData()
        } catch (err) {
            console.error(err)
        }
    } catch(err) {
        console.error(err);
    }
}

function hasSession() {
    return localStorage.getItem('session-maker') && localStorage.getItem('session-maker') != 'null'
}

async function updateETHBalance() {
    try {
        if (hasSession()) {
            const session = JSON.parse(localStorage.getItem('session-maker'))

            if (session?.session_private_key) {
                const sessionBalance = await web3Provider.getBalance(await privateKeyToPublic(session.session_private_key))
                $('#sender-session-balance').text(ethers.utils.formatEther(sessionBalance) + ' ETH')
            }
        } else {
            $('#sender-session-balance').text('No private key')
        }

        Config.pairs.forEach(x => {
            _updateBalanceData(x)
            _validateBalance(x)
        });
    } catch (err) {
        console.error('Failed to get balance: ' + err);
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
    $('#private-key').val('No session')
    $('#session-active-key').text('No session')
    $('#session-exp').text('No session')
    $('#session-time-left').text('No session')
    $('#end-session').hide()

    clearInterval(timeLeftInterval)
}

async function updateSessionData() {
    if (!hasSession()) {
        clearSessionData()

        return
    }

    const session = JSON.parse(localStorage.getItem('session-maker'))
    const LOPContract = new ethers.Contract(Config.limitOrderProtocolAddress, Config.limitOrderProtocolABI, web3Provider)
    const signerAddress = getExternalPublicKey()

    const expirationTime = await LOPContract.sessionExpirationTime(signerAddress)
    const sessionKeyBlockchain = await LOPContract.session(signerAddress)
    const expirationDate = new Date(Number(expirationTime.toString()) * 1000)
    const dateNow = new Date().getTime() / 1000

    clearInterval(timeLeftInterval)

    if (expirationTime > dateNow) {
        $('#end-session').show()
        $('#private-key').val(session.session_private_key)
        $('#session-active-key').text(sessionKeyBlockchain.sessionKey.toString())
        $('#session-exp').text(expirationDate.toString())

        timeLeftInterval = setInterval(async function () {
            var now = new Date().getTime()
            var distance = expirationDate.getTime() - now

            var days = Math.floor(distance / (1000 * 60 * 60 * 24))
            var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
            var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
            var seconds = Math.floor((distance % (1000 * 60)) / 1000)

            $('#session-time-left').text(days + 'd ' + hours + 'h ' + minutes + 'm ' + seconds + 's ')

            if (distance / 1000 < 60) {
                $('#bid-button').prop('disabled', true)
                $('#ask-button').prop('disabled', true)
            }

            if (distance < 0) {
                clearSessionData()
            }
        }, 1000)
    } else {
        clearSessionData()
    }
}

