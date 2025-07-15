# Product Requirements Document: Playlistify

## 1. Introduction

### 1.1. Problem Statement

For both diligent content archivists and casual users, managing and preserving YouTube playlists presents significant challenges. The native YouTube interface offers limited organizational tools, and users face the constant risk of videos becoming unavailable due to deletion or being set to private. This results in a loss of curated content and a lack of true ownership over one's collections. Playlistify aims to solve this by providing a powerful, desktop-based application that gives users ultimate control to manage, archive, and locally access their YouTube content, securely and conveniently.

### 1.2. Vision

To be the definitive tool for anyone who is serious about their YouTube collections, transforming the passive viewing experience into an actively managed, secure, and permanent personal library. Playlistify will empower users by giving them complete sovereignty over their content.



### 1.3. Target Audience

*   **The Digital Archivist:** A user who wants to create a secure, permanent, and locally-controlled archive of YouTube content to prevent loss from deletion or privatization.
*   **The Convenience User:** A casual user who wants an easy way to download playlists and videos for offline access (e.g., for travel, commuting, or areas with poor internet).



### 1.4. Success Metrics (MVP)

*   Number of playlists created and imported per profile.
*   Total number of videos successfully downloaded.
*   Feature adoption rate for key functions (e.g., use of custom playlists vs. imports, use of the "Health Check" feature).

## 2. Key Features & Scope

### 2.1. Minimum Viable Product (MVP)

The initial release will focus on delivering a stable, core experience without requiring a user to log into a Google account.




#### **Epic 1: Project Foundation & Playlist Viewing**
*   **Goal:** Establish the core application shell and enable users to view and search within playlists.
*   **Features:**
    *   Main application layout with a persistent sidebar and top navigation bar.
    *   Dashboard home screen displaying recently accessed playlists and viewing history.
    *   Ability to view the contents of a playlist, including video thumbnails, titles, channel names, duration, view count, and upload date.
    *   Search functionality within a selected playlist.
    *   Infinite scrolling for seamlessly browse large playlists.




#### **Epic 2: Custom Playlist Management**
*   **Goal:** Empower users to create, populate, and manage their own local playlists.
*   **Features:**
    *   A unified "Add Playlist" dialog with tabs for creating a new custom playlist or importing an existing one from a YouTube URL.
    *   Ability to add videos from any playlist to a custom playlist.
    *   Ability to remove videos from a custom playlist.
    *   Functionality to edit the title and description of custom playlists.
    *   Ability to delete a custom playlist with a confirmation dialog.




#### **Epic 3: Core Downloading & Offline Playback**
*   **Goal:** Implement the core archiving functionality, allowing users to download videos and watch them offline.
*   **Features:**
    *   Download a single video via URL with options for format (MP4/MP3), quality, subtitle inclusion, and save location.
    *   Download an entire playlist with smart quality fallback (if the selected quality is unavailable, the best available quality is chosen).
    *   A dedicated "Downloads" page to view and manage the status of all downloads.
    *   An integrated video player for offline playback of downloaded files with controls for play/pause, volume, seek bar, loop toggle, and subtitle display.




#### **Epic 4: Background Tasks & Activity Center**
*   **Goal:** Implement a system for handling long-running tasks in the background and provide a UI for users to monitor progress.
*   **Features:**
    *   A persistent task management service that tracks the progress of imports and downloads, even if the app is closed and reopened.
    *   An "Activity Center" widget in the bottom-right corner displaying the status of all active and queued tasks.
    *   The ability for users to cancel any in-progress tasks directly from the Activity Center.




#### **Epic 5: Playlist Health & Status Sync**
*   **Goal:** Introduce automated status checking to keep users informed about video availability.
*   **Features:**
    *   A "Playlist Health Check" system that periodically checks the status of videos in imported playlists (Live, Deleted, Private) and displays a colored status dot.
    *   A "Refresh Playlist" button for on-demand manual status checks.
    *   A settings page to configure the frequency of the automatic health checks (e.g., Hourly, Daily, Weekly).




### 2.2. Post-MVP Roadmap

Future releases will focus on expanding functionality through account integration and power-user features.

*   **Full Account Integration:**
    *   Google OAuth2 login and multi-account support.
    *   Access to private and unlisted YouTube playlists.
    *   Integration of "Liked Videos" and "Watch Later" into the sidebar.
    *   A detailed data synchronization center in the settings.
*   **Enhanced Features:**
    *   A "Trash Can" feature to restore accidentally deleted playlists and videos.
    *   Multi-select for batch actions (delete, move, duplicate).
    *   Playlist folders and a custom tagging system for advanced organization.
    *   A full backup and restore system for the entire user library.
*   **UI/UX Improvements:**
    *   An "Active Downloads" section on the dashboard.
    *   User-selectable accent colors for the UI.
    *   Online streaming of videos without downloading.
    *   Advanced video player controls like playback speed.




## 3. Technical Constraints & Preferences

*   **Platform:** Electron (for a cross-platform desktop app).
*   **Boilerplate:** The project will be built upon the `electron-react-boilerplate` foundation.
*   **Core Libraries:**
    *   **Frontend:** React, TypeScript, TailwindCSS
    *   **UI Components:** shadcn/ui, lucide-react
    *   **State Management:** TanStack React Query & Zustand
    *   **Backend:** Node.js
    *   **Database:** better-sqlite3
    *   **YouTube Interaction:** yt-dlp-wrap
    *   **Settings Storage:** electron-store
    *   **Validation:** Zod
*   **Resource Management:** The application must be optimized for low CPU and memory usage, especially when idle. Destructive actions require user confirmation to prevent data loss. Filenames will be sanitized to prevent errors, and downloads will be managed in a queue to avoid system overload.




## 4. Project Structure

```plaintext
playlistify-app/
├── release/              # Packaged application output (git-ignored)
├── assets/               # Static assets like icons for the app installer/builder
└── src/                  # Main source code directory
    ├── backend/          # Backend - Electron Main Process code (Node.js)
    │   ├── db/           # Database schema (schema.sql) and setup scripts
    │   ├── lib/          # Wrappers for external tools (yt-dlp, ffmpeg)
    │   ├── repositories/ # Data access layer (e.g., PlaylistRepository.ts)
    │   ├── services/     # Core backend services (Playlist, Download, HealthCheck)
    │   └── main.ts       # Entry point for the Main Process
    │
    ├── frontend/         # Frontend - Electron Renderer Process code (React)
    │   ├── components/   # Shared/reusable React components
    │   ├── hooks/        # Custom React hooks
    │   ├── lib/          # Frontend-specific utilities
    │   ├── pages/        # Top-level page components (Dashboard, Settings, etc.)
    │   ├── store/        # Zustand state management store
    │   └── index.tsx     # Entry point for the Renderer Process
    │
    └── shared/             # Code shared between Backend and Frontend processes
        ├── ipc-contracts.ts # TypeScript types for IPC communication
        └── types.ts         # Other shared type definitions
```

### Key Directory Descriptions

*   **`src/backend`**: Contains all backend logic. This code runs in Node.js and has access to the operating system, filesystem, and database.
*   **`src/frontend`**: Contains all frontend UI code. This code runs in a sandboxed Chromium window and is responsible for everything the user sees and interacts with.
*   **`src/shared`**: A crucial directory for holding TypeScript types and definitions that are used by *both* the backend and frontend to ensure they communicate correctly.




## 5. Dependency Management

Playlistify requires two key dependencies to function correctly:

1.  **yt-dlp**: Used for downloading YouTube videos and playlists
2.  **FFmpeg**: Used for video processing and format conversion

### 5.1. Local Project Dependencies

Unlike typical applications that require system-wide installation of these dependencies, Playlistify includes a dependency management system that **downloads and manages these tools locally within the project directory**. This provides several benefits:

-   No need for users to install anything manually
-   Consistent versions across all platforms
-   No conflicts with existing system installations
-   Dependencies are removed when the app is uninstalled

### 5.2. Directory Structure

The dependencies are stored in dedicated directories within the project:

```
PlayListify/
├── ytdlp/
│   └── bin/
│       └── yt-dlp (or yt-dlp.exe on Windows)
│
├── ffmpeg/
│   └── bin/
│       ├── ffmpeg (or ffmpeg.exe on Windows)
│       ├── ffprobe (or ffprobe.exe on Windows)
│       └── ffplay (or ffplay.exe on Windows)
```

### 5.3. Setup Scripts

The application includes platform-specific automated setup scripts that handle downloading and installing these dependencies:

#### OS-Specific Scripts

Each platform has dedicated installation and uninstallation scripts:

```
scripts/
├── windows/
│   ├── install.js - Windows-specific installation 
│   └── uninstall.js - Windows-specific uninstallation
├── macos/
│   ├── install.js - macOS-specific installation
│   └── uninstall.js - macOS-specific uninstallation
└── linux/
    ├── install.js - Linux-specific installation
    └── uninstall.js - Linux-specific uninstallation
```

#### For Developers

You can manually run these scripts during development:

```bash
# Install dependencies automatically for current platform
npm run setup:deps

# Platform-specific installation
npm run setup:windows  # Windows only
npm run setup:macos    # macOS only
npm run setup:linux    # Linux only

# Uninstall dependencies for current platform
npm run uninstall:deps

# Platform-specific uninstallation
npm run uninstall:windows  # Windows only
npm run uninstall:macos    # macOS only
npm run uninstall:linux    # Linux only
```

#### For Users

Users don't need to run these scripts manually. When the application starts for the first time via `npm start` or when running the packaged application, the startup script will automatically check for and install the required dependencies.

### 5.4. Platform Support

