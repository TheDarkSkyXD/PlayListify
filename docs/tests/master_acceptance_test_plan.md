# Master Acceptance Test Plan for Playlistify

## 1. Introduction & Guiding Principles

This document formalizes the master acceptance testing strategy for the Playlistify project. The purpose of this plan is to define a suite of high-level, end-to-end (E2E) acceptance tests that collectively serve as the ultimate success criteria for the application. Passing this test suite provides a high degree of confidence that the application is stable, correct, and ready for release.

The strategy is guided by the following core principles--

*   **User-Centric Scenarios**-- All test cases are derived directly from the user stories defined in `docs/specifications/user_stories.md`. This ensures that testing validates real-world user workflows and meets user expectations.
*   **AI Verifiability**-- Each test is designed to produce a clear, binary (pass/fail), and deterministic outcome. The completion criteria are based on verifiable state changes in the database, file system, or UI, making them suitable for automated verification by an AI agent.
*   **Full-Stack Validation**-- Tests are designed to be comprehensive, covering the entire application stack from UI interactions in the Renderer process to backend business logic in the Main process, including the SQLite database and local file system.
*   **Confidence Through Coverage**-- The test suite aims to cover all critical user paths and core functionalities as defined in the project's epics. A "green" test run signifies that all foundational requirements have been met.

## 2. Recommended Tooling-- Playwright

As established in the high-level research report, **Playwright** is the chosen framework for all end-to-end acceptance testing.

### 2.1. Justification for Playwright

Playwright is a modern, actively maintained framework developed by Microsoft. It offers superior architectural advantages for testing Electron applications, allowing deep introspection into both Main and Renderer processes. This capability is critical for Playlistify, as it enables tests to mock and spy on IPC events, directly query the database, and verify backend logic in a way that older tools like Spectron cannot. Its rich feature set, including auto-waits, powerful selectors, and robust tooling like Codegen and Trace Viewer, helps reduce test flakiness and improve developer productivity.

### 2.2. AI-Verifiable Testing with Playwright

Playwright is inherently suited for AI-verifiable testing. An AI agent can reliably--
1.  **Execute a test script** via a command-line interface.
2.  **Parse the structured output** (e.g., JUnit or JSON format) to determine pass/fail status.
3.  **Verify outcomes** by comparing test results against expected values.
4.  **Analyze failures** by examining structured error messages and Playwright Traces to understand the context and root cause of a failure.

## 3. High-Level Acceptance Test Suite

The following test cases are the initial, high-level acceptance tests for the project. They are organized by Epic and correspond directly to the user stories and the strategy report.

---

### **Epic 1-- Project Foundation & Playlist Viewing**

#### **Test Case 1.1-- Application Layout and Navigation**
*   **Covers Stories**-- 1.1, 1.2
*   **Scenario**--
    1.  Launch the application.
    2.  Verify the main window is visible.
    3.  Assert that the primary layout components (sidebar, top navigation, main content area) are rendered in their correct positions.
    4.  Navigate to the "Dashboard" view.
    5.  Assert that the "Recent Playlists" and "Continue Watching" sections are visible with their default empty-state messages.
*   **AI-Verifiable Outcome**--
    *   **Process Exit Code**-- The Playwright test runner exits with code 0.
    *   **DOM State**-- Assertions confirm the existence and visibility of elements with specific identifiers (e.g., `#sidebar`, `#top-nav`, `h2:has-text("Recent Playlists")`).
    *   **Screenshot Comparison**-- A visual regression snapshot of the initial dashboard view matches the baseline image.

#### **Test Case 1.2-- End-to-End Public Playlist Import**
*   **Covers Story**-- 1.3
*   **Scenario**--
    1.  Mock the necessary Electron APIs (`dialog`, `Notification`).
    2.  Initiate the "Add Playlist" flow and simulate pasting a valid YouTube playlist URL.
    3.  Wait for the playlist preview to appear and assert its content is correct.
    4.  Click "Import" to start the background process.
    5.  Query the test database to verify that a new task record is created in `background_tasks` with `type: 'IMPORT'` and `status: 'QUEUED'`.
    6.  Listen for the `task:update` IPC event to confirm real-time UI updates.
    7.  After the import process completes, query the `playlists` and `videos` tables to confirm the data was inserted correctly.
    8.  Verify that the mocked Notification API was called with the correct "Import Complete" title and body.
*   **AI-Verifiable Outcome**--
    *   **Database State**-- An SQL query confirms the creation of the background task and the final playlist/video records. The count of inserted videos must match the expected number.
    *   **API Mock Calls**-- The test runner confirms that the mocked Notification constructor was called with the expected arguments.
    *   **IPC Call Verification**-- A spy on `ipcRenderer` confirms the `task:update` event was received with the correct payload structure.

