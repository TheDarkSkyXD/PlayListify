# Playlistify: User Stories & Acceptance Criteria

This document outlines the user stories for the Playlistify application. Each story is designed to be a self-contained unit of functionality with clear, measurable, and AI-verifiable acceptance criteria that align with the project's technical architecture.

---

## Epic 1: Project Foundation & Playlist Viewing

**Goal:** Establish the core application shell and enable users to import, view, and search within public YouTube playlists.

---

### **Story 1.1: Main Application Layout**

**As a user,** I want to see the main application window with a persistent sidebar and top navigation bar so that I can understand the layout and see the main sections of the app.

*   **Acceptance Criteria:**
    *   **AC1:** The application launches and displays a single, primary window.
    *   **AC2:** A sidebar is rendered on the left side of the window and remains visible across all main navigation routes.
    *   **AC3:** A top navigation bar is rendered at the top of the window and remains visible across all main navigation routes.
    *   **AC4:** The main content area is correctly rendered to the right of the sidebar and below the top navigation bar.

---

### **Story 1.2: Build Dashboard UI Structure**

**As a user,** I want a dashboard that serves as my central starting point, designed to display my "Recent Playlists" and "Continue Watching" history.

*   **Acceptance Criteria:**
    *   **AC1:** A "Dashboard" view is rendered when the corresponding navigation item is clicked.
    *   **AC2:** The dashboard contains two distinct sections with the headers "Recent Playlists" and "Continue Watching".
    *   **AC3:** When no data is available, the "Recent Playlists" section must display the exact text: "Your recent playlists will appear here."
    *   **AC4:** When no data is available, the "Continue Watching" section must display an empty state message.

---

### **Story 1.3: Import Public Playlist**

**As a user,** I want to use the `+ Add` menu to import a public YouTube playlist using its URL, so that the import process starts in the background and I can continue using the app.

*   **Acceptance Criteria:**
    *   **AC1:** Clicking the "Add Playlist" menu item opens a dialog. Upon pasting a valid YouTube playlist URL, a preview of the playlist (thumbnail, title, video count) is displayed within the dialog within 2 seconds.
    *   **AC2:** When the "Import" button is clicked, a new task with `type: 'IMPORT'` and `status: 'QUEUED'` must be created in the `background_tasks` table in the SQLite database.
    *   **AC3:** The import operation must be non-blocking. The UI thread must remain responsive, with user interactions completing in under 200ms while the import is in progress.
    *   **AC4:** Upon task creation, a `task:update` event must be emitted via the secure IPC bridge, making the new task immediately visible in the Activity Center UI.
    *   **AC5:** After the background task successfully inserts the playlist and video data into the SQLite database, a desktop notification with the title "Import Complete" and the body "[Playlist Title] has been successfully imported" must be displayed.

---

### **Story 1.4: View Playlist Details**

**As a user,** I want to select an imported playlist and see the list of all its videos, including thumbnails and titles, so that I can browse its contents.

*   **Acceptance Criteria:**
    *   **AC1:** Clicking a playlist in the sidebar navigates to the playlist details view for that `playlistId`.
    *   **AC2:** While the `playlist:get-details` IPC call is pending, the UI must display a skeleton loader that mimics the structure of the playlist header and at least five video list items.
    *   **AC3:** The `playlist:get-details` IPC handler must query the SQLite database, joining the `playlists`, `videos`, and `playlist_videos` tables to retrieve all data for the given `playlistId`.
    *   **AC4:** The view must render the playlist's title, total video count, and a "Last checked" timestamp in the header.
    *   **AC5:** Each video in the list must render its thumbnail, title, channel name, duration, and a status dot.

---

### **Story 1.5: Search within Playlist**

**As a user,** I want to search for a specific video by title within a selected playlist so that I can find content quickly.

*   **Acceptance Criteria:**
    *   **AC1:** The playlist detail view must contain a text input field for search.
    *   **AC2:** The search input must be debounced by 300ms to prevent re-renders on every keystroke.
    *   **AC3:** The video list must filter client-side within 50ms of the debounced search query changing, showing only videos whose titles contain a case-insensitive match of the query.
    *   **AC4:** If the filtered result is empty, a message "No results found" must be displayed.

