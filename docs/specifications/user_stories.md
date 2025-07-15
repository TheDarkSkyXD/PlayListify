# User Stories (Single Source of Truth)

This document is the single source of truth for all application requirements, combining user stories with detailed, AI-verifiable acceptance criteria that serve as the test plan.

---

## Epic 1: Project Foundation & Core Infrastructure

**Goal:** Establish the core application shell, including the main layout, navigation, and foundational services for settings, storage, and communication.

---

### **Story 1.1: Main Application Layout**

**As a user,** I want to see a consistent and professional application layout with a sidebar for navigation and a top bar for context, so that I can easily navigate the app and understand its structure.

*   **Acceptance Criteria:**
    *   **AC1:** The application launches displaying a main window with a persistent sidebar (`Sidenavbar.tsx`) and a top navigation bar (`TopNavbar.tsx`).
    *   **AC2:** The sidebar contains clickable navigation links for "Dashboard", "My Playlists", "Downloads", "History", and "Settings".
    *   **AC3:** The top bar displays the application title and a theme (dark/light mode) toggle button.
    *   **AC4:** The main content area renders the component corresponding to the selected route (e.g., `Dashboard.tsx` for the "Dashboard" route).
    *   **AC5:** The application supports both light and dark themes, and the theme can be toggled via the button in the top navbar. The theme choice is persisted across sessions.
    *   **AC6:** A visual regression snapshot of the initial application layout matches the baseline image.

### **Story 1.2: Dashboard UI Structure**

**As a user,** I want a dashboard that serves as my central starting point, designed to display my "Recent Playlists" and "Continue Watching" history so I can quickly resume my activities.

*   **Acceptance Criteria:**
    *   **AC1:** The "Dashboard" route (`/`) renders the `Dashboard.tsx` component.
    *   **AC2:** The dashboard contains two distinct sections with `h2` headers: "Recent Playlists" and "Continue Watching".
    *   **AC3:** When no data is available, these sections display a clear empty-state message (e.g., "You haven't viewed any playlists recently.").
    *   **AC4:** The layout is responsive and adapts to different window sizes without breaking.

### **Story 1.3: Persistent Settings Management**

**As a developer,** I need a reliable way to store and retrieve user settings and application state persistently so that user preferences and application data are not lost between sessions.

*   **Acceptance Criteria:**
    *   **AC1:** The application uses `electron-store` for managing settings, accessible via a `settingsService.ts`.
    *   **AC2:** A default configuration is established and applied on the first launch.
    *   **AC3:** Settings are stored in a predictable location within the user's application data directory.
    *   **AC4:** Settings can be read and written through a type-safe IPC API (`settings-handlers.ts`). For example, `window.api.settings.get('downloadLocation')` returns the correct value.
    *   **AC5:** Changes to settings (e.g., theme, download path) are immediately reflected in the application and persist after a restart.

### **Story 1.4: Foundational File System Utilities**

**As a developer,** I need a set of robust file system utilities to manage application files, directories, and user-generated content like downloads and playlist metadata.

*   **Acceptance Criteria:**
    *   **AC1:** A `fileUtils.ts` module provides functions for creating directories, checking file existence, reading/writing JSON files, and validating paths.
    *   **AC2:** The application initializes required directories (e.g., for downloads, logs, binaries) on startup.
    *   **AC3:** All file system operations are exposed to the frontend via a secure IPC channel (`file-handlers.ts`).
    *   **AC4:** Path validation is implemented to prevent directory traversal or other file system vulnerabilities.

### **Story 1.5: Secure and Type-Safe IPC Communication**

**As a developer,** I need a secure and type-safe communication bridge between the frontend (Renderer) and backend (Main) processes so that data can be exchanged reliably without exposing sensitive Node.js APIs to the frontend.

*   **Acceptance Criteria:**
    *   **AC1:** A `preload.ts` script is configured with `contextIsolation: true` and `nodeIntegration: false`.
    *   **AC2:** The `contextBridge` is used to expose a well-defined API (e.g., `window.api`) to the renderer process.
    *   **AC3:** The exposed API is type-safe, with types shared between the frontend and backend (`src/shared/types`).
    *   **AC4:** No Node.js modules (e.g., `fs`, `path`) are directly exposed to the renderer process.
    *   **AC5:** All communication is funneled through specific IPC handlers (`app-handlers.ts`, `playlist-handlers.ts`, etc.) which call corresponding backend services.