The dependency management system supports all major platforms and architectures:

-   **Windows**: Downloads and installs x86/x64 binaries
-   **macOS**: Downloads and installs x64/ARM64 binaries
-   **Linux**: Downloads and installs x64/x86/ARM64/ARM binaries

### 5.5. Uninstallation

When uninstalling the application, the uninstall script will remove all downloaded dependencies:

```bash
npm run uninstall:deps
```

This script will:
1.  Detect your platform and run the appropriate uninstaller
2.  Remove the yt-dlp directory
3.  Remove the FFmpeg directory
4.  Optionally remove application data (with user confirmation)

### 5.6. Troubleshooting

If you encounter issues with the dependencies:

1.  Try running the setup scripts manually:
    ```bash
    npm run setup:deps
    ```

2.  Check that the binaries are executable (on Unix-based systems):
    ```bash
    chmod +x ytdlp/bin/yt-dlp
    chmod +x ffmpeg/bin/ffmpeg
    chmod +x ffmpeg/bin/ffprobe
    ```

3.  Verify that the binaries are in the correct location by checking the project directory structure

4.  For SQLite issues on Windows, the application includes a fix script:
    ```bash
    node fix-sqlite-path.js
    ```




## 6. UI Design and Implementation

### 6.1. UI Framework and Theme

*   **Setup Tailwind CSS with custom configuration:**
    ```bash
    npm install tailwindcss@latest postcss autoprefixer
    npx tailwindcss init -p
    ```

*   **Configured inspired color palette:**
    *   **Primary:** Red (`#FF0000`)
    *   **Dark mode:**
        *   Main Background: `#181818` (deep gray)
        *   Secondary Background: `#212121` (dark gray)
        *   Tertiary Background: `#3d3d3d` (medium-dark gray)
        *   Primary Text: `#FFFFFF` (white)
        *   Secondary Text: `#AAAAAA` (lighter gray)
        *   Accent: `#FF0000` (red)
    *   **Light mode:**
        *   Main Background: `#FFFFFF` (white)
        *   Secondary Background: `#EDEDED` (light gray)
        *   Primary Text: `#212121` (dark gray)
        *   Secondary Text: `#808080` (medium gray)
        *   Accent: `#FF0000` (red)
    *   **Neutral:** `#AAAAAA` (medium gray) for borders and secondary UI elements

*   Create light/dark theme toggle functionality
*   Ensure consistent styling across all components with the theme
*   Implement responsive design with Tailwind's utility classes
*   Utilize Lucide Icons for all application icons to ensure a consistent, modern, and visually appealing user interface.

### 6.2. Component Development

*   Create reusable UI components following YouTube design patterns:
    *   Custom buttons with YouTube styling
    *   Video cards with thumbnail preview
    *   Playlist containers
    *   Navigation sidebar
    *   Search bar with YouTube-like appearance
    *   Progress indicators for downloads
    *   Video player with YouTube-inspired controls




## 7. Epics and User Stories

### **Epic 1: Project Foundation & Playlist Viewing**

**Goal:** Establish the core application shell and enable users to import, view, and search within public YouTube playlists.

---

#### **Story 1.1: Main Application Layout**

**As a user,** I want to see the main application window with the sidebar and top navigation bar so that I can understand the layout and see the main sections of the app.

*   **Acceptance Criteria:**
    *   The application opens to a primary window.
    *   A persistent sidebar is visible on the left.
    *   A persistent top navigation bar is visible at the top.
*   **Subtasks:**
    *   `[ ]` Create a `MainLayout.tsx` component that defines the primary application structure (e.g., sidebar and main content areas).
    *   `[ ]` Create a `Sidebar.tsx` component with navigation links for Dashboard, Playlists, History, Downloads, and Settings, each with an appropriate icon.
    *   `[ ]` Create a `TopNavbar.tsx` component with placeholders for the `+ Add` button and user avatar.
    *   `[ ]` Integrate the Sidebar and TopNavbar components into the `MainLayout.tsx`.
    *   `[ ]` Configure the application's router to use this `MainLayout` for all primary views.

---

#### **Story 1.2: Build Dashboard UI Structure**

**As a user,** I want a dashboard that serves as my central starting point, designed to display my "Recent Playlists" and "Continue Watching" history.

*   **Acceptance Criteria:**
    *   A "Dashboard" screen must be created with clearly defined sections for "Recent Playlists" and "Continue Watching".
    *   These sections must initially display an appropriate empty state (e.g., "Your recent playlists will appear here").
    *   The structure must be ready to receive and display real data as soon as the corresponding features (playlist viewing, history tracking) are completed in later stories.
*   **Subtasks:**
    *   `[ ]` Create the `Dashboard.tsx` page component.
    *   `[ ]` Implement the layout for the dashboard to define widget areas.
    *   `[ ]` Create a `RecentPlaylistsWidget.tsx` component with a title and "View all" link.
    *   `[ ]` Implement the empty state UI for the `RecentPlaylistsWidget`.
    *   `[ ]` Create a `ContinueWatchingWidget.tsx` component with a title and "View history" link.
    *   `[ ]` Implement the empty state UI for the `ContinueWatchingWidget`.
    *   `[ ]` Integrate both widget components into the `Dashboard.tsx` page.

---

#### **Story 1.3: Import Public Playlist**

**As a user,** I want to use the `+ Add` menu to import a public YouTube playlist using its URL, so that the import process starts in the background and I can continue using the app.

*   **Acceptance Criteria:**
    *   The `+ Add` menu must contain an option labeled "Add Playlist".
    *   Clicking this option must open a dialog box for the user to paste a YouTube playlist URL.
    *   The URL input field must include an 'x' button that appears when text is present, allowing the user to clear the input with a single click.
    *   After a valid URL is entered, the dialog must automatically fetch and display a preview of the playlist (Thumbnail, Title, Video Count, etc.).
    *   When the user clicks the final "Import" button in the dialog, the dialog must close immediately, and the import task must instantly appear in the Activity Center.
    *   The user must be able to freely navigate the application while the background task is running.
    *   Once the background task is complete, the new playlist must appear in the sidebar, and a success notification should be displayed.
*   **Subtasks:**
    *   `[ ]` Add the "Add Playlist" item to the `+ Add` dropdown menu, which opens the unified `AddPlaylistDialog`.
    *   `[ ]` Implement the URL input field UI, including the clear ('x') button on the "Add from YouTube" tab.
    *   `[ ]` Create an IPC handler (`playlist:get-preview`) to fetch preview metadata from a URL.
    *   `[ ]` Call the preview IPC handler from the dialog and display the returned preview data.
    *   `[ ]` Implement the "Import" button to call the main `playlist:import` IPC handler and pass the task to the Activity Center.

---

#### **Story 1.4: View Playlist Details**

**As a user,** I want to select an imported playlist and see the list of all its videos, including thumbnails and titles, so that I can browse its contents.

*   **Acceptance Criteria:**
    *   Clicking a playlist in the sidebar must display its contents in the main view.
    *   The view must show the playlist's header (title, video count, etc.) and a "Last checked" timestamp.
    *   Each video in the list must display its Thumbnail, Title, Channel Name, Duration, View Count, Upload Date, a colored status dot, and its downloaded quality (if applicable).
    *   A loading state must be shown while data is being fetched.
*   **Subtasks:**
    *   `[ ]` Create a `PlaylistDetailsView.tsx` component for the main content area.
    *   `[ ]` Implement the logic for the component to receive a playlist ID when a playlist is selected.
    *   `[ ]` Use a `useQuery` hook to call the `playlist:get-details` IPC handler with the ID.
    *   `[ ]` Implement the UI for the playlist header.
    *   `[ ]` Create a `VideoListItem.tsx` component to display a single video's information.
    *   `[ ]` Map over the fetched data in `PlaylistDetailsView.tsx` and render the `VideoListItem` components.
    *   `[ ]` Implement loading and empty state UIs.

---

#### **Story 1.5: Search within Playlist**

**As a user,** I want to search for a specific video by title within a selected playlist so that I can find content quickly.

*   **Acceptance Criteria:**
    *   A search input field must be present on the playlist detail view.
    *   As the user types in the search field, the visible list of videos must filter in real-time to show only videos whose titles match the search query.
*   **Subtasks:**
    *   `[ ]` Add a search input field UI component to `PlaylistDetailsView.tsx`.
    *   `[ ]` Create a local state to hold the search query text.
    *   `[ ]` Implement client-side logic to filter the video list based on the search query.
    *   `[ ]` Add a debounce to the search input to improve performance.

---

#### **Story 1.6: Infinite Scroll for Video Lists**

**As a user Browse a large playlist,** I want the video list to load more items automatically as I scroll down so that I can view all content without clicking through pages.

*   **Acceptance Criteria:**
    *   For playlists with a large number of videos (e.g., >100), the UI must not hang or become slow.
    *   Only the currently visible video items should be rendered in the DOM.
    *   Scrolling must be smooth and performant.
*   **Subtasks:**
    *   `[ ]` Choose and install a library for list virtualization (e.g., `@tanstack/react-virtual`).
    *   `[ ]` Install the chosen library as a project dependency.
    *   `[ ]` Refactor the video list rendering logic in `PlaylistDetailsView.tsx`.
    *   `[ ]` Configure the library to correctly render the `VideoListItem.tsx` component for each item in the virtualized list.
    *   `[ ]` Create a large mock dataset (e.g., an array of 1000+ items) for testing purposes.
    *   `[ ]` Thoroughly test the implementation using the mock data to ensure scrolling is smooth, memory usage is low, and the UI remains responsive.

### **Epic 2: Custom Playlist Management**

