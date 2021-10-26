import { Injectable } from '@angular/core';
import * as PubNub from "pubnub";
import { ConnectionInfo } from '../../models/connection-info';
import { ELocalstorageNames } from '../../enums/localstorage-names.constants';
import { PubnubQuoteConfig, PubnubOrdersConfig } from '../../constants/config.constants';
import { PubNubKeyset } from 'app/shared/models/pubnub-keyset';

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

  connect(config: ConnectionInfo, keyset: PubNubKeyset): PubNub {
    const pubnub_client = this.createClient(keyset);
    pubnub_client.subscribe(config.settings);
    return pubnub_client;
  }

  private createClient(keyset: PubNubKeyset) {
    const uuid = this.getUUID();
    const pubNubConfigClient = {...keyset, uuid: uuid};
    return new PubNub(pubNubConfigClient);
  }

  publishData(config: ConnectionInfo, data: any) {
    const pubnub_client = this.createClient(PubnubOrdersConfig);
    pubnub_client.publish(data);
  }

  getUUID() {
    return localStorage.getItem(ELocalstorageNames.PUBNUB_UUID) ?? PubnubService.generatePubNubUUID();
  }
}
