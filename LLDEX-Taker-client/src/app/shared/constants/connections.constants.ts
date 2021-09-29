import { ConnectionInfo } from '../models/connection-info';
import * as PubNub from "pubnub";


export const WETH_DAI: ConnectionInfo = {
  title: "WETH/DAI",
  settings: {
    channels: ['eth-usdt-1'],
    withPresence: true
  }
}

export const WETH_LLDEX: ConnectionInfo = {
  title: "WETH/LLDEX",
  settings: {
    channels: ['btc-usdt-1'],
    withPresence: true
  }
}
