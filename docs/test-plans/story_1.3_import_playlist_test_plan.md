# Granular Test Plan-- User Story 1.3-- Import Public Playlist

**Document Status-- Draft**

**Author-- Spec-To-TestPlan Converter**

**Date-- 2025-07-05**

---

## 1. Introduction and Scope

This document provides a detailed, granular test plan for **User Story 1.3-- Import Public Playlist**. The primary goal is to ensure that the feature for importing a public YouTube playlist via its URL is robust, reliable, and meets all specified acceptance criteria.

The test scope is strictly limited to the AI-Verifiable End Results defined in the feature specification ([`docs/specifications/user_stories.md`](docs/specifications/user_stories.md:35)).

### 1.1. Targeted Acceptance Criteria

This plan directly addresses the following acceptance criteria--

*   **AC1--** Pasting a valid YouTube playlist URL into the "Add Playlist" dialog displays a correct preview of the playlist (thumbnail, title, video count).
*   **AC2--** Clicking "Import" creates a new task record in the `background_tasks` table with `{ type-- 'IMPORT', status-- 'QUEUED' }`.
*   **AC3--** The import operation is non-blocking, and the UI remains responsive.
*   **AC4--** A `task--update` IPC event is emitted with the correct payload.
*   **AC5--** Upon completion, the `playlists` and `videos` tables are correctly populated.
*   **AC6--** A desktop notification "Import Complete" is triggered.

## 2. Testing Philosophy-- London School TDD

We will adhere to the principles of the London School of Test-Driven Development (TDD). This approach emphasizes mocking collaborator objects and verifying the interactions between the unit under test and its dependencies. The focus is on verifying *observable outcomes* and *state changes* through these interactions, rather than testing the internal implementation details of collaborators. This ensures our tests are resilient to refactoring and accurately reflect the component's contract with the rest of the system.

## 3. Granular Test Cases & Mocking Strategy

Each acceptance criterion is broken down into specific, verifiable test cases below.

### 3.1. AC1-- Playlist Preview Display

*   **Test Case 1.1--** Given a valid YouTube playlist URL, when the user pastes it into the input field, then the application should fetch and display the playlist's metadata.
*   **Mocking Strategy--**
    *   **Collaborator--** The network service responsible for fetching YouTube metadata (e.g., `YoutubeService.getPlaylistMetadata`).
    *   **Method--** We will use a test spy or mock to intercept the call to this service. The mock will prevent an actual network request and immediately return a predefined JSON object.
    *   **Mock Response Structure--** The mock will be configured to return the following structure--
        ```json
        {
          "success"-- true,
          "data"-- {
            "title"-- "Awesome Mix Vol. 1",
            "thumbnailUrl"-- "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
            "videoCount"-- 12
          }
        }
        ```
    *   **Assertion--**
        1.  Verify that the `getPlaylistMetadata` method was called exactly once with the correct URL.
        2.  Check the UI state to confirm that the elements displaying the title, thumbnail, and video count have been populated with the data from the mock response.

### 3.2. AC2 & AC5-- Database State Verification

*   **Test Case 2.1--** Given a valid playlist preview, when the user clicks "Import", then a new record is created in the `background_tasks` table.
*   **Test Case 5.1--** When the background import task successfully completes, then the `playlists` and `videos` tables are populated with the correct data.
*   **Mocking Strategy--**
    *   **Collaborator--** The data repository layer (e.g., `BackgroundTaskRepository`, `PlaylistRepository`, `VideoRepository`).
    *   **Method--** We will mock the entire repository layer. This is preferable to mocking the database driver (`sqlite3`) itself, as it isolates the tests from the database implementation and focuses on the application's interaction with its data abstraction layer. An in-memory database could also be used for integration tests, but for unit tests, mocking the repository is cleaner.
    *   **Assertion Logic--**
        *   **For AC2--** Assert that the `backgroundTaskRepository.createTask` method was called with an object matching `{ type-- 'IMPORT', status-- 'QUEUED', payload-- { url-- '...' } }`.
        *   **For AC5--**
            1.  Simulate the successful completion of the import task.
            2.  Assert that `playlistRepository.createPlaylist` was called with the correct playlist metadata.
            3.  Assert that `videoRepository.createVideo` was called `n` times, where `n` is the `videoCount` from the source data.

### 3.3. AC4-- IPC Event Emission

*   **Test Case 4.1--** When a background task is created or its status changes, then a `task--update` IPC event is sent to the renderer process.
*   **Mocking Strategy--**
    *   **Collaborator--** The `ipcRenderer` or `ipcMain` module, depending on where the event originates.
    *   **Method--** In the test environment, we will spy on the `ipcRenderer.send` (or equivalent) method to capture the arguments it is called with.
    *   **Expected Payload Structure--** The spy should capture a call with the channel name `task--update` and a payload object matching this structure--
        ```typescript
        interface TaskUpdatePayload {
          taskId-- string;
          status-- 'QUEUED' -- 'IN_PROGRESS' -- 'COMPLETED' -- 'FAILED';
          progress?-- number; // e.g., 0, 50, 100
          error?-- string;
        }
        ```
    *   **Assertion--** Assert that the `ipcRenderer.send` spy was called with the channel `'task--update'` and a payload that matches the expected structure and values for the current state of the task.

### 3.4. AC6-- Desktop Notification

*   **Test Case 6.1--** When the import task status changes to 'COMPLETED', then a desktop notification is displayed.
*   **Mocking Strategy--**
    *   **Collaborator--** The global `Notification` object in the renderer process's `window`.
    *   **Method--** Before the test runs, we will replace the `window.Notification` object with a mock constructor (e.g., using `jest.fn()`).
    *   **Assertion--**
        1.  Simulate the import task completing.
        2.  Assert that the mock `Notification` constructor was called.
        3.  Assert that it was called with the title `'Import Complete'` and a body containing the name of the imported playlist.

## 4. Advanced Testing Strategies

### 4.1. Recursive Regression Testing

The full suite of tests defined in this document will be integrated into the project's CI/CD pipeline. This suite will be executed automatically upon every commit to the main branch or any pull request targeting it. This ensures that any future modifications to the import logic, database layer, IPC communication, or UI components do not inadvertently break this core functionality.

### 4.2. Edge Case Testing

The following edge cases will be scripted as separate tests to ensure robustness--
*   **Invalid Input--** Pasting a non-URL string, a URL to a single video, or a URL to a non-YouTube domain.
*   **Network Failures--** Mocking a network error during the initial metadata fetch. The UI should display a user-friendly error message.
*   **Playlist Variants--** Testing with a private playlist, an empty playlist, and a very large playlist (e.g., 200+ videos) to check for performance bottlenecks.
*   **Data Integrity--** Simulating a database write failure midway through the import process. The task status should be updated to `'FAILED'` and a cleanup process should be initiated.

### 4.3. Chaos Testing

To test for resilience under unpredictable conditions, we will design chaos tests that simulate failure modes--
*   **Scenario 1-- Network Flap--** During an active import, simulate the network connection dropping and then returning. The import task should ideally pause and resume, or fail gracefully.
*   **Scenario 2-- Database Unavailability--** Mock the database repository to throw a "connection lost" error during a write operation. The system must handle this by marking the task as failed and reporting the error correctly via IPC.
*   **Scenario 3-- Process Crash--** While a task is `'IN_PROGRESS'`, simulate a renderer process crash. Upon application restart, the system should be able to identify and potentially restart or clean up the incomplete task from the `background_tasks` table.
