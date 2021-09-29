import { Inject, Injectable, InjectionToken } from '@angular/core';
import { providers, ethers } from 'ethers';

export const WEB3PROVIDER = new InjectionToken('Web 3 provider', {
  providedIn: 'root',
  factory: () => (window as any).ethereum
});

@Injectable({
  providedIn: 'root'
})
export class ProviderService extends providers.Web3Provider{

  web3Provider = WEB3PROVIDER;

  constructor(@Inject(WEB3PROVIDER) web3Provider) {
    super(web3Provider ?? ethers.providers.Provider);
  }
}
