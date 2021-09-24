import { Injectable } from '@angular/core';
import * as PubNub from "pubnub";
import { ConnectionInfo } from '../../models/connection-info';
import { ELocalstorageNames } from '../../enums/localstorage-names.constants';

@Injectable({
  providedIn: 'root'
})
export class PubnubService {

  constructor() { }

  private static generatePubNubUUID(): string {
    const uuid = PubNub.generateUUID();
    localStorage.setItem(ELocalstorageNames.PUBNUB_UUID, uuid);
    return uuid;
  }

  connect(config: ConnectionInfo): PubNub {
    const pubnub_client = this.createClient(config);
    pubnub_client.subscribe(config.settings);
    return pubnub_client;
  }

  private createClient(config: ConnectionInfo) {
    const uuid = this.getUUID();
    const pubNubConfigClient = {...config.pubNubClient, uuid: uuid};
    return new PubNub(pubNubConfigClient);
  }

  publishData(config: ConnectionInfo, data: any) {
    const pubnub_client = this.createClient(config);
    pubnub_client.publish(data);
  }

  getUUID() {
    return localStorage.getItem(ELocalstorageNames.PUBNUB_UUID) ?? PubnubService.generatePubNubUUID();
  }
}