---

## Epic 2: Playlist Management & Content Discovery

**Goal:** Enable users to import public YouTube playlists, create their own custom local playlists, and manage the videos within them.

---

### **Story 2.1: Import Public Playlist via URL**

**As a user,** I want to import a public YouTube playlist by pasting its URL into the "Add New Playlist" dialog so that I can add new content to my library.

*   **Acceptance Criteria:**
    *   **AC1:** Clicking the "Add New Playlist" button opens a dialog with two tabs: "From YouTube" and "Custom Playlist".
    *   **AC2:** Pasting a valid YouTube playlist URL into the "From YouTube" tab's input field triggers a metadata fetch using `yt-dlp`.
    *   **AC3:** The dialog displays a preview of the playlist including its thumbnail, title, and video count.
    *   **AC4:** Clicking "Import" saves the playlist and its video metadata to the database via `playlist-manager.ts`.
    *   **AC5:** The import process runs in the background, and the UI remains responsive.
    *   **AC6:** An invalid URL results in a user-friendly error message within the dialog.
    *   **AC7:** The Content Security Policy in `backend.ts` is configured to allow loading thumbnails from `i.ytimg.com` and `img.youtube.com`.

### **Story 2.2: Create a Custom Playlist**

**As a user,** I want to create a new, empty custom playlist with a unique title and description so that I can organize videos according to my own themes.

*   **Acceptance Criteria:**
    *   **AC1:** In the "Add New Playlist" dialog, the "Custom Playlist" tab contains input fields for "Title" and "Description".
    *   **AC2:** Character limits and counters are displayed for both the title and description fields.
    *   **AC3:** Clicking "Create" with a unique title inserts a new record into the `playlists` table with `type = 'CUSTOM'`.
    *   **AC4:** Attempting to create a playlist with a title that already exists displays a validation error message "A playlist with this title already exists." and does not create a duplicate record.
    *   **AC5:** The form has a loading state during submission to provide feedback to the user.

### **Story 2.3: View and Navigate Playlists**

**As a user,** I want to see all my imported and custom playlists in a clean, responsive grid or list, so that I can easily browse and select them.

*   **Acceptance Criteria:**
    *   **AC1:** The "My Playlists" page displays all playlists in a responsive grid (`PlaylistGrid.tsx`) by default.
    *   **AC2:** Each playlist is represented by a `PlaylistCard.tsx` component showing its thumbnail (with a fallback), title, and video count.
    *   **AC3:** A view toggle button allows switching between a grid view and a list view (`PlaylistListView.tsx`). The choice is persisted.
    *   **AC4:** The page displays a skeleton loader while playlists are being fetched.
    *   **AC5:** If no playlists exist, a clear "empty state" message is shown with a call to action to create or import a playlist.
    *   **AC6:** Clicking on a playlist card navigates the user to the detailed view for that playlist.

### **Story 2.4: View Playlist Details and Search**

**As a user,** I want to select an imported playlist to see all its videos, and search within that list to find specific content quickly.

*   **Acceptance Criteria:**
    *   **AC1:** The playlist detail view header displays the playlist's title, description, and total video count.
    *   **AC2:** The view contains a list of all videos in the playlist, with each item showing the video's thumbnail, title, and duration.
    *   **AC3:** A search input field is present on the playlist detail page.
    *   **AC4:** Typing in the search field filters the displayed video list in real-time (with debouncing) in a case-insensitive manner.
    *   **AC5:** Clearing the search input restores the full, unfiltered list of videos.
    *   **AC6:** If a search yields no results, a "No results found" message is displayed.

### **Story 2.5: Manage Playlists and Videos**

**As a user,** I want to manage my playlists and the videos within them through a set of actions like editing details, deleting, and adding videos to custom playlists.

*   **Acceptance Criteria:**
    *   **AC1:** A dropdown menu (`PlaylistActionsDropdown.tsx`) is available on each playlist card, offering actions like "Edit", "Delete", and "Download".
    *   **AC2:** The "Edit" action opens a dialog (`EditPlaylistDetailsDialog.tsx`) allowing the user to change the title and description of a playlist.
    *   **AC3:** The "Delete" action shows a confirmation dialog (`ConfirmDeleteDialog.tsx`) before permanently removing the playlist and its associated data.
    *   **AC4:** From a video list, a user can add an individual video to one of their custom playlists.
    *   **AC5:** A user can reorder videos within a custom playlist using drag-and-drop.

