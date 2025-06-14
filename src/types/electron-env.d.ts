// src/types/electron-env.d.ts

/**
 * Declares global constants injected by Electron Forge's Webpack plugin.
 * These constants provide the correct paths to Webpack entry points at runtime.
 */

/**
 * The entry point for the main window's renderer process.
 * (e.g., your React app's entry JS file)
 */
declare const MAIN_WINDOW_WEBPACK_ENTRY: string;

/**
 * The entry point for the main window's preload script.
 */
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

// If you have other renderer processes or preload scripts,
// they would have similar constants, e.g.:
// declare const OTHER_WINDOW_WEBPACK_ENTRY: string;
// declare const OTHER_WINDOW_PRELOAD_WEBPACK_ENTRY: string;