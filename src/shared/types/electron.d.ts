export {};

interface IpcApi {
  playlists: {
    getById: (playlistId: string) => Promise<any>;
    // Add other playlist methods as needed
  };
  settings: {
    get: <T>(key: string, defaultValue?: T) => Promise<T>;
    set: <T>(key: string, value: T) => Promise<void>;
    // Add other settings methods as needed
  };
  fs: {
    videoExists: (playlistId: string, playlistName: string, videoId: string, format: string) => Promise<boolean>;
    getAvailableDiskSpace: (path: string) => Promise<number>;
    // Add other filesystem methods as needed
  };
  dialog: {
    selectFolder: () => Promise<string | null>;
    // Add other dialog methods as needed
  };
  // Add other API categories as needed
}

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
    api: IpcApi;
  }
} 