**Goal:** Empower users to create, populate, and manage their own local playlists from scratch.

---

#### **Story 2.1: Add New Playlist (Custom or from YouTube)**

**As a user,** I want to select 'Add Playlist' from the main menu and then choose whether to create a new custom playlist or import one from a YouTube URL within a single dialog.

*   **Acceptance Criteria:**
    *   The `+ Add` dropdown menu must contain a single option: "Add Playlist".
    *   Clicking this opens a dialog titled "Add Playlist" with two tabs: "Custom Playlist" and "Add from YouTube".
    *   The "Custom Playlist" tab must have fields for Title and Description and a "Create Playlist" button.
    *   The Title field must enforce a 100-character limit and the Description field must enforce a 512-character limit. Both should display a character counter (e.g., `25/100`).
    *   If a user tries to create a playlist with a title that already exists, an error message must be displayed, and the playlist will not be created.
    *   The "Add from YouTube" tab must contain the full preview-and-import flow defined in Epic 1.
*   **Subtasks:**
    *   `[ ]` Update the `+ Add` dropdown menu to have a single "Add Playlist" item.
    *   `[ ]` Refactor the `AddPlaylistDialog.tsx` component to use a tabbed interface.
    *   `[ ]` Build the form for the "Custom Playlist" tab, ensuring the button is labeled "Create Playlist" and character counters are implemented.
    *   `[ ]` Implement the logic for the "Create Playlist" button on this tab to call the appropriate IPC handler, including the check for duplicate titles.
    *   `[ ]` Build the UI and logic for the "Add from YouTube" tab, reusing the components and logic from Epic 1.
    *   `[ ]` Create the `playlist:create-custom` IPC handler.

---

#### **Story 2.2: Add Videos to a Custom Playlist**

**As a user,** I want to add a video from an existing playlist to one of my custom playlists so I can organize content according to my own themes.

*   **Acceptance Criteria:**
    *   A context menu on any video item must provide an "Add to Playlist" option.
    *   This option must open a submenu or dialog listing all the user's custom playlists.
    *   If a user attempts to add a video to a custom playlist that already contains that video, no duplicate entry will be created. A brief, non-blocking notification (e.g., "Video is already in this playlist") should be shown.
    *   Selecting a playlist correctly adds the video to it and provides a success notification (e.g., "Video added to 'My Favorites'").
*   **Subtasks:**
    *   `[ ]` In the `VideoListItem.tsx` component, implement a `ContextMenu` that shows an "Add to Playlist" option.
    *   `[ ]` The "Add to Playlist" option should trigger a submenu that displays a list of all available custom playlists.
    *   `[ ]` When a user selects a custom playlist from the submenu, call the `playlist:add-video-to-custom` IPC handler with the `videoId` and the selected `playlistId`.
    *   `[ ]` Implement a toast notification system to display the success or "already exists" message returned from the backend.
    *   `[ ]` Create a new `playlists:get-custom-list` IPC handler that queries the database and returns a list of all playlists where `type = 'CUSTOM'`.
    *   `[ ]` Create the `playlist:add-video-to-custom` IPC handler.

---

#### **Story 2.3: Remove Videos from a Custom Playlist**

**As a user,** I want to remove a video from one of my custom playlists to keep it organized and relevant.

*   **Acceptance Criteria:**
    *   A context menu on any video item *within a custom playlist* must provide a "Remove from Playlist" option.
    *   A confirmation dialog must be displayed before removing the video.
    *   The confirmation dialog must clearly state that the action only removes the video from the current playlist and does not delete the video from the library or from other playlists. (e.g., "This will only remove the video from the '[Playlist Name]' playlist. It will not be deleted from your library.")
*   **Subtasks:**
    *   `[ ]` In the `VideoListItem.tsx` component's `ContextMenu`, add logic to conditionally display a "Remove from Playlist" option.
    *   `[ ]` Create a confirmation dialog component.
    *   `[ ]` Clicking the "Remove from Playlist" option should open this confirmation dialog.
    *   `[ ]` On confirmation, call the `playlist:remove-video-from-custom` IPC handler with the `videoId` and `playlistId`.
    *   `[ ]` After a successful removal, the UI should update to remove the video from the list.
    *   `[ ]` Create the `playlist:remove-video-from-custom` IPC handler.

---

#### **Story 2.4: Edit Custom Playlist Details**

**As a user,** I want to be able to change the title and description of my custom playlists after I've created them.

*   **Acceptance Criteria:**
    *   A context menu on any custom playlist must provide an "Edit Details" option.
    *   This opens a dialog pre-filled with the current title and description.
    *   The system must prevent renaming a playlist to a title that already exists, showing an error if attempted.
*   **Subtasks:**
    *   `[ ]` In the `Sidebar.tsx` component (or wherever playlists are listed), implement a `ContextMenu` on each playlist item.
    *   `[ ]` The `ContextMenu` should conditionally show an "Edit Details" option only if the playlist's `type` is `CUSTOM`.
    *   `[ ]` Create an `EditPlaylistDialog.tsx` component.
    *   `[ ]` When the "Edit Details" option is clicked, open the `EditPlaylistDialog` and pre-populate the form fields with the selected playlist's current data.
    *   `[ ]` On form submission, call the `playlist:edit-details` IPC handler. If an error is returned (e.g., duplicate title), display it to the user in the dialog.
    *   `[ ]` After a successful update, the UI in the sidebar should refresh to show the new playlist title.
    *   `[ ]` Create the `playlist:edit-details` IPC handler.

---

#### **Story 2.5: Delete a Custom Playlist**

**As a user,** I want to delete an entire custom playlist that I no longer need.

*   **Acceptance Criteria:**
    *   A context menu on any custom playlist must provide a "Delete Playlist" option.
    *   A confirmation dialog must be displayed, clearly stating that the action is permanent (e.g., "Are you sure? This will permanently delete the playlist 'My Awesome Mix'. This cannot be undone.").
    *   If a video from the playlist is currently playing, confirming the deletion must first stop the video playback before deleting the playlist.
*   **Subtasks:**
    *   `[ ]` In the `Sidebar.tsx` component, add a "Delete Playlist" item to the `ContextMenu`.
    *   `[ ]` Clicking "Delete Playlist" must open an `AlertDialog` that displays the specified confirmation message.
    *   `[ ]` Implement a global state slice using `Zustand` to manage the currently playing video's state.
    *   `[ ]` When the user confirms the deletion, the frontend must first check the global player state. If a video from the playlist being deleted is active, it must first dispatch an action to stop playback.
    *   `[ ]` After stopping playback (if necessary), call the `playlist:delete-custom` IPC handler with the `playlistId`.
    *   `[ ]` After a successful deletion, update the UI by invalidating the query that fetches the playlist list.
    *   `[ ]` Create the `playlist:delete-custom` IPC handler.

### **Epic 3: Core Downloading & Offline Playback**

**Goal:** Implement a robust and intelligent archiving system, allowing users to download videos with smart quality selection and watch them offline.

---

#### **Story 3.1: Implement Intelligent Quality Detection Service**

**As a developer,** I need a backend service that can analyze a YouTube video or playlist URL and determine the specific quality options available for download.

*   **Acceptance Criteria:**
    *   The service must use `yt-dlp` to fetch a list of all available formats for a given URL.
    *   The service must parse this list and return a clean set of available qualities (e.g., '720p', '1080p', '4K').
    *   The service must be exposed via an IPC handler that the frontend can call.
*   **Subtasks:**
    *   `[ ]` Create a new service, e.g., `QualityDetectionService.ts`.
    *   `[ ]` Within this service, create a function that uses the `yt-dlp-wrap` library to execute a command to fetch available video formats for a given URL.
    *   `[ ]` Implement logic to parse the raw output from `yt-dlp`.
    *   `[ ]` Create the IPC handler `download:get-quality-options`.

---

#### **Story 3.2: Download a Single Video via URL**

**As a user,** I want to download a single video from a YouTube URL, with options to select format, quality, subtitles, and save location.

*   **Acceptance Criteria:**
    *   The `+ Add` menu will have a "Download Video" option that opens the "Download Video" dialog.
    *   When a valid URL is pasted, the dialog must automatically fetch and display a video preview.
    *   The dialog must display the default download path and provide a button for the user to change it.
    *   The dialog must allow the user to select quality, format (MP4/MP3), and whether to "Include subtitles when available".
    *   All downloads must be sanitized to have valid filenames and converted to a compatible format (MP4 H.264/AAC).
    *   The downloaded video file must have its YouTube thumbnail embedded.
    *   Before starting, the system must check for sufficient disk space and show an error if there is not enough.
    *   The "Add to Download Queue" button sends the configured download task to the Activity Center.
*   **Subtasks:**
    *   `[ ]` Add a "Download Video" item to the `+ Add` menu.
    *   `[ ]` Create the `DownloadVideoDialog.tsx` component.
    *   `[ ]` Implement the auto-fetch and preview functionality.
    *   `[ ]` When a preview is loaded, call the `download:get-quality-options` IPC handler and populate a quality selection dropdown.
    *   `[ ]` Add UI controls for format (MP4/MP3), subtitles, and a "Select Location" button.
    *   `[ ]` The "Select Location" button must call a new IPC handler (e.g., `dialog:show-select-folder`) to open a native OS dialog.
    *   `[ ]` The "Add to Download Queue" button must gather all selected options and call the `download:start` IPC handler.
    *   `[ ]` Create the `dialog:show-select-folder` IPC handler.
    *   `[ ]` Create a pre-download utility service to check for sufficient disk space.
    *   `[ ]` Create a download processing service that sanitizes the video title and embeds the thumbnail.
    *   `[ ]` Implement the `download:start` IPC handler.