---

## Epic 3: Video Downloading, Conversion & Offline Playback

**Goal:** Implement a robust archiving system, allowing users to download videos with smart quality selection, convert formats, and watch them offline.

---

### **Story 3.1: Download a Single Video or Entire Playlist**

**As a user,** I want to download a single video or an entire playlist with control over quality and location, so I can watch content offline.

*   **Acceptance Criteria:**
    *   **AC1:** A download can be initiated for a single video or an entire playlist from the UI.
    *   **AC2:** A dialog (`DownloadContentDialog.tsx` or `DownloadPlaylistDialog.tsx`) appears, allowing the user to select video quality and download directory.
    *   **AC3:** The quality selection dropdown is dynamically populated by querying the available formats for the specific video/playlist using `yt-dlp -F`. Only available MP4 qualities are shown.
    *   **AC4:** The download is managed by a queue (`downloadManager.ts` using `p-queue`) to handle concurrent downloads based on user settings.
    *   **AC5:** The `yt-dlp` command uses `--ffmpeg-location` to ensure reliable merging of video and audio streams.
    *   **AC6:** If the user's selected quality is unavailable for a specific video, the system automatically falls back to downloading the next highest available quality for that video.

### **Story 3.2: Embed Thumbnails and Track Download Quality**

**As a user,** I want my downloaded videos to have their original thumbnails embedded, and I want to see the actual quality that was downloaded for each file.

*   **Acceptance Criteria:**
    *   **AC1:** During the download process, `yt-dlp` is used to download the video's thumbnail image file separately.
    *   **AC2:** If necessary, `ffmpegService.ts` converts the thumbnail image to a compatible format (e.g., JPG).
    *   **AC3:** `ffmpegService.ts` is used to embed the converted thumbnail into the final downloaded MP4 file.
    *   **AC4:** The database is updated to store the actual quality that was downloaded for each video (e.g., '1080p', '720p'), which may differ from the requested quality due to the fallback mechanism.
    *   **AC5:** The UI displays the actual downloaded quality for each video in its details.

### **Story 3.3: Monitor Download Status**

**As a user,** I want to see the status and progress of my active and completed downloads so I can track what's happening.

*   **Acceptance Criteria:**
    *   **AC1:** A "Downloads" page (`Downloads.tsx`) displays a list of all current and past downloads.
    *   **AC2:** The list is filterable by status (e.g., Active, Paused, Completed, Failed).
    *   **AC3:** Each download item (`DownloadItem.tsx`) shows its title, thumbnail, a progress bar, and current status.
    *   **AC4:** The UI provides controls to pause, resume, or cancel active downloads.
    *   **AC5:** The download state is managed by a Zustand store (`downloadStore.ts`) and is persisted across application restarts.

### **Story 3.4: Video Format Conversion**

**As a user,** I want the ability to convert a downloaded video to a different format (e.g., MP4 to MP3) so that I can use the content in different ways.

*   **Acceptance Criteria:**
    *   **AC1:** A `formatConverter.ts` service using `fluent-ffmpeg` is available to handle conversions.
    *   **AC2:** The UI provides an option to convert a downloaded video, presenting a `FormatSelector.tsx` component.
    *   **AC3:** The user can select the output format (e.g., mp4, webm, mp3, flac) and quality/bitrate options.
    *   **AC4:** The conversion process shows progress and reports success or failure.
    *   **AC5:** IPC handlers (`formatConverterHandlers.ts`) are set up to manage the communication for format conversion.

### **Story 3.5: Offline Video Playback**

**As a user,** I want to click on a downloaded video and have it play smoothly within the application, even when I'm offline.

*   **Acceptance Criteria:**
    *   **AC1:** Clicking a downloaded video in the UI launches the `VideoPlayer.tsx` component.
    *   **AC2:** The player first verifies the local file exists; if not, a "File not found" error is displayed.
    *   **AC3:** The video is loaded using a secure method (e.g., a custom file protocol or by serving it from the backend).
    *   **AC4:** The player provides custom controls (play/pause, volume, seek, fullscreen) for locally played files.
    *   **AC5:** For streaming a YouTube URL, the player uses the standard YouTube embedded player controls for a familiar experience.
    *   **AC6:** Keyboard shortcuts are available for common playback actions (e.g., spacebar for play/pause, arrow keys for seek).
