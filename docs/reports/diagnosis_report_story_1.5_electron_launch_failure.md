# Diagnosis Report: Electron Application Launch Failure in Story 1.5 Tests

**Report Date:** July 5, 2025
**Author:** AI Debugger

## 1. Summary

All Playwright tests for User Story 1.5 are failing due to a critical error during the launch of the Electron application. The test runner is unable to connect to the application, resulting in a `WebSocket error: connect ETIMEDOUT` and a subsequent `TypeError: Cannot read properties of undefined (reading 'close')`. This report details the root cause of the failure and provides a clear solution to resolve it.

## 2. Root Cause Analysis

The primary cause of the failure is an incorrect launch configuration for the Electron application within the Playwright test files.

In both `tests/acceptance/story_1.5_search_within_playlist.spec.ts` and `tests/edge_cases/story_1.5_search_within_playlist.spec.ts`, the application is launched with the following command:

```typescript
electronApp = await electron.launch({ args: ['.'] });
```

The `args: ['.']` parameter tells Playwright to execute the Electron application against the current working directory. However, Playwright's `electron.launch` function needs to be explicitly provided with the path to the application's main process script. The project's `package.json` clearly defines this script as `src/main.js`.

By providing the directory (`.`) instead of the main script (`src/main.js`), the Electron process starts without loading any of the application's code. The main window is never created, and the application's IPC handlers are never registered. Consequently, when Playwright attempts to connect its driver to the application via a WebSocket, the connection times out, leading to the observed `ETIMEDOUT` error. The subsequent `TypeError` occurs because the `electronApp` object is not properly initialized, and its `close` method cannot be called.

## 3. Proposed Solution

To resolve this issue, the `electron.launch` call in both test files must be updated to correctly specify the path to the Electron main script.

**File to Modify (1):** [`tests/acceptance/story_1.5_search_within_playlist.spec.ts`](tests/acceptance/story_1.5_search_within_playlist.spec.ts)
**File to Modify (2):** [`tests/edge_cases/story_1.5_search_within_playlist.spec.ts`](tests/edge_cases/story_1.5_search_within_playlist.spec.ts)

**Change:**

Locate the following line in the `test.beforeEach` block of both files:

```typescript
// From
electronApp = await electron.launch({ args: ['.'] });
```

And replace it with:

```typescript
// To
electronApp = await electron.launch({ args: ['src/main.js'] });
```

## 4. Rationale

This change directly addresses the root cause of the problem. By providing `['src/main.js']` as the argument, we are instructing Playwright to launch the Electron executable and load our application using the correct main process file.

This will ensure that:
1.  The Electron application initializes correctly, creating the main browser window.
2.  The application's code, including the preload script and IPC handlers, is executed as expected.
3.  Playwright's driver can successfully connect to the running application's WebSocket.
4.  The tests can proceed to interact with the application's UI and execute assertions, resolving the timeout and stabilizing the test environment for User Story 1.5.