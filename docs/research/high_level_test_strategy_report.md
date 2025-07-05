# High-Level Acceptance Testing Strategy for Playlistify

## 1. Introduction & Guiding Principles

This document outlines the optimal high-level acceptance testing strategy for the Playlistify project. The primary goal of this strategy is to establish a comprehensive suite of end-to-end (E2E) tests that, when passed, provide a high degree of confidence in the overall correctness and stability of the application.

The core principles guiding this strategy are:

*   **User-Centric Scenarios:** All tests are derived directly from the user stories and acceptance criteria, ensuring that the tests validate real-world user workflows.
*   **AI Verifiability:** Each test is designed to produce a clear, binary (pass/fail), and deterministic outcome that can be reliably verified by an automated system or AI agent. This means avoiding flaky tests and focusing on verifiable state changes (e.g., database records, file system outputs, UI state).
*   **Full-Stack Validation:** Tests will cover the entire application stack, from UI interactions in the Renderer process to business logic in the Main process, including interactions with the SQLite database and the file system.
*   **Confidence Through Coverage:** The suite aims to cover all critical paths and core functionalities defined in the project epics, ensuring that a "green" test run signifies a release-ready application.

## 2. Recommended Tooling: Playwright

Based on extensive research into the current best practices for Electron application testing, this report unequivocally recommends **Playwright** as the end-to-end testing framework.

### 2.1. Why Playwright?

*   **Modern & Maintained:** Unlike its predecessor Spectron (deprecated in February 2022), Playwright is actively developed and maintained by Microsoft, ensuring long-term support and compatibility with future Electron versions.
*   **Architectural Superiority:** Playwright for Electron operates by attaching directly to the application, providing unparalleled control over both the Main and Renderer processes. This allows tests to interact with UI elements, listen for and mock IPC events, and directly inspect main process state, which is crucial for verifying the backend logic of Playlistify.
*   **Robust Feature Set:** Playwright comes with a rich set of features out-of-the-box, including auto-waits, powerful selectors, network interception, and cross-platform consistency, which collectively reduce test flakiness and development time.
*   **First-Class Tooling:** It includes excellent tools like Codegen (for recording tests) and Trace Viewer (for debugging failed tests step-by-step), which significantly improve the developer experience.

### 2.2. AI Verifiability with Playwright

Playwright's architecture is inherently suited for AI-verifiable testing. An AI agent can:

1.  **Execute a test script:** Trigger a Playwright test run via a CLI command.
2.  **Parse the output:** The test runner produces structured, machine-readable results (e.g., JUnit XML or JSON format).
3.  **Verify outcomes:** The AI can parse this output to confirm that all tests passed.
4.  **Analyze failures:** In case of failure, the AI can analyze the structured error messages and even leverage the Playwright Trace to gain a deeper understanding of the failure context, potentially identifying the root cause.

## 3. High-Level Test Suite

The following sections outline the high-level acceptance tests, categorized by project epic. Each test case corresponds to one or more acceptance criteria from the user stories and is designed to be a self-contained, verifiable scenario.

---

*(Further sections to be populated based on user stories)*

### **Epic 1: Project Foundation &amp; Playlist Viewing**

#### **Test Case 1.1: Application Layout and Navigation**
*   **Covers Stories:** 1.1, 1.2
*   **Scenario:**
    1.  The application is launched.
    2.  The test verifies that the main window is visible.
    3.  It then asserts that the sidebar, top navigation bar, and main content area are present and rendered in their correct positions using DOM selectors.
    4.  The test clicks the "Dashboard" navigation item.
    5.  It verifies the URL or route has changed to the dashboard view.
    6.  It asserts that the "Recent Playlists" and "Continue Watching" headers are visible.
*   **AI-Verifiable Outcome:**
    *   **Process Exit Code:** The Playwright test runner exits with code 0.
    *   **DOM State:** A snapshot of the DOM structure confirms the existence of elements with specific IDs or data-testid attributes (e.g., `#sidebar`, `#top-nav`, `#main-content`, `h2:has-text("Recent Playlists")`).
    *   **Screenshot Comparison:** A visual regression snapshot of the initial dashboard view matches the baseline image.

