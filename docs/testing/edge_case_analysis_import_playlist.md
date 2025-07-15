# Edge Case Analysis for User Story 1.3: Import Public Playlist

This document defines the expected behavior for various edge cases related to the "Import Public Playlist" feature. The goal is to ensure the application is robust and provides clear feedback to the user under exceptional conditions.

---

## 1. Invalid Input

### 1.1 Malformed or Non-YouTube URLs
-   **Scenario:** The user enters a string that is not a valid URL (e.g., "not a url") or a URL from a different domain (e.g., "https://vimeo.com/12345").
-   **Expected Behavior:**
    -   The UI should display an immediate, inline error message next to the input field, such as "Invalid URL format. Please enter a valid YouTube playlist URL."
    -   The "Import" button should be disabled until a validly formatted YouTube URL is entered.
    -   No network requests should be made.

### 1.2 URL for a Single Video
-   **Scenario:** The user provides a valid URL for a single YouTube video instead of a playlist (e.g., `https://www.youtube.com/watch?v=...`).
-   **Expected Behavior:**
    -   Upon pasting the URL, the application should validate it and recognize it's not a playlist.
    -   The UI should display a clear error message in the dialog, such as "This is a URL for a single video, not a playlist. Please provide a playlist URL."
    -   The "Import" button should remain disabled.
    -   No import task should be created.

---

## 2. Playlist Issues

### 2.1 Private, Members-Only, or Non-Existent Playlist
-   **Scenario:** The user provides a valid URL for a YouTube playlist that is private, restricted to members, or has been deleted.
-   **Expected Behavior:**
    -   The application will attempt to fetch the playlist metadata. The YouTube API (or `yt-dlp`) will return an error (e.g., 403 Forbidden, 404 Not Found).
    -   The UI should display an informative error message in the preview area, such as "Could not fetch playlist. It may be private, deleted, or members-only."
    -   The "Import" button should remain disabled.
    -   No import task should be queued.

### 2.2 Empty Playlist
-   **Scenario:** The user provides a valid URL for a public playlist that contains no videos.
-   **Expected Behavior:**
    -   The application should successfully fetch the playlist metadata.
    -   The preview should display the playlist title and a video count of "0".
    -   The "Import" button should be **disabled**, and a message like "Cannot import an empty playlist" should be displayed.
    -   No import task should be created.

---

## 3. Network Failures

### 3.1 Network Error During Metadata Fetch
-   **Scenario:** The user's computer is offline, or a network error occurs when the application tries to fetch the playlist metadata for the preview.
-   **Expected Behavior:**
    -   The UI should display a generic network error message, such as "Network error. Please check your connection and try again."
    -   The preview area should show a failed state.
    -   The "Import" button should remain disabled.
    -   The user should be able to retry by re-pasting the URL or closing and reopening the dialog once the connection is restored.

### 3.2 Network Error During Main Import
-   **Scenario:** After the import task is successfully queued, a network error occurs during the background process (e.g., while fetching the full list of video details or downloading thumbnails).
-   **Expected Behavior:**
    -   The task status in the `background_tasks` table should be updated to `FAILED`.
    -   The task record should store an error reason, e.g., `{ "reason": "NetworkError", "message": "Failed to fetch video details from YouTube." }`.
    -   The Activity Center UI should show the task as "Failed".
    -   A desktop notification should be sent to the user: "Import Failed for [Playlist Title]".

---

## 4. Database Failures

### 4.1 Failure to Write to `background_tasks` Table
-   **Scenario:** The user clicks "Import," but the application fails to write the initial record to the `background_tasks` table (e.g., database connection lost, disk full).
-   **Expected Behavior:**
    -   This is a critical failure. The import process should not proceed.
    -   The UI dialog should display a critical error message, such as "A database error occurred. Could not start the import task."
    -   The application should log the detailed error for debugging purposes.
    -   No background process should be started.

### 4.2 Failure to Write to `playlists` or `videos` Tables
-   **Scenario:** The background import task successfully fetches all data from YouTube but fails to write the final data to the `playlists` or `videos` tables.
-   **Expected Behavior:**
    -   The transaction should be rolled back. No partial data (e.g., a playlist with no videos) should be saved.
    -   The task status in the `background_tasks` table should be updated to `FAILED`.
    -   The task record should store a relevant error reason, e.g., `{ "reason": "DatabaseWriteError", "message": "Failed to save playlist to database." }`.
    -   The Activity Center UI should show the task as "Failed".

---

## 5. User Actions

### 5.1 User Attempts to Cancel Import
-   **Scenario:** The user initiates an import and then clicks the "Cancel" button in the Activity Center while the task is in progress.
-   **Expected Behavior:**
    -   A `task:cancel` IPC event is sent.
    -   The `BackgroundTaskService` should gracefully stop the ongoing process for that task.
    -   The task's status in the `background_tasks` table should be updated to `CANCELLED`.
    -   Any partially downloaded data should be cleaned up.
    -   The UI in the Activity Center should reflect the "Cancelled" status.

### 5.2 User Attempts to Import the Same Playlist Twice
-   **Scenario:** The user attempts to import a playlist that has already been successfully imported.
-   **Expected Behavior:**
    -   Upon pasting the URL, the application should check if a playlist with the same YouTube ID already exists in the database.
    -   If it exists, the UI should display a message like, "This playlist has already been imported."
    -   The "Import" button should be disabled.
    -   No new import task is created.