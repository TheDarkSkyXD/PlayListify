# UI/UX Flows

This document details the key user interface (UI) and user experience (UX) flows for the Playlistify application. It provides a step-by-step description of user interactions and the corresponding system responses.

---

## 1. Core Navigation and Layout

*   **1.1. Initial View:**
    1.  User launches the application.
    2.  The main window appears, displaying the `AppLayout` component.
    3.  The layout consists of a persistent `Sidenavbar` on the left, a `TopNavbar` at the top, and a main content area.
    4.  The "Dashboard" view is loaded into the main content area by default.

*   **1.2. Page Navigation:**
    1.  User clicks a navigation link in the `Sidenavbar` (e.g., "Downloads").
    2.  The `TanStack Router` updates the route.
    3.  The corresponding page component (e.g., `Downloads.tsx`) is rendered in the main content area.
    4.  The `Sidenavbar` and `TopNavbar` remain unchanged.

---

## 2. Playlist Import Flow

*   **2.1. Initiating Import:**
    1.  User clicks the `+ Add` button in the `TopNavbar`.
    2.  A dropdown menu appears. User selects "Add Playlist".
    3.  The `AddNewPlaylistDialog` modal appears, displaying two tabs: "From YouTube" (default) and "Custom Playlist".

*   **2.2. YouTube Playlist Import:**
    1.  User pastes a valid YouTube playlist URL into the input field on the "From YouTube" tab.
    2.  After a 300ms debounce, the frontend sends the URL to the backend via the `playlist:get-preview` IPC channel.
    3.  The backend uses `yt-dlp` to fetch the playlist's metadata.
    4.  A preview section appears in the dialog, displaying the playlist's thumbnail, title, and video count.
    5.  User clicks the "Import" button.
    6.  The dialog closes immediately.
    7.  The frontend sends the URL to the `playlist:import` IPC channel.
    8.  The backend creates a new `'IMPORT'` task in the `background_tasks` table.
    9.  The `ActivityCenter` widget appears in the bottom-right corner, showing the new import task with a "Queued" status.
    10. The backend processes the import, and the `ActivityCenter` shows real-time progress.
    11. Upon completion, a system notification is triggered, and the new playlist appears in the `Sidenavbar`.

---

## 3. Custom Playlist Creation Flow

*   **3.1. Creating the Playlist:**
    1.  User opens the `AddNewPlaylistDialog` and clicks the "Custom Playlist" tab.
    2.  User fills in the "Title" and "Description" fields. Character counters provide real-time feedback.
    3.  User clicks the "Create Playlist" button.
    4.  The frontend calls the `playlist:create-custom` IPC channel.
    5.  **Success Path:** The backend verifies the title is unique, creates the playlist in the database, the dialog closes, and the new playlist appears in the `Sidenavbar`.
    6.  **Failure Path (Duplicate Title):** The backend returns a `DUPLICATE_TITLE` error. The dialog remains open, and an error message "A playlist with this title already exists." is displayed below the title field.

---

## 4. Video Download Flow (Single Video)

*   **4.1. Initiating Download:**
    1.  User right-clicks a video in any playlist view to open its context menu.
    2.  User selects the "Download" option.
    3.  The `DownloadContentDialog` modal opens.

*   **4.2. Configuring and Starting Download:**
    1.  The dialog automatically fetches and displays the available quality options for that specific video via the `download:get-quality-options` IPC channel.
    2.  User selects the desired format (MP4/MP3) and quality.
    3.  User can optionally click "Select Location" to open a native OS folder selection dialog.
    4.  User clicks "Add to Download Queue".
    5.  The dialog closes.
    6.  The frontend calls the `download:start` IPC channel.
    7.  The backend performs a disk space check. If it fails, a system notification is shown.
    8.  If successful, a new `'DOWNLOAD'` task is created and appears in the `ActivityCenter`.
    9.  The backend downloads the video, embeds the thumbnail, and moves it to the final location.
    10. The `ActivityCenter` shows real-time progress and status updates.

---

## 5. Activity Center and Task Monitoring

*   **5.1. Task Lifecycle:**
    1.  A long-running task (import/download) is initiated by the user.
    2.  A new task item immediately appears in the `ActivityCenter` with a "Queued" status.
    3.  When the task starts processing, its status changes to "In Progress" (e.g., "Downloading", "Importing"), and a progress bar appears and updates.
    4.  If the user clicks the "Cancel" button on a task, its status changes to "Cancelled".
    5.  Upon completion, the status changes to "Completed" or "Failed".
    6.  The completed/failed task item remains in the list for a brief period (e.g., 10 seconds) before fading out.

*   **5.2. Widget Interaction:**
    1.  User can click the "Minimize" icon on the `ActivityCenter` header to collapse the widget, showing only the header.
    2.  User can click the "Clear All" button to immediately remove all tasks with a terminal status (Completed, Failed, Cancelled) from the view.