---

#### **Story 3.3: Download an Entire Playlist**

**As a user,** I want to download all videos from a playlist with a single action, and for any video that doesn't have my selected quality, I want the app to automatically download the best available quality instead.

*   **Acceptance Criteria:**
    *   A "Download Playlist" button on the playlist details view will open the download dialog.
    *   The dialog will allow the user to select format, quality, and save location for the entire batch.
    *   If a specific video is not available in the user's chosen quality, the system must automatically download the next highest quality available for that video (smart quality fallback).
    *   Each successfully downloaded video must have its thumbnail embedded and its filename sanitized.
*   **Subtasks:**
    *   `[ ]` Add a "Download Playlist" `Button` to the `PlaylistDetailsView.tsx` component's header.
    *   `[ ]` Create the `DownloadPlaylistDialog.tsx` component.
    *   `[ ]` The dialog's "Add to Download Queue" button should call the `download:start` IPC handler, passing the playlist ID and the selected batch options.
    *   `[ ]` Modify the `download:start` IPC handler to differentiate between single video and playlist downloads.
    *   `[ ]` When a playlist download is initiated, create a "parent" task for the entire playlist download and "child" tasks for each video.
    *   `[ ]` Implement the "smart quality fallback" logic in the backend download service.
    *   `[ ]` Ensure the download service saves all videos from the batch into a subfolder named after the playlist title.

---

#### **Story 3.4: View Downloads Page**

**As a user,** I want to see a dedicated "Downloads" page that lists all my queued, in-progress, and completed downloads so I can track their status and retry failed downloads.

*   **Acceptance Criteria:**
    *   The page must display a list of all downloads with their title, status (e.g., Queued, Downloading, Completed, Failed), and a progress bar.
    *   Downloads marked as "Failed" must have a "Retry" button that re-queues the download from the beginning.
*   **Subtasks:**
    *   `[ ]` Create the `Downloads.tsx` page component and add it to the application's router.
    *   `[ ]` Implement the logic to listen for the `task:update` IPC event from the backend.
    *   `[ ]` Create a `DownloadListItem.tsx` component to render a single download task's information.
    *   `[ ]` In the `Downloads.tsx` page, map over the list of tasks and render a `DownloadListItem.tsx` for each one.
    *   `[ ]` In `DownloadListItem.tsx`, conditionally display a "Retry" `Button` if the task's status is `Failed`.
    *   `[ ]` Clicking the "Retry" button should call a new `download:retry` IPC handler.
    *   `[ ]` Ensure the backend's task management service periodically pushes the list of all tasks to the frontend.
    *   `[ ]` Create the `download:retry` IPC handler.

---

#### **Story 3.5: Basic Offline Playback**

**As a user,** I want to click on a successfully downloaded video and have it play within the application so I don't need an external player.

*   **Acceptance Criteria:**
    *   When a downloaded video is clicked, the app must first verify that the local file still exists. If not, it will show a "File not found" message.
    *   The player must correctly load and play the local MP4 video file.
    *   The player controls must include buttons for play/pause, volume, a loop toggle, and a menu to select available subtitle tracks.
    *   The player's seek bar must be fully functional and must visually indicate the buffered/loaded portion of the video.
*   **Subtasks:**
    *   `[ ]` Create a `VideoPlayer.tsx` component.
    *   `[ ]` When a user clicks a downloaded video, call a new `fs:verify-file-exists` IPC handler.
    *   `[ ]` If the IPC handler returns `false`, display a "File not found" message.
    *   `[ ]` If the file exists, render the `VideoPlayer.tsx` component, passing the local file path to it.
    *   `[ ]` Implement the UI controls for the player.
    *   `[ ]` Create the `fs:verify-file-exists` IPC handler.
    *   `[ ]` Implement logic in the backend to detect associated subtitle files.

### **Epic 4: Background Tasks & Activity Center**

**Goal:** Implement a robust and optimized system for handling long-running tasks in the background and provide a UI for users to monitor the status of imports and downloads.

---

#### **Story 4.1: Persistent Backend Task Management Service**

**As a developer,** I need a centralized, persistent service to manage the state and progress of all long-running background tasks.

*   **Acceptance Criteria:**
    *   A `background_tasks` table must be created in the SQLite database to store task information.
    *   All new tasks (imports, downloads) must be saved as a record in this table.
    *   The service must support parent/child task relationships (for playlist downloads) to handle partial failures gracefully.
    *   On application startup, the service must read this table to resume the state of any unfinished tasks, ensuring no progress is lost if the app is closed.
*   **Subtasks:**
    *   `[ ]` Define the `background_tasks` table using Drizzle ORM.
    *   `[ ]` Implement `backgroundTaskService.ts` for CRUD operations on the `background_tasks` table.
    *   `[ ]` The `background_tasks` schema includes `parentId` and relations to support parent/child task relationships.
    *   `[ ]` Implement logic that runs on application startup to resume unfinished tasks.
    *   `[ ]` Implement the IPC mechanism that pushes task updates to the frontend on the `task:update` channel.

---

#### **Story 4.2: Integrate Core Services with Task Manager**

**As a developer,** I need the import and download services to report their status to the new Task Management service (now `BackgroundTaskService`) to handle partial failures gracefully, especially for operations involving multiple items like playlist downloads.

*   **Acceptance Criteria:**
    *   Playlist imports and downloads must create a "parent" task. The parent task's progress should reflect the completion of its "child" video tasks.
    *   If some videos in a playlist download fail, the parent task should be marked as "Completed with errors."
    *   The download service (and any service creating tasks) must update the task's progress and final status in the database via `BackgroundTaskService`.
*   **Subtasks:**
    *   `[ ]` Refactor/Implement services that manage multi-item operations (e.g., `downloadService.ts` for playlist downloads).
    *   `[ ]` Modify/Implement the core logic for processing individual items to report updates for its own child task.
    *   `[ ]` Implement logic within `backgroundTaskService.ts` to handle the completion of a child task.

---

#### **Story 4.3: Activity Center UI**

**As a user,** I want to see a persistent widget in the corner of the screen that shows me my active tasks, which I can cancel or clear at any time.

*   **Acceptance Criteria:**
    *   A persistent widget must be displayed in the bottom-right corner of the application.
    *   The widget header must show an active task count (e.g., "Active (2)") and a minimize icon.
    *   The widget must display a list of all `In Queue` and `In Progress` tasks.
    *   Each task item must display its type (e.g., Import, Download), thumbnail, title, a progress bar, and a status tag.
    *   Each active task in the widget must have a "Cancel" button that stops the corresponding backend task.
    *   To keep the UI performant, progress updates from the backend must be throttled (updated no more than a few times per second).
    *   When a task is completed (successfully or failed), it should remain visible with a final status, a timestamp, and then automatically fade out after a short delay.
    *   A "Clear All" (trash can icon) button must be present to manually remove all completed tasks from the view.
*   **Subtasks:**
    *   `[ ]` Create the `ActivityCenter.tsx` widget component and add it to the main application layout.
    *   `[ ]` Style the widget as a persistent overlay in the bottom-right of the viewport.
    *   `[ ]` Implement the real-time listener for the `task:update` IPC channel.
    *   `[ ]` Create a `TaskItem.tsx` component to render a single task's details.
    *   `[ ]` The `TaskItem.tsx` component should include a "Cancel" button that calls the `task:cancel` IPC handler.
    *   `[ ]` Implement the header with the active task count and the "Clear All" and "Minimize" buttons.
    *   `[ ]` Implement the client-side logic for the "fade out on completion" behavior.
    *   `[ ]` Ensure that the UI updates from the incoming IPC events are throttled.

### **Epic 5: Playlist Health & Status Sync**

**Goal:** Introduce a robust, automated status-checking system for imported playlists, with user-configurable settings, to keep users informed about video availability.

---

#### **Story 5.1: Backend Health Check Service**

**As a developer,** I need a backend service that can check an imported playlist against YouTube to see if any videos have been deleted or privated.

*   **Acceptance Criteria:**
    *   The service must iterate through the videos of a given playlist.
    *   For each video, it must use a lightweight `yt-dlp` command to verify its current status on YouTube.
    *   It must update the `availability_status` (e.g., 'Live', 'Deleted', 'Private') for the video in the local database.
    *   Crucially, the service must process videos in a **low-concurrency queue** (e.g., one or two at a time) to avoid sending a burst of requests that could lead to IP rate-limiting.
*   **Subtasks:**
    *   `[ ]` Create a new `HealthCheckService.ts` file.
    *   `[ ]` Within the new service, instantiate and configure a `p-queue` with a low concurrency limit.
    *   `[ ]` Implement the main service function that accepts a `playlistId`.
    *   `[ ]` For each video, add a job to the `p-queue` that calls `yt-dlp-wrap`.
    *   `[ ]` After the `yt-dlp` check is complete, the job must use the `VideoRepository` to update the `availability_status` field.
    *   `[ ]` Once all jobs for a given playlist have been processed, the service should update the `last_health_check` timestamp on the parent playlist record.

---

#### **Story 5.2: Display Video Health Status in UI**

**As a user,** I want to see a colored dot next to each video in an imported playlist so I know if it's still available on YouTube and when that status was last checked.

*   **Acceptance Criteria:**
    *   In the video list item component, a colored dot must be displayed based on the video's `availability_status` from the database.
    *   The colors will be: Green for 'Live', Yellow for 'Unlisted/Private', and Red for 'Deleted'.
    *   A tooltip on the dot must explain the status on hover (e.g., "Status: Live").
    *   The playlist view header must display a "Status last checked: [timestamp]" (e.g., "3 hours ago") message.
