/**
 * Window Manager Service
 * Handles window lifecycle, state management, and multi-window support
 */

import { app, BrowserWindow, screen } from 'electron';
import { EventEmitter } from 'events';
import type { LoggerService } from './logger-service';
// Settings service interface for optional dependency
interface SettingsService {
  get<T>(key: string): Promise<T>;
  set<T>(key: string, value: T): Promise<void>;
}

export interface WindowConfig {
  id: string;
  width: number;
  height: number;
  minWidth: number;
  minHeight: number;
  x?: number;
  y?: number;
  center?: boolean;
  resizable?: boolean;
  minimizable?: boolean;
  maximizable?: boolean;
  closable?: boolean;
  alwaysOnTop?: boolean;
  skipTaskbar?: boolean;
  title?: string;
  icon?: string;
  show?: boolean;
  frame?: boolean;
  transparent?: boolean;
  webPreferences?: Electron.WebPreferences;
}

export interface WindowState {
  id: string;
  bounds: Electron.Rectangle;
  isMaximized: boolean;
  isMinimized: boolean;
  isFullScreen: boolean;
  isVisible: boolean;
  isFocused: boolean;
  lastFocused: number;
}

export interface WindowManagerEvents {
  'window-created': { window: BrowserWindow; config: WindowConfig };
  'window-closed': { windowId: string };
  'window-focused': { windowId: string };
  'window-blurred': { windowId: string };
  'window-minimized': { windowId: string };
  'window-maximized': { windowId: string };
  'window-unmaximized': { windowId: string };
  'window-moved': { windowId: string; bounds: Electron.Rectangle };
  'window-resized': { windowId: string; bounds: Electron.Rectangle };
  'all-windows-closed': void;
  'request-main-window': void;
  'window-communication': {
    fromWindowId: string;
    toWindowId: string;
    message: any;
  };
  'broadcast-message': { fromWindowId: string; message: any };
}

export class WindowManagerService extends EventEmitter {
  private windows: Map<string, BrowserWindow> = new Map();
  private windowConfigs: Map<string, WindowConfig> = new Map();
  private windowStates: Map<string, WindowState> = new Map();
  private logger: LoggerService;
  private settings?: SettingsService;
  private isShuttingDown = false;
  private stateUpdateTimeout: NodeJS.Timeout | null = null;

  constructor(logger: LoggerService, settings?: SettingsService) {
    super();
    this.logger = logger;
    this.settings = settings;
    this.setupAppEventHandlers();
  }