#### **Test Case 1.2: End-to-End Public Playlist Import**
*   **Covers Story:** 1.3
*   **Scenario:**
    1.  The test mocks the `dialog.showOpenDialog` Electron API to control the file selection.
    2.  It clicks the "Add Playlist" menu item.
    3.  It simulates pasting a valid YouTube playlist URL into the input field.
    4.  The test waits for the playlist preview to appear and asserts that the title and video count are displayed correctly.
    5.  It clicks the "Import" button.
    6.  The test uses Playwright's ability to access the main process to connect directly to a test-specific SQLite database.
    7.  It queries the `background_tasks` table to verify that a new row exists with `type: 'IMPORT'` and `status: 'QUEUED'`.
    8.  The test listens for the `task:update` IPC event and verifies its payload.
    9.  It waits for the background import process to complete (simulated or real).
    10. It queries the `playlists` and `videos` tables to confirm that the correct number of items have been inserted.
    11. It verifies that a desktop notification was created (by mocking the Notification API).
*   **AI-Verifiable Outcome:**
    *   **Database State:** An SQL query against the test database confirms the creation of the `background_tasks` record and the subsequent creation of the correct `playlists` and `videos` records. The result of the query (e.g., `SELECT COUNT(*) FROM videos WHERE playlistId = '...'`) can be compared against an expected value.
    *   **IPC Call Verification:** The test can spy on or mock the `ipcRenderer.on` method to confirm that the `task:update` event was received with the correct data structure.
    *   **API Mock Calls:** The test runner confirms that the mocked Notification constructor was called with the expected title and body.

#### **Test Case 1.3: Playlist Viewing and Interaction**
*   **Covers Stories:** 1.4, 1.5
*   **Scenario:**
    1.  The test state is pre-populated with an imported playlist in the test database.
    2.  The application is launched, and the test clicks on the pre-populated playlist in the sidebar.
    3.  It verifies that a skeleton loader is displayed while data is being fetched.
    4.  Once loaded, it asserts that the playlist header contains the correct title and video count.
    5.  It verifies that a list of videos is rendered.
    6.  The test types a search query into the search input field.
    7.  It asserts that the list of videos filters correctly and that the number of visible video items matches the expected count for the search term.
    8.  It clears the search query and asserts that the full list is restored.
    9.  It enters a query that yields no results and verifies the "No results found" message is displayed.
*   **AI-Verifiable Outcome:**
    *   **DOM State:** Assertions confirm the presence and content of specific elements (e.g., `h1:has-text("Playlist Title")`, `.video-list-item`). The count of `.video-list-item` elements can be asserted before, during, and after the search.
    *   **Performance Metrics:** Playwright can measure the time between the search input change and the DOM update to verify it's within the 50ms requirement (AC3 of Story 1.5).

#### **Test Case 1.4: Performance of Large Playlist Rendering**
*   **Covers Story:** 1.6
*   **Scenario:**
    1.  The test database is pre-populated with a playlist containing 2,000 video records.
    2.  The test navigates to this large playlist's detail view.
    3.  It uses Playwright's built-in performance tracing to record metrics.
    4.  The test programmatically scrolls the video list from top to bottom.
    5.  During the scroll, it continuously measures the browser's frame rate.
    6.  At multiple points during the scroll (e.g., at 25%, 50%, 75% scroll depth), it asserts that the number of `VideoListItem` components in the DOM is within the specified buffer limit (visible items + 10).
*   **AI-Verifiable Outcome:**
    *   **Performance Trace Analysis:** The generated Playwright trace file can be programmatically analyzed. The AI can parse this file to extract the frame rate metrics and assert that the average FPS remained above 50.
    *   **DOM Element Count:** A script can run assertions at intervals during the test to count the number of specific DOM elements and compare it against the allowed maximum. The pass/fail result of these assertions is the verifiable outcome.

---

### **Epic 2: Custom Playlist Management**

#### **Test Case 2.1: Create Custom Playlist and Handle Duplicate Titles**
*   **Covers Story:** 2.1
*   **Scenario:**
    1.  The test clicks the "Add Playlist" menu item and navigates to the "Custom Playlist" tab.
    2.  It verifies that the "Title" and "Description" fields and their character counters are visible.
    3.  It enters a unique title ("My First Custom Playlist") and a description.
    4.  It clicks "Create Playlist".
    5.  The test queries the test database to confirm that a new record has been added to the `playlists` table with `type = 'CUSTOM'` and the correct title.
    6.  The test repeats the process, this time entering the *exact same title* ("My First Custom Playlist").
    7.  It clicks "Create Playlist".
    8.  It asserts that a specific error message, "A playlist with this title already exists," is displayed in the UI.
    9.  It queries the database again to confirm that no new playlist record was created.
*   **AI-Verifiable Outcome:**
    *   **Database State:** An SQL query verifies the creation of the first playlist. A second query confirms that the count of playlists with the duplicate title remains 1 after the second attempt.
    *   **DOM State:** The test asserts the visibility of the error message element in the DOM after the duplicate submission attempt. The pass/fail result of this assertion is the verifiable outcome.