*   **Subtasks:**
    *   `[ ]` In the `VideoListItem.tsx` component, add a new UI element to serve as the colored status dot.
    *   `[ ]` Implement the logic to apply the correct color to the dot based on the `availability_status`.
    *   `[ ]` Wrap the status dot element in a `Tooltip` component.
    *   `[ ]` In the `PlaylistDetailsView.tsx` component, display the `last_health_check` timestamp.
    *   `[ ]` Format the timestamp into a user-friendly, relative string.

---

#### **Story 5.3: Implement Auto-Sync Settings UI**

**As a user,** I want to configure how often my playlists are automatically checked for status updates.

*   **Acceptance Criteria:**
    *   A dedicated "Auto-Sync Settings" section must be created on the Settings page.
    *   The UI must provide controls (e.g., radio buttons) to select the frequency (e.g., Hourly, Daily, Weekly, Never).
    *   "Daily" will be the default setting.
    *   A note explaining the resource usage trade-off must be present (e.g., "More frequent syncing provides the most up-to-date status but uses more system resources.").
*   **Subtasks:**
    *   `[ ]` Create a `Settings.tsx` page component if one does not already exist.
    *   `[ ]` Build the "Auto-Sync Settings" UI section within the `Settings.tsx` page.
    *   `[ ]` On component mount, call a new `settings:get-auto-sync` IPC handler to fetch and display the currently saved setting.
    *   `[ ]` When the user changes the selection, call a new `settings:set-auto-sync` IPC handler to save the new value.
    *   `[ ]` Add the explanatory note about resource usage to the UI.
    *   `[ ]` Create `settings:get-auto-sync` and `settings:set-auto-sync` IPC handlers.

---

#### **Story 5.4: Scheduled Background Sync**

**As a developer,** I need a scheduler that automatically and safely runs the Health Check Service on all imported playlists based on the user's chosen frequency.

*   **Acceptance Criteria:**
    *   The scheduler must read the user's sync frequency from settings to determine its interval.
    *   The scheduler must **pause** if a user-initiated task (like a new import or download) is active, to prioritize the user's actions. It will resume after the user's tasks are complete.
*   **Subtasks:**
    *   `[ ]` In the backend, create a scheduler service or manager.
    *   `[ ]` Inside the scheduler's callback, it must first read the user's chosen sync frequency.
    *   `[ ]` The scheduler must then check if it's time to run based on the user's setting.
    *   `[ ]` Before running, the scheduler must check the status of the main task queue.
    *   `[ ]` If it is time to run and the main queue is free, the scheduler should trigger the `HealthCheckService`.

---

#### **Story 5.5: Manual Playlist Refresh**

**As a user,** I want a button to manually trigger a health check on a specific playlist so I can get its up-to-the-minute status on demand.

*   **Acceptance Criteria:**
    *   The context menu for any imported YouTube playlist must have a "Refresh Status Now" button.
    *   Clicking the button must trigger the `HealthCheckService` for that single playlist.
    *   The UI should provide immediate feedback that a check is in progress for that specific playlist (e.g., a spinning icon next to the "Last checked" timestamp).
*   **Subtasks:**
    *   `[ ]` In the `Sidebar.tsx` component's playlist `ContextMenu`, add a "Refresh Status Now" item.
    *   `[ ]` When the "Refresh Status Now" button is clicked, call the new `healthcheck:start-manual` IPC handler.
    *   `[ ]` Implement a client-side state to track the IDs of playlists currently being refreshed.
    *   `[ ]` In the `PlaylistDetailsView.tsx` header, display a spinning icon next to the "Last checked" timestamp.
    *   `[ ]` Create the `healthcheck:start-manual` IPC handler.




## 8. Definitive Tech Stack Selections

### 8.1. Technologies

*   Electron **v36.4.0** for cross-platform desktop application
*   React **v19.1.0** with TypeScript **v5.5.3** for UI development
*   Tailwind CSS v3.4.1 for styling
*   yt-dlp-wrap v2.3.12 for YouTube video downloading
*   Zustand v5.0.3 for state management
*   TanStack React Query v5.71.10 for data fetching
*   TanStack React Router **v1.120.16** for routing
*   Electron Store v10.0.1 for persistent storage
*   P-Queue v8.1.0 for task queuing
*   Winston v3.17.0 for logging
*   Fluent-FFmpeg v2.1.3 for media processing
*   React Player v2.16.0 for video playback
*   Better-SQLite3 **v11.10.0** for database management

### 8.2. Required Packages & Dependencies

#### Core Packages

*   electron **v36.4.0**
*   @electron-forge/cli **v11.5.0**
*   typescript **v5.5.3**
*   electron-store v10.0.1
*   fs-extra **v11.3.0**
*   electron-updater v6.6.2
*   better-sqlite3 **v11.10.0**
*   sqlite3

#### React & Core UI Packages

*   react **v19.1.0**
*   react-dom **v19.1.0**
*   react-hook-form v7.54.2

#### Styling & CSS

*   tailwindcss v3.4.1
*   postcss **v8.4.39**
*   autoprefixer **v10.4.19**

#### Routing & Data Fetching

*   @tanstack/react-router **v1.120.16**
*   @tanstack/react-query v5.71.10
*   react-router-dom v7.5.0
*   date-fns v4.1.0

#### UI Component Libraries

*   shadcn/ui v0.0.4 (primary UI component library)
*   class-variance-authority v0.7.1
*   clsx v2.1.1
*   tailwind-merge v3.1.0
*   lucide-react **v0.513.0**
*   Note: Radix UI packages are indirect dependencies via shadcn/ui.

#### Media & Downloads Packages

*   yt-dlp-wrap v2.3.12
*   fluent-ffmpeg v2.1.3
*   p-queue v8.1.0
*   react-player v2.16.0
*   winston v3.17.0
*   mime-types v3.0.1

#### Integration Packages

*   axios **v1.9.0**
*   zustand v5.0.3
*   uuid v11.1.0

#### Build & Development Packages

*   @electron-forge/plugin-webpack v7.8.0
*   @electron/rebuild v3.6.0
*   css-loader v6.10.0
*   style-loader v3.3.4
*   ts-loader v9.5.1
*   eslint v8.56.0
*   prettier v3.2.5

#### Testing Packages

*   jest **v30.0.0**
*   @testing-library/react **v16.3.0**
*   @testing-library/jest-dom **v6.6.3**




## 9. Post-Quantum Cryptography (PQC) Security Requirements

To ensure the long-term security and resilience of Playlistify against future quantum computing threats, the application will incorporate Post-Quantum Cryptography (PQC) standards for critical cryptographic operations. This proactive approach safeguards user data and application integrity.

### 9.1. Hybrid PQC Encryption

For all data encryption at rest and in transit, a hybrid PQC encryption suite will be employed. This approach combines established classical cryptographic algorithms with new quantum-resistant algorithms to provide a robust defense, even if one of the underlying algorithms is compromised.

*   **Default Encryption Suite:** `X25519_KYBER768_AES256GCM`
    *   **X25519:** An elliptic curve Diffie-Hellman (ECDH) key exchange algorithm, providing strong classical security for key agreement.
    *   **KYBER768:** A lattice-based key encapsulation mechanism (KEM) that is a leading candidate for post-quantum key exchange, providing quantum resistance.
    *   **AES-256-GCM:** The Advanced Encryption Standard with a 256-bit key in Galois/Counter Mode, providing strong symmetric encryption and authenticated encryption capabilities.

This hybrid construction ensures that the security of the encryption relies on the stronger of the two key exchange mechanisms (classical or PQC) and the robust symmetric encryption, offering defense-in-depth.

### 9.2. PQC Hashing

For data integrity verification and other hashing requirements, a quantum-resistant hashing algorithm will be utilized. This prevents potential attacks where quantum computers could rapidly find collisions in classical hash functions.

*   **Default Hashing Algorithm:** `SHA3-256`
    *   **SHA3-256:** A member of the SHA-3 (Secure Hash Algorithm 3) family, which is a new cryptographic hash function designed with a different construction than SHA-2, offering enhanced security properties and resistance to known and potential future attacks, including those from quantum computers.

### 9.3. PQC Digital Signatures

To ensure the authenticity and integrity of critical application components, particularly WebAssembly (WASM) modules, a quantum-resistant digital signature scheme will be used. This prevents malicious tampering or unauthorized execution of code.

*   **Digital Signature Scheme:** `Dilithium3`
    *   **Dilithium3:** A lattice-based digital signature algorithm that is part of NIST's Post-Quantum Cryptography standardization process. It provides strong security guarantees against quantum adversaries for digital signatures, ensuring that WASM modules loaded by the application are legitimate and untampered.

### 9.4. CryptoService Layer

A dedicated `CryptoService` layer will be implemented to abstract all cryptographic logic. This layer will serve as a single point of entry for all encryption, decryption, hashing, and signing operations, promoting modularity, maintainability, and ease of future cryptographic algorithm updates.

*   **Benefits:**
    *   **Centralized Control:** All cryptographic operations are managed from one place, reducing the risk of inconsistent implementations.
    *   **Modularity:** Cryptographic algorithms can be swapped or updated without affecting other parts of the application.
    *   **Security by Design:** Enforces best practices and ensures that cryptographic primitives are used correctly.

### 9.5. Key Management

Secure key management is paramount for the overall security of the application. Playlistify will support flexible and secure methods for key derivation and storage.