---

### **Story 1.6: Infinite Scroll for Video Lists**

**As a user browsing a large playlist,** I want the video list to load more items automatically as I scroll down so that I can view all content without clicking through pages.

*   **Acceptance Criteria:**
    *   **AC1:** When scrolling through a list of 1000+ video items, the browser frame rate must remain at or above 50 FPS.
    *   **AC2:** The number of `VideoListItem` components rendered in the DOM must not exceed the number of visible items plus a buffer of 10 (5 above, 5 below the viewport).
    *   **AC3:** The scrollbar's size must accurately reflect the total size of the virtualized list, not just the rendered items.

---

## Epic 2: Custom Playlist Management

**Goal:** Empower users to create, populate, and manage their own local playlists from scratch.

---

### **Story 2.1: Create a Custom Playlist**

**As a user,** I want to create a new, empty custom playlist with a unique title and description.

*   **Acceptance Criteria:**
    *   **AC1:** The "Add Playlist" dialog must have a "Custom Playlist" tab with "Title" and "Description" fields.
    *   **AC2:** The Title field must enforce a 100-character limit and the Description must enforce a 512-character limit, both with visible character counters.
    *   **AC3:** On clicking "Create Playlist," the `playlist:create-custom` IPC handler must be called. The handler must first query the database to ensure the title is unique.
    *   **AC4:** If the title already exists, the IPC handler must return an error `{ success: false, error: 'DUPLICATE_TITLE' }`, and the UI must display the message "A playlist with this title already exists."
    *   **AC5:** If the title is unique, the handler must insert a new record into the `playlists` table with `type = 'CUSTOM'`.

---

### **Story 2.2: Add Videos to a Custom Playlist**

**As a user,** I want to add a video from an existing playlist to one of my custom playlists so I can organize content according to my own themes.

*   **Acceptance Criteria:**
    *   **AC1:** The context menu for any video must have an "Add to Playlist" option, which reveals a submenu listing all custom playlists.
    *   **AC2:** On selecting a playlist, the `playlist:add-video-to-custom` IPC handler must be called.
    *   **AC3:** The backend handler must first check the `playlist_videos` junction table to see if the video-playlist association already exists.
    *   **AC4:** If the association exists, no new record is created, and a notification "Video is already in this playlist" is shown.
    *   **AC5:** If the association does not exist, a new row is inserted into the `playlist_videos` table, and a notification "Video added to '[Playlist Name]'" is shown.

---

## Epic 3: Core Downloading & Offline Playback

**Goal:** Implement a robust archiving system, allowing users to download videos with smart quality selection and watch them offline.

---

### **Story 3.1: Download a Single Video**

**As a user,** I want to download a single video from a playlist or URL with full control over the options, so I can save specific content to my library.

*   **Acceptance Criteria:**
    *   **AC1:** The "Download" dialog must allow format selection (MP4/MP3) and dynamically populate a quality dropdown based on the available qualities for that video.
    *   **AC2:** Before downloading, the backend must verify that available disk space at the target path is greater than the video's estimated size. If not, an error is returned.
    *   **AC3:** The backend download process must use `yt-dlp` to download the video and `fluent-ffmpeg` to embed the thumbnail into the final MP4 file's metadata.
    *   **AC4:** The download task must be created and managed by the persistent, priority-based queue service.
    *   **AC5:** The video's `download_status` in the `videos` table must be updated to 'COMPLETED' upon successful download.

---

### **Story 3.2: Download an Entire Playlist**

**As a user,** I want to download all videos from a playlist with a single action, and for any video that doesn't have my selected quality, I want the app to automatically download the best available quality instead.

*   **Acceptance Criteria:**
    *   **AC1:** Initiating a playlist download creates a "parent" task in the `background_tasks` table.
    *   **AC2:** For each video in the playlist, a "child" download task is created and linked to the parent task.
    *   **AC3:** For each child task, the download service must first query the video's available formats. If the user-selected quality is not present, the service must select the highest available quality from that video's format list for the download command.
    *   **AC4:** The parent task's progress must be calculated as an aggregate of the progress of its child tasks.
    *   **AC5:** If one or more child tasks fail, the parent task's final status must be set to `COMPLETED_WITH_ERRORS`.