  /**
   * Create a new window with the specified configuration
   */
  async createWindow(
    config: WindowConfig,
    url?: string,
  ): Promise<BrowserWindow> {
    try {
      this.logger.info(`Creating window: ${config.id}`, 'WindowManager');

      // Check if window already exists
      if (this.windows.has(config.id)) {
        const existingWindow = this.windows.get(config.id)!;
        if (!existingWindow.isDestroyed()) {
          existingWindow.focus();
          return existingWindow;
        } else {
          // Clean up destroyed window reference
          this.windows.delete(config.id);
          this.windowConfigs.delete(config.id);
          this.windowStates.delete(config.id);
        }
      }

      // Restore window state if available
      const savedState = await this.loadWindowState(config.id);
      const windowBounds = this.calculateWindowBounds(
        config,
        savedState || undefined,
      );

      // Create browser window
      const window = new BrowserWindow({
        ...windowBounds,
        minWidth: config.minWidth,
        minHeight: config.minHeight,
        resizable: config.resizable ?? true,
        minimizable: config.minimizable ?? true,
        maximizable: config.maximizable ?? true,
        closable: config.closable ?? true,
        alwaysOnTop: config.alwaysOnTop ?? false,
        skipTaskbar: config.skipTaskbar ?? false,
        title: config.title ?? 'Playlistify',
        show: config.show ?? false,
        frame: config.frame ?? true,
        transparent: config.transparent ?? false,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          webSecurity: true,
          ...config.webPreferences,
        },
      });

      // Store window references
      this.windows.set(config.id, window);
      this.windowConfigs.set(config.id, config);

      // Initialize window state
      const initialState: WindowState = {
        id: config.id,
        bounds: window.getBounds(),
        isMaximized: window.isMaximized(),
        isMinimized: window.isMinimized(),
        isFullScreen: window.isFullScreen(),
        isVisible: window.isVisible(),
        isFocused: window.isFocused(),
        lastFocused: Date.now(),
      };
      this.windowStates.set(config.id, initialState);

      // Set up window event handlers
      this.setupWindowEventHandlers(window, config.id);

      // Restore maximized state if needed
      if (savedState?.isMaximized) {
        window.maximize();
      }

      // Load URL if provided
      if (url) {
        await window.loadURL(url);
      }

      // Show window when ready
      window.once('ready-to-show', () => {
        if (!window.isDestroyed()) {
          window.show();
          if (config.center || (!config.x && !config.y)) {
            window.center();
          }
          this.logger.debug(
            `Window ready and shown: ${config.id}`,
            'WindowManager',
          );
        }
      });

      this.emit('window-created', { window, config });
      this.logger.info(
        `Window created successfully: ${config.id}`,
        'WindowManager',
      );

      return window;
    } catch (error) {
      this.logger.error(
        `Failed to create window: ${config.id}`,
        'WindowManager',
        {
          error: error instanceof Error ? error.message : error,
        },
      );
      throw error;
    }
  }

  /**
   * Get a window by ID
   */
  getWindow(windowId: string): BrowserWindow | null {
    const window = this.windows.get(windowId);
    return window && !window.isDestroyed() ? window : null;
  }

  /**
   * Get all active windows
   */
  getAllWindows(): BrowserWindow[] {
    return Array.from(this.windows.values()).filter(
      window => !window.isDestroyed(),
    );
  }

  /**
   * Get window state by ID
   */
  getWindowState(windowId: string): WindowState | null {
    return this.windowStates.get(windowId) || null;
  }

  /**
   * Close a specific window
   */
  async closeWindow(windowId: string): Promise<boolean> {
    try {
      const window = this.windows.get(windowId);
      if (!window || window.isDestroyed()) {
        return false;
      }

      // Save window state before closing
      await this.saveWindowState(windowId);

      window.close();
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to close window: ${windowId}`,
        'WindowManager',
        {
          error: error instanceof Error ? error.message : error,
        },
      );
      return false;
    }
  }

  /**
   * Close all windows
   */
  async closeAllWindows(): Promise<void> {
    this.logger.info('Closing all windows', 'WindowManager');
    this.isShuttingDown = true;

    const windowIds = Array.from(this.windows.keys());
    const closePromises = windowIds.map(id => this.closeWindow(id));

    await Promise.allSettled(closePromises);
    this.logger.info('All windows closed', 'WindowManager');
  }

  /**
   * Focus a specific window
   */
  focusWindow(windowId: string): boolean {
    const window = this.windows.get(windowId);
    if (!window || window.isDestroyed()) {
      return false;
    }

    if (window.isMinimized()) {
      window.restore();
    }

    window.focus();
    return true;
  }

  /**
   * Send message to a specific window
   */
  sendToWindow(windowId: string, channel: string, ...args: any[]): boolean {
    const window = this.windows.get(windowId);
    if (!window || window.isDestroyed()) {
      return false;
    }

    window.webContents.send(channel, ...args);
    return true;
  }

  /**
   * Send message to all windows
   */
  sendToAllWindows(channel: string, ...args: any[]): void {
    this.getAllWindows().forEach(window => {
      window.webContents.send(channel, ...args);
    });
  }

  /**
   * Get the focused window
   */
  getFocusedWindow(): BrowserWindow | null {
    return BrowserWindow.getFocusedWindow();
  }

  /**
   * Get the main window (first created window)
   */
  getMainWindow(): BrowserWindow | null {
    const mainWindowId = Array.from(this.windows.keys())[0];
    return mainWindowId ? this.getWindow(mainWindowId) : null;
  }

  /**
   * Send message between specific windows
   */
  sendWindowToWindow(
    fromWindowId: string,
    toWindowId: string,
    channel: string,
    message: any,
  ): boolean {
    const fromWindow = this.getWindow(fromWindowId);
    const toWindow = this.getWindow(toWindowId);

    if (!fromWindow || !toWindow) {
      this.logger.warn(
        `Failed to send message between windows: ${fromWindowId} -> ${toWindowId}`,
        'WindowManager',
      );
      return false;
    }

    // Send message to target window
    toWindow.webContents.send(channel, {
      fromWindowId,
      toWindowId,
      message,
      timestamp: Date.now(),
    });

    // Emit communication event
    this.emit('window-communication', { fromWindowId, toWindowId, message });

    this.logger.debug(
      `Message sent between windows: ${fromWindowId} -> ${toWindowId}`,
      'WindowManager',
    );
    return true;
  }

  /**
   * Broadcast message from one window to all others
   */
  broadcastFromWindow(
    fromWindowId: string,
    channel: string,
    message: any,
  ): void {
    const fromWindow = this.getWindow(fromWindowId);
    if (!fromWindow) {
      this.logger.warn(
        `Failed to broadcast from window: ${fromWindowId}`,
        'WindowManager',
      );
      return;
    }

    const otherWindows = this.getAllWindows().filter(window => {
      const windowId = this.getWindowIdByWindow(window);
      return windowId !== fromWindowId;
    });

    otherWindows.forEach(window => {
      window.webContents.send(channel, {
        fromWindowId,
        message,
        timestamp: Date.now(),
      });
    });

    // Emit broadcast event
    this.emit('broadcast-message', { fromWindowId, message });

    this.logger.debug(
      `Message broadcast from window: ${fromWindowId} to ${otherWindows.length} windows`,
      'WindowManager',
    );
  }

  /**
   * Get window ID by BrowserWindow instance
   */
  getWindowIdByWindow(window: BrowserWindow): string | null {
    for (const [id, win] of this.windows.entries()) {
      if (win === window && !win.isDestroyed()) {
        return id;
      }
    }
    return null;
  }

  /**
   * Get all window IDs
   */
  getAllWindowIds(): string[] {
    return Array.from(this.windows.keys()).filter(id => {
      const window = this.windows.get(id);
      return window && !window.isDestroyed();
    });
  }

  /**
   * Get window statistics
   */
  getWindowStats(): {
    totalWindows: number;
    activeWindows: number;
    focusedWindow: string | null;
    mainWindow: string | null;
    windowStates: Record<string, Partial<WindowState>>;
  } {
    const activeWindows = this.getAllWindows();
    const focusedWindow = this.getFocusedWindow();
    const focusedWindowId = focusedWindow
      ? this.getWindowIdByWindow(focusedWindow)
      : null;
    const mainWindowId = Array.from(this.windows.keys())[0] || null;

    const windowStates: Record<string, Partial<WindowState>> = {};
    for (const [id, state] of this.windowStates.entries()) {
      windowStates[id] = {
        isMaximized: state.isMaximized,
        isMinimized: state.isMinimized,
        isVisible: state.isVisible,
        isFocused: state.isFocused,
        lastFocused: state.lastFocused,
      };
    }

    return {
      totalWindows: this.windows.size,
      activeWindows: activeWindows.length,
      focusedWindow: focusedWindowId,
      mainWindow: mainWindowId,
      windowStates,
    };
  }

  /**
   * Calculate window bounds considering screen constraints
   */
  private calculateWindowBounds(
    config: WindowConfig,
    savedState?: WindowState,
  ): Electron.Rectangle {
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width: screenWidth, height: screenHeight } =
      primaryDisplay.workAreaSize;

    let bounds: Electron.Rectangle = {
      width: config.width,
      height: config.height,
      x: config.x ?? 0,
      y: config.y ?? 0,
    };

    // Use saved state if available and valid
    if (
      savedState &&
      this.isValidBounds(savedState.bounds, screenWidth, screenHeight)
    ) {
      bounds = { ...savedState.bounds };
    } else if (config.center || (!config.x && !config.y)) {
      // Center the window
      bounds.x = Math.floor((screenWidth - bounds.width) / 2);
      bounds.y = Math.floor((screenHeight - bounds.height) / 2);
    }

    // Ensure window fits on screen
    bounds.width = Math.min(bounds.width, screenWidth);
    bounds.height = Math.min(bounds.height, screenHeight);
    bounds.x = Math.max(0, Math.min(bounds.x, screenWidth - bounds.width));
    bounds.y = Math.max(0, Math.min(bounds.y, screenHeight - bounds.height));

    return bounds;
  }

  /**
   * Check if bounds are valid for the current screen
   */
  private isValidBounds(
    bounds: Electron.Rectangle,
    screenWidth: number,
    screenHeight: number,
  ): boolean {
    return (
      bounds.x >= 0 &&
      bounds.y >= 0 &&
      bounds.x + bounds.width <= screenWidth &&
      bounds.y + bounds.height <= screenHeight &&
      bounds.width > 0 &&
      bounds.height > 0
    );
  }

  /**
   * Set up event handlers for a specific window
   */
  private setupWindowEventHandlers(
    window: BrowserWindow,
    windowId: string,
  ): void {
    // Window closed
    window.on('closed', () => {
      this.handleWindowClosed(windowId);
    });

    // Window focus/blur
    window.on('focus', () => {
      this.updateWindowState(windowId, {
        isFocused: true,
        lastFocused: Date.now(),
      });
      this.emit('window-focused', { windowId });
    });

    window.on('blur', () => {
      this.updateWindowState(windowId, { isFocused: false });
      this.emit('window-blurred', { windowId });
    });

    // Window minimize/maximize
    window.on('minimize', () => {
      this.updateWindowState(windowId, { isMinimized: true });
      this.emit('window-minimized', { windowId });
    });

    window.on('maximize', () => {
      this.updateWindowState(windowId, { isMaximized: true });
      this.emit('window-maximized', { windowId });
    });

    window.on('unmaximize', () => {
      this.updateWindowState(windowId, { isMaximized: false });
      this.emit('window-unmaximized', { windowId });
    });

    // Window move/resize with debouncing
    const debouncedStateUpdate = this.debounce(() => {
      if (!window.isDestroyed()) {
        const bounds = window.getBounds();
        this.updateWindowState(windowId, { bounds });
        this.saveWindowStateDebounced(windowId);
      }
    }, 500);

    window.on('moved', () => {
      const bounds = window.getBounds();
      this.emit('window-moved', { windowId, bounds });
      debouncedStateUpdate();
    });

    window.on('resized', () => {
      const bounds = window.getBounds();
      this.emit('window-resized', { windowId, bounds });
      debouncedStateUpdate();
    });

    // Window show/hide
    window.on('show', () => {
      this.updateWindowState(windowId, { isVisible: true });
    });

    window.on('hide', () => {
      this.updateWindowState(windowId, { isVisible: false });
    });

    // Handle window restore
    window.on('restore', () => {
      this.updateWindowState(windowId, { isMinimized: false });
    });

    // Handle fullscreen changes
    window.on('enter-full-screen', () => {
      this.updateWindowState(windowId, { isFullScreen: true });
    });

    window.on('leave-full-screen', () => {
      this.updateWindowState(windowId, { isFullScreen: false });
    });
  }

  /**
   * Handle window closed event
   */
  private handleWindowClosed(windowId: string): void {
    this.logger.debug(`Window closed: ${windowId}`, 'WindowManager');

    // Clean up references
    this.windows.delete(windowId);
    this.windowConfigs.delete(windowId);
    this.windowStates.delete(windowId);

    this.emit('window-closed', { windowId });

    // Check if all windows are closed
    if (this.windows.size === 0) {
      this.emit('all-windows-closed');
    }
  }

  /**
   * Update window state
   */
  private updateWindowState(
    windowId: string,
    updates: Partial<WindowState>,
  ): void {
    const currentState = this.windowStates.get(windowId);
    if (currentState) {
      this.windowStates.set(windowId, { ...currentState, ...updates });
    }
  }

  /**
   * Load window state from settings
   */
  private async loadWindowState(windowId: string): Promise<WindowState | null> {
    if (!this.settings) {
      return null;
    }

    try {
      const stateKey = `windowState.${windowId}`;
      const savedState = await this.settings.get<WindowState>(stateKey);
      return savedState || null;
    } catch (error) {
      this.logger.warn(
        `Failed to load window state: ${windowId}`,
        'WindowManager',
        {
          error: error instanceof Error ? error.message : error,
        },
      );
      return null;
    }
  }

  /**
   * Save window state to settings
   */
  private async saveWindowState(windowId: string): Promise<void> {
    if (!this.settings) {
      return;
    }

    try {
      const state = this.windowStates.get(windowId);
      if (state) {
        const stateKey = `windowState.${windowId}`;
        await this.settings.set(stateKey, state);
        this.logger.debug(`Window state saved: ${windowId}`, 'WindowManager');
      }
    } catch (error) {
      this.logger.warn(
        `Failed to save window state: ${windowId}`,
        'WindowManager',
        {
          error: error instanceof Error ? error.message : error,
        },
      );
    }
  }

  /**
   * Debounced window state saving
   */
  private saveWindowStateDebounced(windowId: string): void {
    if (this.stateUpdateTimeout) {
      clearTimeout(this.stateUpdateTimeout);
    }

    this.stateUpdateTimeout = setTimeout(() => {
      this.saveWindowState(windowId);
    }, 1000);
  }

  /**
   * Set up application-level event handlers
   */
  private setupAppEventHandlers(): void {
    // Handle app activation (macOS)
    app.on('activate', async () => {
      if (this.windows.size === 0 && !this.isShuttingDown) {
        this.logger.debug(
          'App activated with no windows, requesting main window creation',
          'WindowManager',
        );
        this.emit('request-main-window');
      }
    });

    // Handle all windows closed
    app.on('window-all-closed', () => {
      this.emit('all-windows-closed');
    });
  }

  /**
   * Utility debounce function
   */
  private debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number,
  ): T {
    let timeout: NodeJS.Timeout;
    return ((...args: any[]) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    }) as T;
  }

  /**
   * Cleanup and shutdown
   */
  async shutdown(): Promise<void> {
    this.logger.info('Window manager shutting down', 'WindowManager');
    this.isShuttingDown = true;

    // Clear any pending timeouts
    if (this.stateUpdateTimeout) {
      clearTimeout(this.stateUpdateTimeout);
    }

    // Save all window states
    const savePromises = Array.from(this.windows.keys()).map(id =>
      this.saveWindowState(id),
    );
    await Promise.allSettled(savePromises);

    // Close all windows
    await this.closeAllWindows();

    // Remove all listeners
    this.removeAllListeners();

    this.logger.info('Window manager shutdown complete', 'WindowManager');
  }
}