*   **Passphrase-Derived Keys:**
    *   **Argon2id:** A robust password-hashing function designed to resist both brute-force attacks and side-channel attacks. It will be used to securely derive cryptographic keys from user-provided passphrases.
    *   **HKDF (HMAC-based Key Derivation Function):** Used in conjunction with Argon2id to expand the output of the password-hashing function into multiple cryptographically strong keys for different purposes (e.g., encryption keys, authentication keys).
*   **External Key Files:** Support for external key files will provide an additional layer of security and flexibility for power users or specific deployment scenarios, allowing keys to be stored separately from the application.

### 9.6. Configuration

All PQC features and cryptographic settings will be managed through a centralized `CRYPTO_SETTINGS` object. This object will allow for easy configuration and auditing of the cryptographic parameters used throughout the application.

*   **Centralized Management:** Simplifies the process of updating or auditing cryptographic settings.
*   **Consistency:** Ensures that all parts of the application adhere to the defined cryptographic policies.

### 9.7. Defense-in-Depth

The implementation of PQC is part of a broader defense-in-depth strategy, ensuring multiple layers of security:

*   **Quantum Resistance:** Proactively addresses the threat posed by quantum computers to current cryptographic standards.
*   **Hybrid Approach:** Combines classical and post-quantum algorithms for immediate and future security.
*   **Integrity and Authenticity:** Ensures that data and code remain untampered and originate from trusted sources.
*   **Secure Key Management:** Protects the foundational elements of cryptographic security.

### 9.8. Performance Considerations

While PQC algorithms offer enhanced security, they can sometimes be more computationally intensive than their classical counterparts. The implementation will prioritize optimization to ensure that PQC operations do not negatively impact application responsiveness or user experience.

*   **Optimization:** Careful selection of PQC parameters and efficient implementation will be crucial.
*   **Asynchronous Operations:** Cryptographic operations will be performed asynchronously to prevent UI blocking.
*   **Benchmarking:** Regular benchmarking will be conducted to monitor and improve the performance of PQC-enabled features.





## 7.1. Core Pages

### 7.1.1. Dashboard Page

**Purpose:** The Dashboard serves as the user's personalized home screen, providing quick access to recently viewed content and ongoing activities. It's designed to offer an at-a-glance overview of the user's Playlistify engagement.

**Key Components:**

*   **Recent Playlists Widget:** Displays a carousel or grid of the most recently accessed playlists, both imported and custom. Each entry will show the playlist thumbnail, title, and a 'last accessed' timestamp. A 'View All' link will navigate to the 'My Playlists' page.
*   **Continue Watching Widget:** Shows videos that were partially watched, allowing users to resume playback from where they left off. Each entry will include the video thumbnail, title, and a progress bar indicating watch progress. A 'View History' link will navigate to the 'History' page.
*   **Active Downloads/Imports Widget:** A condensed view of the Activity Center, showing the status of currently active downloads and imports. This provides immediate feedback on background tasks without requiring the user to open the full Activity Center.

**User Stories:**

*   **As a user,** I want to see my most recently accessed playlists on the dashboard so I can quickly jump back into content I'm actively managing or watching.
*   **As a user,** I want to see videos I've partially watched on the dashboard so I can easily resume playback.
*   **As a user,** I want to see a summary of my active downloads and imports on the dashboard so I can monitor progress without navigating away from the home screen.

**Design Considerations:**

*   **Layout:** A clean, modular layout utilizing cards or tiles for widgets to ensure readability and easy navigation.
*   **Responsiveness:** Widgets should adapt gracefully to different window sizes, potentially re-arranging or collapsing on smaller screens.
*   **Empty States:** Clear and helpful empty states for each widget (e.g., 


 "No recent playlists yet. Import one to get started!" or "No watch history yet. Start watching a video!") to guide new users.
*   **Performance:** Widgets should load quickly and asynchronously to ensure a smooth user experience.




### 7.1.2. My Playlists Page

**Purpose:** The My Playlists page serves as the central hub for users to manage all their imported and custom-created playlists. It provides comprehensive tools for organization, editing, and interaction with playlist content.

**Key Components:**

*   **Playlist List:** A sortable and filterable list of all playlists. Each entry will display the playlist thumbnail, title, type (e.g., 'YouTube Imported', 'Custom'), number of videos, and last modified date. Sorting options will include by name, date created, and number of videos. Filtering options will include by type (custom, imported).
*   **Search Bar:** A dedicated search bar to quickly find playlists by title or description.
*   **Batch Actions:** Options to perform actions on multiple selected playlists, such as deleting multiple custom playlists or refreshing the status of several imported playlists.
*   **Context Menus:** Right-click context menus on individual playlists for quick access to actions like 'Edit Details' (for custom playlists), 'Refresh Status' (for imported playlists), 'Delete', and 'Add to Custom Playlist'.

**User Stories:**

*   **As a user,** I want to see a comprehensive list of all my playlists, both imported and custom, so I can easily find and manage them.
*   **As a user,** I want to be able to sort and filter my playlists so I can quickly locate specific types of content or organize my view.
*   **As a user,** I want to perform actions like editing or deleting playlists directly from this page so I can efficiently manage my library.
*   **As a user,** I want to search for playlists by name or description so I can quickly find what I'm looking for in a large collection.

**Design Considerations:**

*   **Information Density:** Balance displaying enough information for each playlist without overwhelming the user, possibly using a list or grid view with toggle options.
*   **Actionability:** Ensure that all relevant actions are easily accessible through buttons, context menus, or batch selection.
*   **Feedback:** Provide clear visual feedback for sorting, filtering, and batch actions (e.g., selected items highlighted, loading indicators for refreshes).
*   **Scalability:** The design should accommodate a large number of playlists without performance degradation, potentially using virtualization for the list.




### 7.1.3. History Page

**Purpose:** The History page provides a chronological record of all videos watched within the Playlistify application, allowing users to easily revisit previously viewed content.

**Key Components:**

*   **Chronological List of Watched Videos:** Displays videos in reverse chronological order, showing the video thumbnail, title, channel, and the date/time it was watched. Each entry will also indicate if the video is part of a downloaded collection.
*   **Search and Filter:** A search bar to find specific videos within the history by title or channel name. Filters could include date range or whether the video is downloaded.
*   **Clear History Option:** A button or menu option to clear the entire watch history, with a confirmation dialog.
*   **Resume Playback:** Clicking on a video in the history will open the video player and resume playback from the last watched position.

**User Stories:**

*   **As a user,** I want to see a list of all videos I've watched within the app so I can easily find and re-watch them.
*   **As a user,** I want to search my watch history so I can quickly locate a specific video I remember watching.
*   **As a user,** I want to clear my watch history for privacy or to start fresh.
*   **As a user,** I want to resume watching a video from where I left off directly from the history page.

**Design Considerations:**

*   **Clarity:** Each history entry should clearly display essential video information and the watch timestamp.
*   **Performance:** The history list should be optimized for performance, especially for users with extensive watch histories, potentially using virtualization.
*   **Privacy:** The option to clear history should be prominent and include a clear confirmation step.
*   **Integration:** Seamless integration with the video player for resuming playback.




### 7.1.4. Downloads Page

**Purpose:** The Downloads page provides a comprehensive overview and management interface for all video and playlist download tasks, whether they are queued, in progress, completed, or failed.

**Key Components:**

*   **Download List:** A dynamic list displaying all download tasks. Each entry will show:
    *   **Video/Playlist Thumbnail and Title:** Clearly identifying the content being downloaded.
    *   **Status:** (e.g., Queued, Downloading, Completed, Failed, Paused, Canceled).
    *   **Progress Bar:** For in-progress downloads, showing percentage complete and estimated time remaining.
    *   **Download Speed:** For active downloads.
    *   **File Size:** Total size of the downloaded content.
    *   **Save Location:** The path where the file is saved.
    *   **Actions:** Buttons for 'Pause/Resume', 'Cancel', 'Retry' (for failed downloads), and 'Open Folder' (for completed downloads).
*   **Filters and Sorting:** Options to filter downloads by status (e.g., show only 'Failed' or 'In Progress') and sort by date added, progress, or size.
*   **Summary Statistics:** A small section at the top showing total downloads, active downloads, and completed downloads.

**User Stories:**

*   **As a user,** I want to see the real-time progress of my downloads so I know when my content will be ready.
*   **As a user,** I want to easily retry failed downloads without re-entering all the details.
*   **As a user,** I want to pause and resume downloads to manage my internet bandwidth.
*   **As a user,** I want to quickly access the downloaded files on my computer.
*   **As a user,** I want to see a clear overview of all my past and current download activities.

**Design Considerations:**

*   **Real-time Updates:** The UI must update frequently and smoothly to reflect the current status and progress of active downloads.
*   **Actionability:** Key actions (pause, cancel, retry, open folder) should be easily accessible for each download item.
*   **Clarity:** Status indicators and progress bars should be intuitive and easy to understand at a glance.
*   **Error Handling:** Clear error messages and actionable options for failed downloads.
*   **Scalability:** The list should perform well even with a large number of past download entries.




### 7.1.5. Settings Page

**Purpose:** The Settings page allows users to customize various aspects of the Playlistify application, including download preferences, synchronization frequencies, and general application behavior.

**Key Components:**

*   **General Settings:**
    *   **Default Download Location:** Option to set a default folder for all downloaded videos and playlists. Includes a button to browse and select a folder.
    *   **Automatic Updates:** Toggle for enabling/disabling automatic application updates.
    *   **Theme Selection:** Option to switch between Light, Dark, or System default themes.