---

### **Story 3.3: Basic Offline Playback**

**As a user,** I want to click on a successfully downloaded video and have it play within the application.

*   **Acceptance Criteria:**
    *   **AC1:** When a downloaded video is clicked, the application must first call an IPC handler to verify the local file exists at its recorded path. If not, a "File not found" message is displayed.
    *   **AC2:** The video player must load the video using a secure, custom file protocol (e.g., `app://`) registered via Electron's `protocol.registerFileProtocol`.
    *   **AC3:** The player UI must have working controls for play/pause, volume, and a seek bar that accurately reflects the video's current time and buffered range.

---

## Epic 4: Background Tasks & Activity Center

**Goal:** Implement a robust system for handling long-running tasks and provide a UI for users to monitor their progress.

---

### **Story 4.1: Persistent Backend Task Management**

**As a developer,** I need a centralized, persistent service to manage the state and progress of all long-running background tasks.

*   **Acceptance Criteria:**
    *   **AC1:** A `background_tasks` table exists in the SQLite database, as defined in the schema.
    *   **AC2:** All long-running operations (imports, downloads) create a corresponding record in the `background_tasks` table. All database operations related to task creation and updates must be wrapped in a transaction.
    *   **AC3:** The schema supports a `parentId` to link child tasks to a parent, enabling features like batch playlist downloads.
    *   **AC4:** On application startup, the `BackgroundTaskService` must query the `background_tasks` table for any tasks with a non-terminal status (e.g., 'QUEUED', 'DOWNLOADING'). For each such task, it must re-enqueue the job into the `p-queue`.

---

### **Story 4.2: Activity Center UI**

**As a user,** I want to see a persistent widget that shows me my active tasks, which I can cancel or clear at any time.

*   **Acceptance Criteria:**
    *   **AC1:** A widget is persistently displayed in the bottom-right corner of the application.
    *   **AC2:** The widget listens for `task:update` events from the backend via the IPC bridge and updates its display in real-time.
    *   **AC3:** Each active task in the widget must have a "Cancel" button that calls a `task:cancel` IPC handler, which stops the corresponding backend task and sets its status to `CANCELLED` in the database.
    *   **AC4:** Progress updates displayed in the UI must be throttled to update a maximum of 2 times per second to ensure UI performance.

---

## Epic 5: Playlist Health & Status Sync

**Goal:** Introduce an automated status-checking system for imported playlists to keep users informed about video availability.

---

### **Story 5.1: Backend Health Check Service**

**As a developer,** I need a backend service that can check an imported playlist against YouTube to see if any videos have been deleted or privated.

*   **Acceptance Criteria:**
    *   **AC1:** The service uses `yt-dlp` with a lightweight flag (e.g., `--get-title`) to verify a video's status.
    *   **AC2:** After checking, the service updates the `availability_status` field for the video in the SQLite database to 'Live', 'Deleted', or 'Private'.
    *   **AC3:** The service processes all video checks for a playlist using a `p-queue` instance configured with `{ concurrency: 2 }` to avoid IP rate-limiting.
    *   **AC4:** After all videos in a playlist are checked, the `last_health_check` timestamp on the `playlists` table is updated.

---

### **Story 5.2: Scheduled Background Sync**

**As a developer,** I need a scheduler that automatically and safely runs the Health Check Service on all imported playlists based on the user's chosen frequency.

*   **Acceptance Criteria:**
    *   **AC1:** A scheduler, initialized on app startup, reads the user's sync frequency setting from `electron-store`.
    *   **AC2:** The scheduler checks if it should run based on the user's setting and the `last_health_check` timestamp of each playlist.
    *   **AC3:** The scheduler must query the `BackgroundTaskService` to check for active, user-initiated tasks. If any are found, the health check is paused and will be re-attempted on the next interval.
    *   **AC4:** If the queue is free and it's time to run, the scheduler triggers the `HealthCheckService`.