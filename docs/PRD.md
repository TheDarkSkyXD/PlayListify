## **Product Requirements Document: Playlistify**

### **1. Introduction**

#### **1.1. Problem Statement**

For both diligent content archivists and casual users, managing and preserving YouTube playlists presents significant challenges. The native YouTube interface offers limited organizational tools, and users face the constant risk of videos becoming unavailable due to deletion or being set to private. This results in a loss of curated content and a lack of true ownership over one's collections. Playlistify aims to solve this by providing a powerful, desktop-based application that gives users ultimate control to manage, archive, and locally access their YouTube content, securely and conveniently.

#### **1.2. Vision**

To be the definitive tool for anyone who is serious about their YouTube collections, transforming the passive viewing experience into an actively managed, secure, and permanent personal library. Playlistify will empower users by giving them complete sovereignty over their content.

### **2. Target Audience**

* **The Digital Archivist:** A user who wants to create a secure, permanent, and locally-controlled archive of YouTube content to prevent loss from deletion or privatization.
* **The Convenience User:** A casual user who wants an easy way to download playlists and videos for offline access (e.g., for travel, commuting, or areas with poor internet).

### **3. Success Metrics (MVP)**

* Number of playlists created and imported per profile.
* Total number of videos successfully downloaded.
* Feature adoption rate for key functions (e.g., use of custom playlists vs. imports, use of the "Health Check" feature).

### **4. Key Features & Scope**

#### **4.1. Minimum Viable Product (MVP)**

The initial release will focus on delivering a stable, core experience without requiring a user to log into a Google account.

**Epic 1: Project Foundation & Playlist Viewing**
* **Goal:** Establish the core application shell and enable users to view and search within playlists.
* **Features:**
    * Main application layout with a persistent sidebar and top navigation bar.
    * Dashboard home screen displaying recently accessed playlists and viewing history.
    * Ability to view the contents of a playlist, including video thumbnails, titles, channel names, duration, view count, and upload date.
    * Search functionality within a selected playlist.
    * Infinite scrolling for seamlessly Browse large playlists.

**Epic 2: Custom Playlist Management**
* **Goal:** Empower users to create, populate, and manage their own local playlists.
* **Features:**
    * A unified "Add Playlist" dialog with tabs for creating a new custom playlist or importing an existing one from a YouTube URL.
    * Ability to add videos from any playlist to a custom playlist.
    * Ability to remove videos from a custom playlist.
    * Functionality to edit the title and description of custom playlists.
    * Ability to delete a custom playlist with a confirmation dialog.

**Epic 3: Core Downloading & Offline Playback**
* **Goal:** Implement the core archiving functionality, allowing users to download videos and watch them offline.
* **Features:**
    * Download a single video via URL with options for format (MP4/MP3), quality, subtitle inclusion, and save location.
    * Download an entire playlist with smart quality fallback (if the selected quality is unavailable, the best available quality is chosen).
    * A dedicated "Downloads" page to view and manage the status of all downloads.
    * An integrated video player for offline playback of downloaded files with controls for play/pause, volume, seek bar, loop toggle, and subtitle display.

**Epic 4: Background Tasks & Activity Center**
* **Goal:** Implement a system for handling long-running tasks in the background and provide a UI for users to monitor progress.
* **Features:**
    * A persistent task management service that tracks the progress of imports and downloads, even if the app is closed and reopened.
    * An "Activity Center" widget in the bottom-right corner displaying the status of all active and queued tasks.
    * The ability for users to cancel any in-progress tasks directly from the Activity Center.

**Epic 5: Playlist Health & Status Sync**
* **Goal:** Introduce automated status checking to keep users informed about video availability.
* **Features:**
    * A "Playlist Health Check" system that periodically checks the status of videos in imported playlists (Live, Deleted, Private) and displays a colored status dot.
    * A "Refresh Playlist" button for on-demand manual status checks.
    * A settings page to configure the frequency of the automatic health checks (e.g., Hourly, Daily, Weekly).

#### **4.2. Post-MVP Roadmap**

Future releases will focus on expanding functionality through account integration and power-user features.

* **Full Account Integration:**
    * Google OAuth2 login and multi-account support.
    * Access to private and unlisted YouTube playlists.
    * Integration of "Liked Videos" and "Watch Later" into the sidebar.
    * A detailed data synchronization center in the settings.
* **Enhanced Features:**
    * A "Trash Can" feature to restore accidentally deleted playlists and videos.
    * Multi-select for batch actions (delete, move, duplicate).
    * Playlist folders and a custom tagging system for advanced organization.
    * A full backup and restore system for the entire user library.
* **UI/UX Improvements:**
    * An "Active Downloads" section on the dashboard.
    * User-selectable accent colors for the UI.
    * Online streaming of videos without downloading.
    * Advanced video player controls like playback speed.

### **5. Technical Constraints & Preferences**

* **Platform:** Electron (for a cross-platform desktop app).
* **Boilerplate:** The project will be built upon the `electron-react-boilerplate` foundation.
* **Core Libraries:**
    * **Frontend:** React, TypeScript, TailwindCSS
    * **UI Components:** shadcn/ui, lucide-react
    * **State Management:** TanStack React Query & Zustand
    * **Backend:** Node.js
    * **Database:** better-sqlite3
    * **YouTube Interaction:** yt-dlp-wrap
    * **Settings Storage:** electron-store
    * **Validation:** Zod
* **Resource Management:** The application must be optimized for low CPU and memory usage, especially when idle. Destructive actions require user confirmation to prevent data loss. Filenames will be sanitized to prevent errors, and downloads will be managed in a queue to avoid system overload.