*   **Download Settings:**
    *   **Default Video Quality:** Dropdown to select preferred video quality for downloads (e.g., 1080p, 720p, Best Available).
    *   **Default Audio Quality:** Dropdown to select preferred audio quality for MP3 downloads.
    *   **Subtitle Inclusion:** Checkbox to always include subtitles when available.
    *   **Playlist Folder Organization:** Toggle to enable/disable creating subfolders for each playlist within the download directory.
*   **Auto-Sync Settings:**
    *   **Health Check Frequency:** Radio buttons or dropdown to set how often imported playlists are checked for video availability (e.g., Hourly, Daily, Weekly, Never).
    *   **Note:** A small informational text explaining the resource usage implications of more frequent checks.
*   **Advanced Settings:**
    *   **Clear Cache:** Button to clear application cache (e.g., temporary files, video thumbnails).
    *   **Reset Application:** Button to reset all application settings to default, with a strong confirmation warning.
*   **About Section:** Displays application version, links to privacy policy, terms of service, and open-source licenses.

**User Stories:**

*   **As a user,** I want to customize my download preferences (location, quality, subtitles) so that videos are downloaded exactly how I want them.
*   **As a user,** I want to control how often my playlists are checked for health status so I can balance up-to-date information with system resource usage.
*   **As a user,** I want to manage general application settings like theme and updates to personalize my experience.
*   **As a user,** I want to clear application data or reset settings if I encounter issues or want to start fresh.

**Design Considerations:**

*   **Categorization:** Settings should be logically grouped into clear sections to prevent overwhelming the user.
*   **Clarity:** Each setting should have a clear label and a brief explanation if its function isn't immediately obvious.
*   **Feedback:** Provide immediate visual feedback when settings are changed (e.g., a 


checkmark or a 'Saved' message).
*   **Safety:** Destructive actions (like 'Reset Application') must have prominent confirmation dialogs to prevent accidental data loss.





## 7.2. Modals

Modals are crucial for user interaction, providing focused workflows, confirmations, and information without navigating away from the current view. They ensure critical user input or decisions are handled explicitly.

### 7.2.1. Add Playlist Dialog

**Purpose:** This unified modal allows users to either create a new custom playlist from scratch or import an existing playlist from YouTube using its URL. It streamlines the process of adding new content sources to the application.

**Key Components:**

*   **Tabbed Interface:** Two distinct tabs: "Custom Playlist" and "Add from YouTube".
*   **"Custom Playlist" Tab:**
    *   **Title Input Field:** Text input for the new playlist's title, with a character limit (e.g., 100 characters) and a real-time character counter.
    *   **Description Input Field:** Text area for an optional description, with a character limit (e.g., 512 characters) and a real-time character counter.
    *   **"Create Playlist" Button:** Initiates the creation of the custom playlist.
    *   **Error Display:** Shows validation errors (e.g., duplicate title, character limit exceeded).
