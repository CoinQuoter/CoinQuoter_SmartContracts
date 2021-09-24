export interface ConnectionInfo {
  title: string;
  pubNubClient: {
    publishKey: string;
    subscribeKey: string;
  };
  settings: {
    channels: string[];
    withPresence: boolean;
  }
}
