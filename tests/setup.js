// This file will run before each test file
// It's useful for setting up global mocks or environment variables

// Mock Electron
jest.mock('electron', () => ({
  app: {
    getPath: jest.fn().mockImplementation((name) => {
      if (name === 'userData') return '/mock/user/data';
      if (name === 'appData') return '/mock/app/data';
      if (name === 'temp') return '/mock/temp';
      if (name === 'home') return '/mock/home';
      if (name === 'videos') return '/mock/videos';
      return '/mock/path';
    }),
    on: jest.fn(),
    whenReady: jest.fn().mockResolvedValue(undefined),
    getAppPath: jest.fn().mockReturnValue('/mock/app/path'),
  },
  ipcMain: {
    on: jest.fn(),
    handle: jest.fn(),
  },
  ipcRenderer: {
    on: jest.fn(),
    invoke: jest.fn(),
    send: jest.fn(),
  },
  BrowserWindow: jest.fn().mockImplementation(() => ({
    loadURL: jest.fn(),
    on: jest.fn(),
    webContents: {
      on: jest.fn(),
      executeJavaScript: jest.fn().mockResolvedValue(undefined),
      openDevTools: jest.fn(),
    },
  })),
  session: {
    defaultSession: {
      webRequest: {
        onHeadersReceived: jest.fn(),
      },
      protocol: {
        registerStringProtocol: jest.fn(),
      },
    },
  },
  dialog: {
    showOpenDialog: jest.fn().mockResolvedValue({ canceled: false, filePaths: ['/mock/selected/path'] }),
  },
  contextBridge: {
    exposeInMainWorld: jest.fn(),
  },
}));

// Mock fs-extra
jest.mock('fs-extra', () => ({
  existsSync: jest.fn().mockReturnValue(true),
  readFileSync: jest.fn().mockReturnValue('mock file content'),
  writeFileSync: jest.fn(),
  appendFileSync: jest.fn(),
  ensureDirSync: jest.fn(),
  ensureDir: jest.fn().mockResolvedValue(undefined),
  pathExists: jest.fn().mockResolvedValue(true),
  copy: jest.fn().mockResolvedValue(undefined),
  writeJson: jest.fn().mockResolvedValue(undefined),
  readJson: jest.fn().mockResolvedValue({}),
  remove: jest.fn().mockResolvedValue(undefined),
  stat: jest.fn().mockResolvedValue({ size: 1024, isDirectory: () => false }),
}));

// Mock path
jest.mock('path', () => ({
  join: jest.fn((...args) => args.join('/')),
  resolve: jest.fn((...args) => args.join('/')),
  basename: jest.fn((path) => path.split('/').pop()),
  dirname: jest.fn((path) => path.split('/').slice(0, -1).join('/')),
  extname: jest.fn((path) => {
    const parts = path.split('.');
    return parts.length > 1 ? `.${parts.pop()}` : '';
  }),
}));

// Set up global variables that might be needed
global.process.cwd = jest.fn().mockReturnValue('/mock/cwd');

// Add any other global setup here

// Mock window.api for frontend tests
global.window = {
  ...global.window,
  api: {
    receive: jest.fn(),
    send: jest.fn(),
    youtube: {
      importPlaylist: jest.fn().mockImplementation((url, playlistInfo) => Promise.resolve()),
      getPlaylistInfo: jest.fn().mockResolvedValue({
        id: 'mock-playlist-id',
        title: 'Mock Playlist',
        videoCount: 50,
        videos: Array(50).fill().map((_, i) => ({
          id: `video-${i}`,
          title: `Video ${i}`,
          url: `https://youtube.com/watch?v=video-${i}`,
        })),
      }),
    },
  },
};
