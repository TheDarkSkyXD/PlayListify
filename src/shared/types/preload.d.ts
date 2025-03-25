export interface IpcApi {
  send: (channel: string, data: any) => void;
  receive: (channel: string, func: Function) => void;
}

declare global {
  interface Window {
    api: IpcApi;
  }
} 