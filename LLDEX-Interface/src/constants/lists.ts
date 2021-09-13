import { IS_ON_APP_URL } from './misc'

const BA_LIST = 'https://raw.githubusercontent.com/The-Blockchain-Association/sec-notice-list/master/ba-sec-list.json'
export const HARDHAT_LIST = 'http://localhost:3000/hardhat_token_list.json'
// only load blocked list if on app url
export const UNSUPPORTED_LIST_URLS: string[] = IS_ON_APP_URL ? [BA_LIST] : []

// lower index == higher priority for token import
export const DEFAULT_LIST_OF_LISTS: string[] = [
  HARDHAT_LIST,
  ...UNSUPPORTED_LIST_URLS, // need to load unsupported tokens as well
]

// default lists to be 'active' aka searched across
export const DEFAULT_ACTIVE_LIST_URLS: string[] = [HARDHAT_LIST]
