# Diagnosis Report: Test Instability for User Story 1.5

**Date:** 2025-07-05
**Author:** AI Debugger

## 1. Summary

This report details the diagnosis and resolution of critical test failures (`ETIMEDOUT`, `Target page, context or browser has been closed`) affecting User Story 1.5: Search Within a Playlist. The root cause was identified as a race condition where test scripts attempted to interact with DOM elements before they were rendered by the application's asynchronous logic.

The fix involved modifying the test files to explicitly wait for UI elements to be present before any interaction, ensuring the tests are robust and reliable.

## 2. Problem Description

The test suites for both acceptance and edge cases of User Story 1.5 were failing consistently. The errors indicated that the Playwright test runner was losing its connection to the target page or that the target was being closed prematurely. This is a classic symptom of a race condition in the test logic.

-   **Failing Tests:**
    -   `tests/acceptance/story_1.5_search_within_playlist.spec.ts`
    -   `tests/edge_cases/story_1.5_search_within_playlist.spec.ts`

## 3. Root Cause Analysis

The core issue was a fundamental misunderstanding in the test script of the application's lifecycle:

1.  **Asynchronous Rendering:** The application's `renderer.js` fetches the list of playlists from the main process using an asynchronous IPC call (`ipcRenderer.invoke('getPlaylists')`).
2.  **DOM Creation:** Only after this asynchronous call completes does the renderer process dynamically create the `<li>` elements for each playlist in the DOM.
3.  **Test Logic Flaw:** The original tests attempted to `click()` the playlist link *immediately* after setting up the IPC mocks and reloading the page. The test did not wait for the asynchronous rendering to complete.
4.  **Result:** The `page.locator(...).click()` call failed because the target element did not exist yet. This caused a fatal error in Playwright, leading to the browser context being closed and the subsequent `ETIMEDOUT` errors.

The navigation logic was incorrectly placed in the `beforeEach` hook in the edge case tests, and was simply too early in all test cases.

## 4. Resolution

The solution was to synchronize the test execution with the application's rendering state. This was achieved by applying the "wait-for-element" pattern.

**Strategy:** Move all navigation and interaction logic out of the `beforeEach` hooks and into the individual `test` blocks, ensuring each test is self-contained and follows a strict sequence:

1.  **Wait for Link:** Before any interaction, use `await page.waitForSelector(...)` to pause the test until the target playlist link (`[data-playlist-id="..."]`) is present in the DOM.
2.  **Click Link:** Once the element is confirmed to exist, safely perform the `click()` action.
3.  **Wait for View:** After clicking, use `await page.waitForSelector(...)` again to pause the test until a key element of the next view (e.g., `#playlist-search-input`) has been rendered.
4.  **Assert:** With the UI in the correct state, proceed with the test's specific assertions.

This pattern was applied to every test case in both `tests/acceptance/story_1.5_search_within_playlist.spec.ts` and `tests/edge_cases/story_1.5_search_within_playlist.spec.ts`.

## 5. Conclusion

By enforcing a strict wait-click-wait sequence, the race condition has been eliminated. The tests are no longer attempting to interact with a non-existent UI, resolving the timeout and closed-page errors. The test suites for User Story 1.5 are now stable and correctly verify the application's functionality.