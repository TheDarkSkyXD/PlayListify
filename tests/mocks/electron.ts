/**
 * Electron Mock for Testing
 * 
 * This mock provides a comprehensive Electron API mock for unit testing.
 * It includes all the main Electron modules used by the application.
 */

import { EventEmitter } from 'events';

// Mock BrowserWindow
class MockBrowserWindow extends EventEmitter {
  public webContents: MockWebContents;
  public id: number;
  public isDestroyed = false;
  public isVisible = true;
  public isMinimized = false;
  public isMaximized = false;
  public isFullScreen = false;

  constructor(options: any = {}) {
    super();
    this.webContents = new MockWebContents();
    this.id = Math.floor(Math.random() * 1000);
  }

  loadFile(filePath: string) {
    return Promise.resolve();
  }

  loadURL(url: string) {
    return Promise.resolve();
  }

  show() {
    this.isVisible = true;
    this.emit('show');
  }

  hide() {
    this.isVisible = false;
    this.emit('hide');
  }

  close() {
    this.emit('close');
    this.destroy();
  }

  destroy() {
    this.isDestroyed = true;
    this.emit('closed');
  }

  minimize() {
    this.isMinimized = true;
    this.emit('minimize');
  }

  maximize() {
    this.isMaximized = true;
    this.emit('maximize');
  }

  unmaximize() {
    this.isMaximized = false;
    this.emit('unmaximize');
  }

  setFullScreen(flag: boolean) {
    this.isFullScreen = flag;
  }

  getBounds() {
    return { x: 0, y: 0, width: 800, height: 600 };
  }

  setBounds(bounds: any) {
    // Mock implementation
  }

  center() {
    // Mock implementation
  }

  focus() {
    this.emit('focus');
  }

  blur() {
    this.emit('blur');
  }

  static getAllWindows() {
    return [];
  }

  static getFocusedWindow() {
    return null;
  }
}

// Mock WebContents
class MockWebContents extends EventEmitter {
  public isDestroyed = false;

  send(channel: string, ...args: any[]) {
    // Mock IPC send
  }

  executeJavaScript(code: string) {
    return Promise.resolve();
  }

  openDevTools() {
    // Mock dev tools
  }

  closeDevTools() {
    // Mock dev tools
  }

  isDevToolsOpened() {
    return false;
  }

  reload() {
    this.emit('dom-ready');
  }

  getURL() {
    return 'file://mock-url';
  }

  getTitle() {
    return 'Mock Title';
  }
}

// Mock App
const mockApp = new EventEmitter();
Object.assign(mockApp, {
  quit: jest.fn(),
  exit: jest.fn(),
  getVersion: jest.fn(() => '1.0.0'),
  getName: jest.fn(() => 'Playlistify'),
  getPath: jest.fn((name: string) => {
    const paths: Record<string, string> = {
      userData: '/mock/userData',
      downloads: '/mock/downloads',
      documents: '/mock/documents',
      desktop: '/mock/desktop',
      temp: '/mock/temp',
      appData: '/mock/appData',
      home: '/mock/home',
    };
    return paths[name] || '/mock/path';
  }),
  setPath: jest.fn(),
  isReady: jest.fn(() => true),
  whenReady: jest.fn(() => Promise.resolve()),
  dock: {
    hide: jest.fn(),
    show: jest.fn(),
    setBadge: jest.fn(),
  },
  setAppUserModelId: jest.fn(),
  requestSingleInstanceLock: jest.fn(() => true),
  hasSingleInstanceLock: jest.fn(() => true),
  releaseSingleInstanceLock: jest.fn(),
});

// Mock IpcMain
const mockIpcMain = new EventEmitter();
Object.assign(mockIpcMain, {
  handle: jest.fn(),
  handleOnce: jest.fn(),
  removeHandler: jest.fn(),
});

// Mock IpcRenderer
const mockIpcRenderer = new EventEmitter();
Object.assign(mockIpcRenderer, {
  invoke: jest.fn(() => Promise.resolve()),
  send: jest.fn(),
  sendSync: jest.fn(),
  sendTo: jest.fn(),
  sendToHost: jest.fn(),
});

