import { Injectable } from '@angular/core';
import * as PubNub from "pubnub";
import { ConnectionInfo } from '../../models/connection-info';

@Injectable({
  providedIn: 'root'
})
export class LiveRateService {

  constructor() { }

  getLiveRate(config: ConnectionInfo) {
    const pubnub_client = new PubNub(config.pubNubClient);
    pubnub_client.subscribe(config.settings);
    return pubnub_client;
  }
}