#### **Test Case 1.3-- Playlist Viewing and Interaction**
*   **Covers Stories**-- 1.4, 1.5
*   **Scenario**--
    1.  Pre-populate the test database with an existing imported playlist.
    2.  Launch the app and navigate to the playlist's detail view.
    3.  Verify that a skeleton loader is displayed during data fetching.
    4.  Once loaded, assert that the header displays the correct title and video count.
    5.  Type a search query into the search field.
    6.  Assert that the video list filters correctly based on the query.
    7.  Clear the query and assert the full list is restored.
    8.  Enter a query with no matches and verify the "No results found" message appears.
*   **AI-Verifiable Outcome**--
    *   **DOM State**-- Assertions confirm the presence and content of header elements and the correct number of `.video-list-item` elements before, during, and after the search.

---

### **Epic 2-- Custom Playlist Management**

#### **Test Case 2.1-- Create Custom Playlist and Handle Duplicate Titles**
*   **Covers Story**-- 2.1
*   **Scenario**--
    1.  Navigate to the "Add Playlist" -> "Custom Playlist" tab.
    2.  Enter a unique title and description and click "Create Playlist".
    3.  Query the database to confirm the new playlist was created with `type = 'CUSTOM'`.
    4.  Repeat the process with the *exact same title*.
    5.  Assert that a UI error message "A playlist with this title already exists" is displayed.
    6.  Query the database again to confirm no duplicate record was created.
*   **AI-Verifiable Outcome**--
    *   **Database State**-- An SQL query verifies the creation of the first playlist. A second query confirms the count of playlists with that title remains 1 after the second attempt.
    *   **DOM State**-- An assertion confirms the visibility of the specific error message element in the UI.

---

### **Epic 3-- Core Downloading & Offline Playback**

#### **Test Case 3.1-- Single Video Download and File Verification**
*   **Covers Story**-- 3.1
*   **Scenario**--
    1.  Configure the test environment with mocked `yt-dlp` and `fluent-ffmpeg` executables that create dummy files.
    2.  Initiate a download for a single video.
    3.  Query the `background_tasks` table to verify task creation.
    4.  After the simulated download, query the `videos` table to assert `download_status` is 'COMPLETED'.
    5.  Verify the mocked `yt-dlp` script was called with the correct arguments.
    6.  Use Node.js `fs` module to assert the dummy video file exists at the expected path.
*   **AI-Verifiable Outcome**--
    *   **File System State**-- The test passes only if `fs.existsSync(expectedFilePath)` returns `true`.
    *   **Database State**-- SQL queries confirm the task creation and final video status.
    *   **Process Interaction**-- The test verifies that the mocked `yt-dlp` process was spawned with the correct command-line arguments.

---

### **Epic 4-- Background Tasks & Activity Center**

#### **Test Case 4.1-- Task Persistence and Re-queuing on Startup**
*   **Covers Story**-- 4.1
*   **Scenario**--
    1.  Programmatically insert a task record into `background_tasks` with a status of 'DOWNLOADING'.
    2.  Launch the application.
    3.  Verify that the `BackgroundTaskService` identifies and re-queues the "orphaned" task.
*   **AI-Verifiable Outcome**--
    *   **Mock Interaction**-- A spy on the `p-queue`'s `add` method asserts that it was called on application startup with the orphaned task's data.
    *   **Log Analysis**-- The test runner checks for a specific log output, such as "Re-queuing orphaned task with ID-- 123".

#### **Test Case 4.2-- Real-time Activity Center Updates and Cancellation**
*   **Covers Story**-- 4.2
*   **Scenario**--
    1.  Initiate a background task.
    2.  Verify the Activity Center widget appears and displays the task.
    3.  Simulate `task:update` IPC events and assert the progress bar UI element updates accordingly.
    4.  Click the "Cancel" button for the task.
    5.  Verify a `task:cancel` IPC event was sent.
    6.  Query the database to assert the task's status is `CANCELLED`.
*   **AI-Verifiable Outcome**--
    *   **DOM State**-- Assertions check the `style` or `value` attribute of the progress bar at multiple points.
    *   **Database State**-- An SQL query confirms the task's final status is `CANCELLED`.
    *   **IPC Call Verification**-- A spy on `ipcRenderer.invoke` confirms `task:cancel` was called with the correct task ID.

---

### **Epic 5-- Playlist Health & Status Sync**

#### **Test Case 5.1-- Scheduled Sync with Active Task Deferral**
*   **Covers Story**-- 5.2
*   **Scenario**--
    1.  Use a mock scheduler and a mock `electron-store`.
    2.  **Part 1 (Idle System)**-- Advance the mock clock and assert that the `HealthCheckService` is triggered.
    3.  **Part 2 (Busy System)**-- Initiate a user-facing background task (e.g., a download). Advance the mock clock again.
    4.  Assert that the `HealthCheckService` was *not* triggered.
    5.  Cancel the user task, advance the clock, and assert the `HealthCheckService` now runs.
*   **AI-Verifiable Outcome**--
    *   **Mock Interaction**-- The primary outcome is the call count of the mocked `HealthCheckService.run()` method. The test asserts the call count at each stage of the scenario, and the pass/fail result of these assertions is the verifiable outcome.
