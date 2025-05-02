export {};

declare global {
  interface Window {
    electron: {
      ipcRenderer: {
        invoke: <T = unknown, R = unknown>(channel: string, data?: T) => Promise<R>;
        on: <T = unknown>(
          channel: string,
          callback: (data: T) => void
        ) => () => void;
        once: <T = unknown>(
          channel: string,
          callback: (data: T) => void
        ) => void;
      };
    };
  }
} 