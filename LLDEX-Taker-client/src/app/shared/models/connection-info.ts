export interface ConnectionInfo {
  title: string;
  pubNubClient: {
    publishKey: string;
    subscribeKey: string;
    uuid: string;
  };
  settings: {
    channels: string[];
    withPresence: boolean;
  }
}