#### **Test Case 2.2: Add Video to Custom Playlist**
*   **Covers Story:** 2.2
*   **Scenario:**
    1.  The test database is pre-populated with an imported playlist and an empty custom playlist.
    2.  The test navigates to the imported playlist's detail view.
    3.  It right-clicks a video item to open the context menu.
    4.  It hovers over "Add to Playlist" and clicks on the name of the custom playlist from the submenu.
    5.  The test queries the `playlist_videos` junction table to verify that a new row exists associating the correct `videoId` and `playlistId`.
    6.  It verifies that a success notification appears.
    7.  The test repeats the exact same action on the same video.
    8.  It queries the `playlist_videos` table again to ensure the row count has not changed.
    9.  It verifies that a notification with the text "Video is already in this playlist" is displayed.
*   **AI-Verifiable Outcome:**
    *   **Database State:** The result of `SELECT COUNT(*) FROM playlist_videos WHERE videoId = ? AND playlistId = ?` is asserted to be 1 after the first action and still 1 after the second action.
    *   **API Mock Calls:** The test can mock the notification API to verify that the correct notifications are triggered for the "added" and "already in playlist" scenarios.

---

### **Epic 3: Core Downloading & Offline Playback**

#### **Test Case 3.1: Single Video Download and File Verification**
*   **Covers Story:** 3.1
*   **Scenario:**
    1.  The test environment is configured with a mocked `yt-dlp` and `fluent-ffmpeg` executable script that simulates a successful download and creates a dummy file. The test also mocks the disk space check to return sufficient space.
    2.  The test navigates to a playlist, right-clicks a video, and selects "Download".
    3.  It selects "MP4" and "1080p" from the dialog.
    4.  It clicks the "Download" button.
    5.  The test queries the `background_tasks` table to verify a download task was created.
    6.  After the simulated download completes, it queries the `videos` table to assert the `download_status` is 'COMPLETED'.
    7.  Crucially, the test verifies that the mocked `yt-dlp` script was called with the correct arguments (video ID, format, quality, and output path).
    8.  It then uses Node.js's `fs` module to assert that the dummy video file and its embedded thumbnail (simulated) exist at the expected path.
*   **AI-Verifiable Outcome:**
    *   **File System State:** The test result is dependent on `fs.existsSync(expectedFilePath)` returning `true`.
    *   **Database State:** SQL queries confirm the `background_tasks` record creation and the final `videos.download_status`.
    *   **Process/Mock Interaction:** The test verifies that the mocked `yt-dlp` process was spawned with a specific set of command-line arguments.

#### **Test Case 3.2: Full Playlist Download with Quality Fallback**
*   **Covers Story:** 3.2
*   **Scenario:**
    1.  The test uses mocked `yt-dlp` scripts. One mock will report that the requested quality (e.g., 1080p) is available. A second mock for a different video will report that 1080p is *not* available, but 720p is the highest.
    2.  The test initiates a full playlist download.
    3.  It verifies that a "parent" task is created in `background_tasks`.
    4.  It verifies that multiple "child" download tasks are created, linked to the parent.
    5.  The test asserts that the `yt-dlp` mock for the first video was called with the `1080p` quality argument.
    6.  It then asserts that the `yt-dlp` mock for the second video was called with the `720p` quality argument (the fallback).
    7.  If one child task is made to fail, the test verifies the parent task's final status is `COMPLETED_WITH_ERRORS`.
*   **AI-Verifiable Outcome:**
    *   **Process/Mock Interaction:** The primary verification is asserting the arguments passed to the mocked `yt-dlp` child processes. The test logs these calls, and the AI can verify that the log contains the expected arguments, including the fallback quality.
    *   **Database State:** SQL queries verify the parent-child task relationships and the final `COMPLETED_WITH_ERRORS` status.

#### **Test Case 3.3: Offline Playback with Custom Protocol**
*   **Covers Story:** 3.3
*   **Scenario:**
    1.  The test pre-populates the database with a video marked as downloaded and places a dummy video file at the corresponding path.
    2.  It registers a mock handler for the `app://` protocol.
    3.  The test clicks on the downloaded video item in the UI.
    4.  It verifies that the `ipcRenderer.invoke('fs:verify-file', ...)` mock was called.
    5.  It asserts that the video player element in the DOM has a `src` attribute pointing to `app://<...>/video.mp4`.
    6.  It asserts that the mock handler for the `app://` protocol was triggered with the correct file path.
    7.  It clicks the "play" button and asserts the `paused` property of the video element becomes `false`.