// Mock Dialog
const mockDialog = {
  showOpenDialog: jest.fn(() => Promise.resolve({ canceled: false, filePaths: ['/mock/file'] })),
  showSaveDialog: jest.fn(() => Promise.resolve({ canceled: false, filePath: '/mock/file' })),
  showMessageBox: jest.fn(() => Promise.resolve({ response: 0 })),
  showErrorBox: jest.fn(),
  showCertificateTrustDialog: jest.fn(() => Promise.resolve()),
};

// Mock Shell
const mockShell = {
  openExternal: jest.fn(() => Promise.resolve()),
  openPath: jest.fn(() => Promise.resolve('')),
  showItemInFolder: jest.fn(),
  moveItemToTrash: jest.fn(() => true),
  beep: jest.fn(),
  writeShortcutLink: jest.fn(() => true),
  readShortcutLink: jest.fn(() => ({})),
};

// Mock Screen
const mockScreen = new EventEmitter();
Object.assign(mockScreen, {
  getPrimaryDisplay: jest.fn(() => ({
    bounds: { x: 0, y: 0, width: 1920, height: 1080 },
    workArea: { x: 0, y: 0, width: 1920, height: 1040 },
    scaleFactor: 1,
  })),
  getAllDisplays: jest.fn(() => []),
  getDisplayNearestPoint: jest.fn(() => ({})),
  getDisplayMatching: jest.fn(() => ({})),
  getCursorScreenPoint: jest.fn(() => ({ x: 0, y: 0 })),
});

// Mock Menu
const mockMenu = {
  buildFromTemplate: jest.fn(() => ({})),
  setApplicationMenu: jest.fn(),
  getApplicationMenu: jest.fn(() => null),
  popup: jest.fn(),
};

// Mock MenuItem
const mockMenuItem = jest.fn().mockImplementation((options) => options);

// Mock Tray
class MockTray extends EventEmitter {
  constructor(image: any) {
    super();
  }

  setToolTip(toolTip: string) {}
  setTitle(title: string) {}
  setContextMenu(menu: any) {}
  destroy() {}
}

// Mock Notification
class MockNotification extends EventEmitter {
  static isSupported() {
    return true;
  }

  constructor(options: any) {
    super();
  }

  show() {
    this.emit('show');
  }

  close() {
    this.emit('close');
  }
}

// Mock contextBridge
const mockContextBridge = {
  exposeInMainWorld: jest.fn(),
};

// Mock clipboard
const mockClipboard = {
  readText: jest.fn(() => ''),
  writeText: jest.fn(),
  readHTML: jest.fn(() => ''),
  writeHTML: jest.fn(),
  readImage: jest.fn(),
  writeImage: jest.fn(),
  readRTF: jest.fn(() => ''),
  writeRTF: jest.fn(),
  availableFormats: jest.fn(() => []),
  clear: jest.fn(),
};

// Mock nativeTheme
const mockNativeTheme = new EventEmitter();
Object.assign(mockNativeTheme, {
  shouldUseDarkColors: false,
  themeSource: 'system',
  shouldUseHighContrastColors: false,
  shouldUseInvertedColorScheme: false,
});

// Mock powerMonitor
const mockPowerMonitor = new EventEmitter();
Object.assign(mockPowerMonitor, {
  getSystemIdleState: jest.fn(() => 'active'),
  getSystemIdleTime: jest.fn(() => 0),
});

// Export the complete Electron mock
export = {
  app: mockApp,
  BrowserWindow: MockBrowserWindow,
  ipcMain: mockIpcMain,
  ipcRenderer: mockIpcRenderer,
  dialog: mockDialog,
  shell: mockShell,
  screen: mockScreen,
  Menu: mockMenu,
  MenuItem: mockMenuItem,
  Tray: MockTray,
  Notification: MockNotification,
  contextBridge: mockContextBridge,
  clipboard: mockClipboard,
  nativeTheme: mockNativeTheme,
  powerMonitor: mockPowerMonitor,
  
  // Additional commonly used properties
  remote: {
    app: mockApp,
    BrowserWindow: MockBrowserWindow,
    dialog: mockDialog,
    shell: mockShell,
    screen: mockScreen,
    Menu: mockMenu,
    MenuItem: mockMenuItem,
  },
};