*   **"Add from YouTube" Tab:**
    *   **YouTube URL Input Field:** Text input for pasting a YouTube playlist URL. Includes a clear (\'x\') button to quickly empty the field.
    *   **Playlist Preview Area:** Displays a preview of the YouTube playlist (thumbnail, title, video count) once a valid URL is entered.
    *   **"Import" Button:** Initiates the background import process for the YouTube playlist.
    *   **Loading Indicator:** Shown while fetching playlist preview data.

**User Stories:**

*   **As a user,** I want a single, intuitive place to add both custom and YouTube playlists so I don't have to search for different options.
*   **As a user,** I want to see a preview of a YouTube playlist before importing it so I can confirm it's the correct one.
*   **As a user,** I want clear feedback if I try to create a custom playlist with a name that already exists.
*   **As a user,** I want to quickly clear the URL input field if I make a mistake.

**Design Considerations:**

*   **Modality:** The dialog should block interaction with the main application until dismissed, ensuring user focus.
*   **Validation:** Real-time validation for input fields to guide the user.
*   **Feedback:** Clear visual cues for loading states, success, and errors.
*   **Accessibility:** Ensure keyboard navigation and screen reader compatibility.

### 7.2.2. Confirmation Dialog (AlertDialog)

**Purpose:** A generic, reusable modal component used to request explicit user confirmation before performing irreversible or potentially destructive actions. It prevents accidental data loss or unintended operations.

**Key Components:**

*   **Title:** A concise title indicating the nature of the action (e.g., "Confirm Deletion", "Remove Video").
*   **Message:** A clear, unambiguous message explaining the consequences of the action. This message should be dynamically configurable based on the context (e.g., "This will permanently delete the playlist 'My Awesome Mix'. This cannot be undone.").
*   **"Confirm" Button:** A primary action button, often styled to indicate the destructive nature (e.g., red for delete actions).
*   **"Cancel" Button:** A secondary action button to dismiss the dialog without proceeding.

**User Stories:**

*   **As a user,** I want to be explicitly asked for confirmation before deleting a playlist or removing a video so I don't accidentally lose content.
*   **As a user,** I want the confirmation message to clearly explain what will happen if I proceed so I can make an informed decision.

**Design Considerations:**

*   **Prominence:** The dialog should be visually distinct and centered to draw user attention.
*   **Clarity:** The message must be easy to understand and avoid jargon.
*   **Button Placement:** Clear distinction between confirm and cancel actions, with the confirm button often on the right or styled more prominently.
*   **Keyboard Support:** Allow confirmation via Enter key and cancellation via Escape key.

### 7.2.3. Download Video Dialog

**Purpose:** This modal provides detailed options for downloading a single YouTube video, allowing users to customize format, quality, and save location before initiating the download.

**Key Components:**

*   **Video Preview:** Displays the video thumbnail, title, and channel name once a valid YouTube video URL is pasted.
*   **URL Input Field:** For pasting the YouTube video URL.
*   **Format Selection:** Radio buttons or dropdown for selecting download format (e.g., MP4, MP3).
*   **Quality Selection:** Dropdown populated dynamically with available video qualities (e.g., 1080p, 720p, 480p) based on the video preview. Includes a "Best Available" option.
*   **Subtitle Inclusion Checkbox:** Option to include available subtitles with the download.
*   **Save Location Display & Button:** Shows the current default download path and a button to open a native file browser to select a custom save location.
*   **"Add to Download Queue" Button:** Initiates the download task and adds it to the Activity Center.
*   **Loading Indicators:** For fetching video preview and quality options.
*   **Disk Space Check:** Displays a warning or error if insufficient disk space is detected before download initiation.

**User Stories:**

*   **As a user,** I want to choose the video quality and format before downloading so I can control file size and compatibility.
*   **As a user,** I want to easily change where a video is saved on my computer.
*   **As a user,** I want to know if I have enough disk space before starting a large download.
*   **As a user,** I want to include subtitles with my downloaded videos for accessibility or language learning.

**Design Considerations:**

*   **Pre-population:** Default options should be pre-selected based on user settings to minimize clicks.
*   **Dynamic Options:** Quality options should update in real-time based on the entered video URL.
*   **Clear Call to Action:** The "Add to Download Queue" button should be prominent.
*   **Informative Feedback:** Provide clear messages for successful preview fetching, errors, and disk space warnings.

### 7.2.4. Download Playlist Dialog

**Purpose:** This modal allows users to download an entire YouTube playlist, offering batch configuration options and intelligent quality fallback for a seamless archiving experience.

**Key Components:**

*   **Playlist Preview:** Displays the playlist thumbnail, title, and total video count.
*   **Format Selection:** Radio buttons or dropdown for selecting download format for all videos in the playlist (e.g., MP4, MP3).
*   **Quality Selection:** Dropdown for preferred video quality for all videos in the playlist. Includes a note about smart quality fallback.
*   **Subtitle Inclusion Checkbox:** Option to include available subtitles for all videos in the playlist.
*   **Save Location Display & Button:** Shows the current default download path and a button to open a native file browser to select a custom save location for the playlist folder.
*   **"Add to Download Queue" Button:** Initiates the batch download task for the entire playlist.

**User Stories:**

*   **As a user,** I want to download an entire playlist with a single action, applying the same settings to all videos.
*   **As a user,** I want the application to automatically select the best available quality if my preferred quality isn't available for a specific video in the playlist.
*   **As a user,** I want to choose a specific folder on my computer where the entire playlist will be saved.

**Design Considerations:**

*   **Batch Configuration:** Options should clearly apply to the entire playlist.
*   **Smart Fallback Explanation:** Briefly explain the smart quality fallback mechanism to manage user expectations.
*   **Progress Indication:** Once initiated, the dialog should close, and progress should be visible in the Activity Center.





## 7.3. Post-MVP Epics and User Stories

Future development will focus on expanding Playlistify's capabilities through deeper YouTube integration, advanced organizational features, and further UI/UX refinements.

### **Epic 6: Full Account Integration**

**Goal:** Enable seamless integration with YouTube accounts, allowing users to manage private content and leverage their existing YouTube library within Playlistify.

---

#### **Story 6.1: Google OAuth2 Login & Multi-Account Support**

**As a user,** I want to securely log in with my Google account(s) so I can access my private YouTube content and manage multiple YouTube identities within Playlistify.

*   **Acceptance Criteria:**
    *   A prominent 


 "Sign in with Google" option is available in the application (e.g., in Settings or a dedicated login page).
    *   The OAuth2 flow must open in an external browser window, and upon successful authentication, the application must securely receive and store the necessary tokens.
    *   Users must be able to add and switch between multiple Google accounts within the application.
    *   The application must clearly indicate which Google account is currently active.
*   **Subtasks:**
    *   `[ ]` Implement Google OAuth2 flow for desktop applications.
    *   `[ ]` Securely store refresh and access tokens using `electron-store` or similar secure storage.
    *   `[ ]` Develop UI for adding and managing multiple Google accounts.
    *   `[ ]` Implement logic for switching active accounts and displaying the current account.

---

#### **Story 6.2: Access Private and Unlisted YouTube Playlists**

**As a user,** once logged in, I want to be able to import and manage my private and unlisted YouTube playlists within Playlistify.

*   **Acceptance Criteria:**
    *   The "Add Playlist" dialog (or a new dedicated import flow) must allow importing private/unlisted playlists if the user is logged in with the owning Google account.
    *   These playlists should be clearly distinguishable from public playlists in the UI (e.g., with a lock icon).
    *   All features applicable to public playlists (viewing, health check, downloading) must also apply to private/unlisted ones.
*   **Subtasks:**
    *   `[ ]` Extend the `playlist:import` IPC handler to handle authenticated requests for private/unlisted playlists.
    *   `[ ]` Update the UI to display private/unlisted indicators for such playlists.
    *   `[ ]` Ensure backend services (health check, download) use the appropriate authentication tokens when accessing private/unlisted content.

---

#### **Story 6.3: Integrate "Liked Videos" and "Watch Later"**

**As a user,** I want my YouTube "Liked Videos" and "Watch Later" playlists to automatically appear in the Playlistify sidebar so I can manage them alongside my other playlists.

*   **Acceptance Criteria:**
    *   Upon successful Google account integration, "Liked Videos" and "Watch Later" playlists must be automatically detected and added to the sidebar.
    *   These special playlists should be clearly labeled and potentially grouped separately.
    *   Changes to these playlists on YouTube should be reflected in Playlistify (e.g., new liked videos appearing).
*   **Subtasks:**
    *   `[ ]` Implement a background synchronization service to periodically fetch updates for "Liked Videos" and "Watch Later" playlists.
    *   `[ ]` Design and implement UI elements in the sidebar for these special playlists.
    *   `[ ]` Ensure the synchronization process is efficient and respects YouTube API quotas.

---

#### **Story 6.4: Detailed Data Synchronization Center**

**As a user,** I want a dedicated section in the settings to manage and monitor data synchronization with my YouTube account(s), including manual sync options and conflict resolution.

*   **Acceptance Criteria:**
    *   A new "Synchronization" section must be added to the Settings page.
    *   This section must display the last sync time for each connected account and special playlist.
    *   A "Sync Now" button must be available for manual synchronization.
    *   Options for resolving conflicts (e.g., local changes vs. YouTube changes) should be provided, if applicable.
*   **Subtasks:**
    *   `[ ]` Create the "Synchronization" section in `Settings.tsx`.
    *   `[ ]` Implement IPC handlers for manual sync triggers.
    *   `[ ]` Develop UI to display sync status and last sync time.
    *   `[ ]` Design and implement conflict resolution mechanisms (if deemed necessary after further analysis).

### **Epic 7: Enhanced Features**

**Goal:** Introduce advanced organizational and data management features to provide power users with greater control and flexibility over their content library.

---

#### **Story 7.1: "Trash Can" Feature**

**As a user,** I want a "Trash Can" or "Recently Deleted" feature so I can recover accidentally deleted playlists or videos.

*   **Acceptance Criteria:**
    *   When a playlist or video is deleted, it is moved to a "Trash Can" area instead of being permanently removed.
    *   Items in the "Trash Can" must be restorable to their original location or a new location.
    *   Items in the "Trash Can" must have an option for permanent deletion.
    *   The "Trash Can" should automatically clear items after a configurable period (e.g., 30 days).
*   **Subtasks:**
    *   `[ ]` Modify delete IPC handlers to move items to a `trash_can` table in the database instead of permanent deletion.
    *   `[ ]` Create a `TrashCan.tsx` page component to display deleted items.
    *   `[ ]` Implement IPC handlers for restoring and permanently deleting items from the trash.
    *   `[ ]` Implement a background service to automatically clear old items from the trash.
    *   `[ ]` Add a setting for configuring the auto-clear period.

---

#### **Story 7.2: Multi-Select for Batch Actions**

**As a user,** I want to select multiple videos or playlists and perform batch actions (e.g., delete, move to custom playlist, duplicate) to manage my library more efficiently.

*   **Acceptance Criteria:**
    *   A checkbox or similar UI element must appear next to each video/playlist item when a multi-select mode is activated.
    *   A floating action bar or contextual menu must appear when items are selected, offering relevant batch actions.
    *   Batch actions must include: Delete, Add to Custom Playlist, Move to Custom Playlist (for videos), Duplicate (for custom playlists).
    *   Confirmation dialogs must be used for destructive batch actions.
*   **Subtasks:**
    *   `[ ]` Implement multi-select state management for video and playlist lists.
    *   `[ ]` Design and implement the batch action UI (e.g., a bottom bar or top bar).
    *   `[ ]` Extend existing IPC handlers or create new ones for batch operations.
    *   `[ ]` Ensure performance is acceptable for large batch operations.

---

#### **Story 7.3: Playlist Folders and Custom Tagging**

**As a user,** I want to organize my playlists into folders and apply custom tags to videos and playlists for advanced categorization and retrieval.

*   **Acceptance Criteria:**
    *   Users must be able to create nested folders for organizing playlists in the sidebar.
    *   A tagging system must allow users to assign multiple custom tags to videos and playlists.
    *   The UI must provide a way to filter and search content by tags.
    *   Tags should be manageable (add, edit, delete).
*   **Subtasks:**
    *   `[ ]` Modify the database schema to support playlist folders and tags.
    *   `[ ]` Implement UI for creating, moving, and managing playlist folders.
    *   `[ ]` Develop UI for adding, removing, and managing tags on videos and playlists.
    *   `[ ]` Implement search and filter functionality based on tags.

---

#### **Story 7.4: Full Backup and Restore System**

**As a user,** I want to back up my entire Playlistify library (playlists, metadata, watch history, settings) and restore it on the same or a different computer.

*   **Acceptance Criteria:**
    *   A "Backup" option must be available in the Settings, allowing users to select a save location for the backup file.
    *   A "Restore" option must be available in the Settings, allowing users to select a backup file and restore their library.
    *   The backup must include all database entries, settings, and references to downloaded files.
    *   The restore process must handle existing data gracefully (e.g., merge or overwrite options).
*   **Subtasks:**
    *   `[ ]` Implement IPC handlers for initiating backup and restore operations.
    *   `[ ]` Develop a robust backup format (e.g., encrypted SQLite dump or JSON export).
    *   `[ ]` Implement the restore logic, including data migration and conflict resolution.
    *   `[ ]` Provide clear UI feedback during backup/restore processes.

### **Epic 8: UI/UX Improvements**

**Goal:** Refine the user interface and experience to enhance usability, visual appeal, and overall application fluidity.

---

#### **Story 8.1: "Active Downloads" Section on Dashboard**

**As a user,** I want a more prominent and detailed "Active Downloads" section on the dashboard so I can easily monitor all ongoing download activities without going to the dedicated Downloads page.

*   **Acceptance Criteria:**
    *   A dedicated, expandable section on the Dashboard displaying a summary of active downloads.
    *   Each active download should show its title, progress bar, and current status.
    *   Clicking on an item in this section should navigate to the full Downloads page, highlighting that specific item.
*   **Subtasks:**
    *   `[ ]` Enhance the existing dashboard widget for active downloads to be more prominent.
    *   `[ ]` Implement detailed progress display within the dashboard widget.
    *   `[ ]` Link items in the dashboard widget to the `Downloads` page with appropriate routing parameters.

---

#### **Story 8.2: User-Selectable Accent Colors**

**As a user,** I want to choose a custom accent color for the application UI so I can personalize its appearance.

*   **Acceptance Criteria:**
    *   A color picker or a set of predefined color swatches must be available in the Settings.
    *   Selecting a color must immediately apply it as the accent color throughout the application (e.g., for highlights, active states, primary buttons).
    *   The chosen accent color must persist across application restarts.
*   **Subtasks:**
    *   `[ ]` Implement a color selection UI in `Settings.tsx`.
    *   `[ ]` Integrate the selected color into the Tailwind CSS configuration or apply it via CSS variables.
    *   `[ ]` Store the chosen accent color in `electron-store`.
    *   `[ ]` Ensure all UI components correctly utilize the dynamic accent color.

---

#### **Story 8.3: Online Streaming of Videos**

**As a user,** I want to be able to stream YouTube videos directly within the application without downloading them first, so I can quickly watch content without consuming local storage.

*   **Acceptance Criteria:**
    *   Clicking on a non-downloaded video in an imported playlist should open the in-app video player and stream the video from YouTube.
    *   The player should handle buffering and network interruptions gracefully.
    *   Streaming should respect YouTube API terms of service and not bypass any restrictions.
*   **Subtasks:**
    *   `[ ]` Extend the `VideoPlayer.tsx` component to support streaming from YouTube URLs.
    *   `[ ]` Implement logic to differentiate between local and streamed videos when a video is clicked.
    *   `[ ]` Ensure proper error handling for network issues or unavailable streams.

---

#### **Story 8.4: Advanced Video Player Controls**

**As a user,** I want advanced controls in the video player, such as playback speed adjustment, so I can customize my viewing experience.

*   **Acceptance Criteria:**
    *   The in-app video player must include a control for adjusting playback speed (e.g., 0.5x, 1x, 1.5x, 2x).
    *   Other advanced controls like mini-player mode or picture-in-picture could be considered.
*   **Subtasks:**
    *   `[ ]` Add playback speed controls to the `VideoPlayer.tsx` UI.
    *   `[ ]` Implement the underlying logic to change video playback speed.
    *   `[ ]` Research and implement other advanced player features as feasible.