*   **AI-Verifiable Outcome:**
    *   **API Mock Calls:** The test runner verifies that the mocked `fs:verify-file` IPC handler and the custom `app://` protocol handler were called.
    *   **DOM State:** The test asserts the `src` attribute of the `<video>` element has the correct value. The `paused` property of the element provides a clear boolean state to assert against.

---

### **Epic 4: Background Tasks & Activity Center**

#### **Test Case 4.1: Task Persistence and Re-queuing**
*   **Covers Story:** 4.1
*   **Scenario:**
    1.  The test starts by clearing the test database.
    2.  It programmatically creates a task record in the `background_tasks` table with a status of 'DOWNLOADING'.
    3.  The application is launched.
    4.  The test needs to verify that the `BackgroundTaskService` has re-queued the "orphaned" task. It can do this by having the mock `p-queue` service emit a specific event or by checking a log.
    5.  The test asserts that the task is now active in the application's internal queue.
*   **AI-Verifiable Outcome:**
    *   **Log Analysis:** The test runner checks a specific log file (or console output) for a message indicating that the orphaned task was successfully re-queued on startup (e.g., "Re-queuing orphaned task with ID: 123").
    *   **Mock Interaction:** A mock of the `p-queue`'s `add` method can be spied upon, and the test can assert that it was called on application startup.

#### **Test Case 4.2: Real-time Activity Center Updates and Cancellation**
*   **Covers Story:** 4.2
*   **Scenario:**
    1.  The test initiates a background task (e.g., an import).
    2.  It verifies that the Activity Center widget appears and displays the new task.
    3.  The test simulates progress update IPC events from the main process (`task:update` with progress payload).
    4.  It asserts that the progress bar element in the Activity Center UI updates its `style` or `value` attribute accordingly.
    5.  The test clicks the "Cancel" button for the task in the widget.
    6.  It verifies that a `task:cancel` IPC event was sent.
    7.  It queries the test database to assert that the task's status has been updated to `CANCELLED`.
*   **AI-Verifiable Outcome:**
    *   **DOM State:** The test asserts the `style` attribute (e.g., `width: 50%`) of the progress bar element at multiple points.
    *   **Database State:** An SQL query confirms the task's final status is `CANCELLED`.
    *   **IPC Call Verification:** The test spies on `ipcRenderer.invoke` to confirm `task:cancel` was called with the correct task ID.

---

### **Epic 5: Playlist Health & Status Sync**

#### **Test Case 5.1: Health Check Service Logic**
*   **Covers Story:** 5.1
*   **Scenario:**
    1.  The test database is pre-populated with a playlist containing three videos with a default `availability_status`.
    2.  The test uses a mock `yt-dlp` script that, when called with specific video IDs, will return outputs corresponding to "Live", "Deleted", and "Private".
    3.  The test triggers the `HealthCheckService` for this playlist.
    4.  It verifies that the mock `yt-dlp` script was called for all three videos, with a concurrency limit enforced (e.g., by checking timestamps of the calls).
    5.  After the service runs, the test queries the `videos` table to assert that the `availability_status` column for the three videos has been updated to 'Live', 'Deleted', and 'Private', respectively.
    6.  It also queries the `playlists` table to verify the `last_health_check` timestamp has been updated.
*   **AI-Verifiable Outcome:**
    *   **Database State:** The results of `SELECT availability_status FROM videos WHERE id IN (...) ORDER BY id` are compared against an expected array `['Live', 'Deleted', 'Private']`. The `last_health_check` timestamp is asserted to be greater than its initial value.

#### **Test Case 5.2: Scheduled Sync with Active Task Deferral**
*   **Covers Story:** 5.2
*   **Scenario:**
    1.  The test uses a mock scheduler (like a mocked `node-cron`).
    2.  The test sets the user's sync frequency setting in a mock `electron-store` to a short interval.
    3.  **Part 1 (No active tasks):** The test advances the mock scheduler's clock. It asserts that the `HealthCheckService` is triggered.
    4.  **Part 2 (With active task):** The test initiates a user-facing background task (e.g., a download). It then advances the mock scheduler's clock again.
    5.  This time, it asserts that the `HealthCheckService` was *not* triggered, by checking a log or a mock function's call count.
    6.  The test then cancels the user-facing task and advances the clock once more, asserting that the `HealthCheckService` now runs as expected.
*   **AI-Verifiable Outcome:**
    *   **Mock Interaction:** The primary outcome is the call count of the mocked `HealthCheckService.run()` method. The AI can verify that the call count is 1 after Part 1, still 1 after Part 2, and 2 after the final step. The pass/fail result of these assertions is the verifiable outcome.
