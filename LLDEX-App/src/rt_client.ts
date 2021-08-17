import { LimitOrderBuilder, LimitOrderPredicateBuilder, LimitOrderPredicateCallData, LimitOrderProtocolFacade, PrivateKeyProviderConnector } from "@1inch/limit-order-protocol";
import * as PubNub from "pubnub";
import Web3 from "web3"
import Decimal from 'decimal.js';
import * as $ from "jquery";
import { ethers } from "ethers";

let allowanceFetched = false;

let takerLastPacket: any;
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
        $("#amount-in-token").text($("#token-sell option:selected").text());

        allowanceFetched = false;
    });

    $("#token-buy").on("change", function () {
        $("#amount-out-token").text($("#token-buy option:selected").text());

        allowanceFetched = false;
    });

    $("select").on('focus', function () {
        $("select").find("option[value='" + $(this).val() + "']").prop('disabled', false);
    }).on("change", function () {
        $("select").not(this).find("option[value='" + $(this).val() + "']").prop('disabled', true);
    });

    $("#update-allowance-sell-token").on("click", async function () {
        const provider = new ethers.providers.Web3Provider(window.ethereum)
        const token0Contract = new ethers.Contract($("#token-sell").data("token"), ABIERC20, provider)

        const newAllowance = new Decimal($("#amount-in-approved").val().toString()).mul(new Decimal(10).pow($("#token-sell").data("tokenDecimals")))
        await token0Contract.connect(provider.getSigner(0)).approve(takerLastPacket.contractAddress, newAllowance.toFixed())

        allowanceFetched = false;
    });

    $("#end-session").hide();

    updateAccountData();
})

window.addEventListener('DOMContentLoaded', (event) => {
    const bidButton = <HTMLInputElement>document.getElementById('bid-button');
    const askButton = <HTMLInputElement>document.getElementById('ask-button');

    const privateKeyInput = <HTMLInputElement>document.getElementById('private-key');
    const amountInput = <HTMLInputElement>document.getElementById('amount-in');
    const amountOutput = <HTMLInputElement>document.getElementById('amount-out');

    privateKeyInput.value = localStorage.getItem('private-key');

    // savePrivateKeyButton.addEventListener('click', () => {
    //     if (privateKeyInput.value.length == 64)
    //         localStorage.setItem('private-key', privateKeyInput.value);
    // });

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

    function updateButtons(data: any) {
        bidButton.value = "BID:" + data.bid;
        askButton.value = "ASK:" + data.ask;

        bidButton.dataset.data = JSON.stringify(data);
    }

    async function sign1InchOrder(privateKey: string, type: TxType, data: any) {
        const web3 = new Web3(window.ethereum);
        const account = web3.eth.accounts.privateKeyToAccount(privateKey)
        const walletAddress = account.address;
        const providerConnector = new PrivateKeyProviderConnector(localStorage.getItem('private-key'), web3);

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

        console.log("Tx count: " + await web3.eth.getTransactionCount(data.takerAddress));

        const limitOrder = limitOrderBuilder.buildRFQOrder({
            id: (await web3.eth.getTransactionCount(data.takerAddress)) + 1,
            expiresInTimestamp: Math.round(Date.now() / 1000) + 60_000,
            makerAssetAddress: makerAssetAddres,
            takerAssetAddress: takerAssetAddres,
            makerAddress: walletAddress,
            takerAddress: data.takerAddress,
            makerAmount: amountIn,
            takerAmount: amountOut
        });

        const resultEIP712 = limitOrderBuilder.buildRFQOrderTypedData(limitOrder);

        const limitOrderSignature = await limitOrderBuilder.buildOrderSignature(
            walletAddress,
            resultEIP712
        );

        const signedData = await providerConnector.signTypedData(walletAddress, resultEIP712);

        return {
            makerAmount: amountIn,
            takerAmonut: amountOut,
            signedData: signedData,
            limitOrderSignature: limitOrderSignature,
            limitOrder: limitOrder,
        };
    }

    async function publishMessageToTaker(type: TxType) {
        const privateKey = localStorage.getItem('private-key');
        const oneInchOrder = await sign1InchOrder(privateKey, type, JSON.parse(bidButton.dataset.data));

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
                        signedData: oneInchOrder.signedData,
                        limitOrderSignature: oneInchOrder.limitOrderSignature,
                        limitOrder: oneInchOrder.limitOrder,
                    }
                },
                sender: uuid_client
            }
        });
    }
});


async function updateAccountData() {
    const provider = new ethers.providers.Web3Provider(window.ethereum)

    window.ethereum.on('accountsChanged', async (accounts: any) => {
        const signer = provider.getSigner(0)
        $("#public-key").text(await signer.getAddress())
    })

    window.ethereum.on('connect', async (connectInfo: ConnectInfo) => {
        const signer = provider.getSigner(0)
        $("#public-key").text(await signer.getAddress())
    });

    try {
        const signer = provider.getSigner(0)

        $("#public-key").text(await signer.getAddress())
    } catch (err) {
        $("#public-key").text("Not connected to provider");
        console.error(err);
    }
}