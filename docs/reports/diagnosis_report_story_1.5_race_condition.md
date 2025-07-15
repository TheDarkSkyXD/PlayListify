# Diagnosis Report: Test Failures in Story 1.5

**Report Date:** 2025-07-06
**Analysis by:** 🎯 Debugger (SPARC Aligned & Systematic)

## 1. Summary

All acceptance and edge case tests for **User Story 1.5: Search Within a Playlist** are failing with a consistent `Test timeout of 30000ms exceeded` error. The underlying cause is not a timeout in the traditional sense, but a fatal error: `Error: page.waitForSelector: Target page, context or browser has been closed`.

This error indicates that the Electron application's renderer process is crashing and closing prematurely during the test setup phase. The root cause of this crash is a **race condition** between the application's launch and the registration of essential network and IPC mocks within the Playwright test environment.

## 2. Symptom Analysis

The key failure signature is identical across all 11 failing tests in [`tests/acceptance/story_1.5_search_within_playlist.spec.ts`](tests/acceptance/story_1.5_search_within_playlist.spec.ts) and [`tests/edge_cases/story_1.5_search_within_playlist.spec.ts`](tests/edge_cases/story_1.5_search_within_playlist.spec.ts):

- **Timeout:** The test runner waits for 30 seconds for a selector (e.g., `[data-playlist-id="1"]`) to appear.
- **Root Error:** The wait fails because the page/browser context has already been destroyed.
- **Timing:** The failure occurs in the `beforeEach` hook or in the helper functions (`navigateToPlaylistView`, `navigateToPlaylistViewAndGetSearchInput`) that are called at the beginning of each test.

This pattern proves that the application is not reaching a stable, interactive state where the UI is rendered. The crash happens before any test-specific logic is executed.

## 3. Root Cause: Race Condition in Test Setup

The test setup in both failing files follows this sequence:

1.  `electronApp = await electron.launch({ args: ['src/main.js'] });`
2.  `page = await electronApp.firstWindow();`
3.  `await page.route('**/api/dashboard', ...);`
4.  `await electronApp.evaluate(({ ipcMain }, mockData) => { ... });`
5.  `await page.reload();`

The critical flaw lies in this sequence:

- **Step 1 & 2:** The `electron.launch` command starts the Electron application. The `src/main.js` script immediately creates a `BrowserWindow` and loads `index.html`. As soon as `index.html` is loaded, the renderer process starts executing its JavaScript.
- **Renderer Execution:** The renderer-side code immediately attempts to make IPC calls (`getPlaylists`, `getPlaylistDetails`) and potentially network requests.
- **Step 3 & 4:** While the renderer is trying to initialize, the test script is simultaneously trying to register the mocks for these very same IPC calls and network routes.
- **The Crash:** The renderer's requests are sent *before* the mocks are registered. Without a mocked response, the real backend calls fail or hang, leading to an unhandled exception in the renderer process. This unhandled exception crashes the renderer, which in turn closes the page (`browser has been closed`).
- **Step 5:** The `page.reload()` call is intended to apply the mocks, but it is executed too late. The page it's attempting to reload has already been destroyed by the crash.

## 4. Proposed Solution

To resolve this, the test setup must be re-architected to ensure that all mocks are fully registered *before* the application's renderer process loads its content. The application should be launched in a "paused" state.

The recommended approach is to modify the test setup to take control of the application's lifecycle:

1.  **Launch but Don't Load:** Launch the Electron application but prevent the main window from immediately loading the `index.html` file. This might involve creating a separate test-specific main entry point (e.g., `src/test-main.js`) or adding logic to `src/main.js` to detect a test environment.
2.  **Register Mocks:** Use `electronApp.evaluate()` and `page.route()` to set up all necessary IPC and network mocks.
3.  **Load Content:** Once the mocks are in place, explicitly instruct the application to load the content (e.g., `await page.goto('file:///path/to/your/index.html')`).
4.  **Wait for Stability:** Wait for the UI to be ready before proceeding with the tests.

By inverting the control, we eliminate the race condition and ensure a stable, predictable test environment for every run.