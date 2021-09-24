import { ConnectionInfo } from '../models/connection-info';
import * as PubNub from "pubnub";


export const WETH_DAI: ConnectionInfo = {
  title: "WETH/DAI",
  pubNubClient: {
    publishKey: "pub-dd76188a-d8cc-42cf-9625-335ef44bb3a1",
    subscribeKey: "sub-4c298de8-a12e-11e1-bd35-5d12de0b12ad",
  },
  settings: {
    channels: ['eth-usdt-tx'],
    withPresence: true
  }
}
