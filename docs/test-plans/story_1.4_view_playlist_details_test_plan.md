# Test Plan: User Story 1.4 - View Playlist Details

## 1. Overview

This document outlines the granular test plan for **User Story 1.4: View Playlist Details**. The objective is to verify that a user can select an imported playlist and view its contents, including video thumbnails, titles, and other metadata.

Testing will adhere to the principles of **London School Test-Driven Development (TDD)**, focusing on behavior verification through interaction-based testing. Collaborators (like the database and network services) will be mocked to isolate the component under test and ensure tests are fast, reliable, and deterministic.

## 2. Test Scope

This test plan directly targets the following Acceptance Criteria (AC) from the project specifications ([`docs/specifications/user_stories.md`](docs/specifications/user_stories.md:49)):

*   **AC1:** The test will pre-populate the database with a playlist. Clicking this playlist in the sidebar navigates to its detail view.
*   **AC2:** A skeleton loader that mimics the final layout is displayed while data is being fetched.
*   **AC3:** The view header renders the correct playlist title and total video count, verifiable via DOM assertion.
*   **AC4:** The view renders a list of videos, with each item (`.video-list-item`) displaying its thumbnail, title, channel, and duration.

## 3. Test Cases & Mocking Strategy

### 3.1. AC1: Navigation and Data Seeding

*   **Test Case 1.1:** Verify navigation to the playlist detail view upon clicking a playlist in the sidebar.
*   **Mocking Strategy:**
    *   **Database Seeding:** Before the test runs, the test setup will use a mock function exposed to the browser context via `page.exposeFunction`. This function, named `seedDatabase`, will programmatically insert a sample playlist and its associated video records into the database.
        *   **Mock Playlist Data:** `{ id: 1, name: 'Synthwave Gems', videoCount: 3 }`
        *   **Mock Video Data:** (See section 3.3 for structure)
    *   **UI Interaction:** The test will simulate a user click on the sidebar link corresponding to the seeded playlist. The link will be selected using specific attributes.
        *   **Selector:** `a.playlist-link[data-playlist-id="1"]`
        *   **Example HTML:** `<a href="#" class="playlist-link" data-playlist-id="1">Synthwave Gems</a>`
    *   **Verification:** After the click, the test will assert that the application has navigated to the correct view. This is verified by checking for the presence of a unique container element for the playlist detail page.
        *   **Assertion:** `expect(page.locator('#playlist-detail-view')).toBeVisible()`

### 3.2. AC2: Skeleton Loader UI

*   **Test Case 2.1:** Verify the skeleton loader is displayed while video data is being fetched.
*   **Mocking Strategy:**
    *   **Network Interception:** The test will use `page.route()` to intercept the network request responsible for fetching the playlist's video data (e.g., an IPC call to `get-videos-for-playlist`).
    *   **Simulated Delay:** The intercepted route handler will introduce an artificial delay of 2000ms before resolving with the mock video data. This provides a window to verify the loading state.
    *   **Verification:**
        1.  Immediately after the navigation click, assert that the skeleton loader is visible.
            *   **Assertion:** `expect(page.locator('.skeleton-loader')).toBeVisible()`
        2.  After the network request has been fulfilled (post-delay), assert that the skeleton loader is no longer present in the DOM.
            *   **Assertion:** `expect(page.locator('.skeleton-loader')).not.toBeVisible()`

### 3.3. AC3 & AC4: Content Verification

*   **Test Case 3.1:** Verify the header displays the correct playlist title and video count.
*   **Test Case 4.1:** Verify the structure and content of each video item in the list.
*   **Mocking Strategy:**
    *   **Mock Data:** The `page.route()` handler established in the previous step will return a predefined array of mock video objects when the fetch request is intercepted.
        *   **Mock Data Structure:**
            ```json
            [
              { "id": 101, "title": "Mitch Murder - Palmer's Arcade", "thumbnailUrl": "/path/to/thumb1.jpg", "channelName": "Mitch Murder", "duration": "3:45" },
              { "id": 102, "title": "FM-84 - Running In The Night", "thumbnailUrl": "/path/to/thumb2.jpg", "channelName": "FM-84", "duration": "4:30" },
              { "id": 103, "title": "The Midnight - Sunset", "thumbnailUrl": "/path/to/thumb3.jpg", "channelName": "The Midnight", "duration": "5:21" }
            ]
            ```
*   **Verification:**
    *   **Header:** After the data has loaded and the skeleton loader is gone:
        *   Assert the playlist title matches the mock data: `expect(page.locator('h1#playlist-title')).toHaveText('Synthwave Gems')`
        *   Assert the video count is correct: `expect(page.locator('span#video-count')).toHaveText('3 videos')`
    *   **Video List:**
        *   Assert the number of rendered video items matches the mock data length: `expect(page.locator('.video-list-item')).toHaveCount(3)`
        *   Perform a detailed assertion on the first item in the list (`:first-child`):
            *   **Thumbnail:** `expect(page.locator('.video-list-item:first-child img')).toHaveAttribute('src', '/path/to/thumb1.jpg')`
            *   **Title:** `expect(page.locator('.video-list-item:first-child .video-title')).toHaveText("Mitch Murder - Palmer's Arcade")`
            *   **Channel:** `expect(page.locator('.video-list-item:first-child .channel-name')).toHaveText('Mitch Murder')`
            *   **Duration:** `expect(page.locator('.video-list-item:first-child .video-duration')).toHaveText('3:45')`

## 4. Broader Testing Strategies

### 4.1. Recursive Regression Testing

Upon successful implementation and testing, these test cases will be integrated into the main regression suite. They will be executed automatically on every commit to ensure that future changes do not break the functionality of the playlist detail view.

### 4.2. Edge Case Testing

A separate suite of tests will be created to address potential edge cases:

*   **Empty Playlist:** A test where the seeded playlist contains zero videos. The view should display the correct title, a "0 videos" count, and a message like "This playlist is empty."
*   **Playlist Not Found:** A test that attempts to navigate to a non-existent playlist ID. The application should handle this gracefully, perhaps by redirecting to a "Not Found" page or the dashboard.
*   **Long Text:** Test with very long playlist titles and video titles to ensure the UI does not break and text is truncated or wrapped correctly.
*   **Missing Metadata:** Test how the UI renders a video item if some data fields (e.g., `thumbnailUrl`, `channelName`) are null or empty strings.

### 4.3. Chaos Testing

To ensure resilience, chaos tests will be introduced:

*   **Network Failure:** Use `page.route()` to simulate a network failure (e.g., return a 500 status or reject the promise) when fetching video data. The UI should display a persistent, user-friendly error message (e.g., "Failed to load videos. Please try again.").
*   **Slow Network Simulation:** Throttle the network response to an extremely slow speed to verify the skeleton loader remains visible for the duration and does not cause the UI to become unresponsive.
*   **Database Unavailability:** Simulate a failure in the `seedDatabase` mock function to ensure the test fails predictably if the initial state cannot be established.

## 5. AI-Verifiable Completion Criterion

The creation and merging of this Markdown document at `docs/test-plans/story_1.4_view_playlist_details_test_plan.md` serves as the AI-verifiable outcome for the completion of this test planning phase.