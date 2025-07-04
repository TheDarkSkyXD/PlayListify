# User Stories

## Epic 1: Project Foundation & Playlist Viewing

### Story 1.1: Main Application Layout
As a user, I want to see the main application window with the sidebar and top navigation bar so that I can understand the layout and see the main sections of the app.

*   Acceptance Criteria:
    *   The application opens to a primary window within 2 seconds.
    *   A persistent sidebar is visible on the left, taking up between 15% and 20% of the screen width (e.g., 240-320 pixels on a 1600px wide screen).
    *   A persistent top navigation bar is visible at the top, with a height between 5% and 10% of the screen height (e.g., 40-80 pixels on an 800px tall screen).
    *   The main view occupies the remaining screen space below the top navigation bar and to the right of the sidebar.

### Story 1.2: Build Dashboard UI Structure
As a user, I want a dashboard that serves as my central starting point, designed to display my "Recent Playlists" and "Continue Watching" history.

*   Acceptance Criteria:
    *   A "Dashboard" screen is created with clearly defined sections for "Recent Playlists" and "Continue Watching".
    *   These sections initially display an appropriate empty state (e.g., "Your recent playlists will appear here"). Each empty state message should be no more than 50 characters.
    *   The structure is ready to receive and display real data as soon as the corresponding features are completed in later stories.
    *   The empty state messages are centered within their respective sections, using a font size of 16px.

### Story 1.3: Import Public Playlist
As a user, I want to use the "+ Add" menu to import a public YouTube playlist using its URL, so that the import process starts in the background and I can continue using the app.

*   Acceptance Criteria:
    *   The "+ Add" menu contains an option labeled "Add Playlist".
    *   Clicking this option opens a dialog box for the user to paste a YouTube playlist URL.
    *   After a valid URL is entered, the dialog automatically fetches and displays a preview of the playlist (including the playlist thumbnail (64x64 pixels), title, video count, channel name, and a short description) within 3 seconds.
    *   When the user clicks the final "Import" button in the dialog, the dialog closes immediately, and the import task appears in the Activity Center within 1 second.
    *   Once the background task is complete, the new playlist appears in the sidebar within 5 seconds, and a success notification is displayed for 3 seconds.

### Story 1.4: View Playlist Details
As a user, I want to select an imported playlist and see the list of all its videos, including thumbnails and titles, so that I can browse its contents.

*   Acceptance Criteria:
    *   Clicking a playlist in the sidebar displays its contents in the main view within 2 seconds.
    *   The view shows the playlist's header (title, video count, etc.) and a "Last checked" timestamp.
    *   Each video in the list displays its Thumbnail (48x48 pixels), Title, Channel Name, Duration, View Count, Upload Date, a colored status dot (green, yellow, or red), and its downloaded quality (if applicable).
    *   A loading state is shown while data is being fetched, with a loading animation displaying for no more than 3 seconds.

### Story 1.5: Search within Playlist
As a user, I want to search for a specific video by title within a selected playlist so that I can find content quickly.

*   Acceptance Criteria:
    *   A search input field is present on the playlist detail view.
    *   As the user types in the search field, the visible list of videos filters in real-time (within 0.5 seconds) to show only videos whose titles match the search query, using a case-insensitive search.

### Story 1.6: Infinite Scroll for Video Lists
As a user Browse a large playlist, I want the video list to load more items automatically as I scroll down so that I can view all content without clicking through pages.

*   Acceptance Criteria:
    *   For playlists with a large number of videos (e.g., >100), the UI does not hang or become slow. Scrolling performance should maintain at least 30 frames per second.
    *   Only the currently visible video items are rendered in the DOM.
    *   Scrolling is smooth and performant.

## Epic 2: Custom Playlist Management

### Story 2.1: Add New Playlist (Custom or from YouTube)
As a user, I want to select 'Add Playlist' from the main menu and then choose whether to create a new custom playlist or import one from a YouTube URL within a single dialog.

*   Acceptance Criteria:
    *   The "+ Add" dropdown menu contains a single option: "Add Playlist".
    *   Clicking this opens a dialog titled "Add Playlist" with two tabs: "Custom Playlist" and "Add from YouTube".
    *   The "Custom Playlist" tab has fields for Title (single-line text input) and Description (multi-line text input) and a "Create Playlist" button.
    *   The Title field enforces a 100-character limit and the Description field enforces a 512-character limit. Both should display a character counter (e.g., `25/100`).
    *   If a user tries to create a playlist with a title that already exists, an error message is displayed within 2 seconds, and the playlist will not be created.
    *   The "Add from YouTube" tab contains the full preview-and-import flow defined in Epic 1.

### Story 2.2: Add Videos to a Custom Playlist
As a user, I want to add a video from an existing playlist to one of my custom playlists so I can organize content according to my own themes.

*   Acceptance Criteria:
    *   A context menu on any video item provides an "Add to Playlist" option.
    *   This option opens a submenu or dialog listing all the user's custom playlists.
    *   If a user attempts to add a video to a custom playlist that already contains that video, no duplicate entry will be created. A brief, non-blocking notification (e.g., "Video is already in this playlist") is shown for 3 seconds.
    *   Selecting a playlist correctly adds the video to it and provides a success notification (e.g., "Video added to 'My Favorites'") for 3 seconds.

### Story 2.3: Remove Videos from a Custom Playlist
As a user, I want to remove a video from one of my custom playlists to keep it organized and relevant.

*   Acceptance Criteria:
    *   A context menu on any video item *within a custom playlist* provides a "Remove from Playlist" option.
    *   A confirmation dialog is displayed before removing the video.
    *   The confirmation dialog clearly states that the action only removes the video from the current playlist and does not delete the video from the library or from other playlists (e.g., "This will only remove the video from the '[Playlist Name]' playlist. It will not be deleted from your library.").
    *   After confirming removal, the video is removed from the list within 1 second.

### Story 2.4: Edit Custom Playlist Details
As a user, I want to be able to change the title and description of my custom playlists after I've created them.

*   Acceptance Criteria:
    *   A context menu on any custom playlist provides an "Edit Details" option.
    *   This opens a dialog pre-filled with the current title and description.
    *   The system prevents renaming a playlist to a title that already exists, showing an error if attempted within 2 seconds.

### Story 2.5: Delete a Custom Playlist
As a user, I want to delete an entire custom playlist that I no longer need.

*   Acceptance Criteria:
    *   A context menu on any custom playlist provides a "Delete Playlist" option.
    *   A confirmation dialog is displayed, clearly stating that the action is permanent (e.g., "Are you sure? This will permanently delete the playlist 'My Awesome Mix'. This cannot be undone.").
    *   If a video from the playlist is currently playing, confirming the deletion stops the video playback within 1 second before deleting the playlist.

## Epic 3: Core Downloading & Offline Playback

### Story 3.1: Implement Intelligent Quality Detection Service
As a developer, I need a backend service that can analyze a YouTube video or playlist URL and determine the specific quality options available for download.

*   Acceptance Criteria:
    *   The service uses `yt-dlp` to fetch a list of all available formats for a given URL.
    *   The service parses this list and returns a clean, ordered set of available qualities (e.g., '720p', '1080p', '4K', '8K') within 5 seconds.
    *   The service is exposed via an IPC handler that the frontend can call.

### Story 3.2: Download a Single Video via URL
As a user, I want to download a single video from a YouTube URL, with options to select format, quality, subtitles, and save location.

*   Acceptance Criteria:
    *   The "+ Add" menu has a "Download Video" option that opens the "Download Video" dialog.
    *   When a valid URL is pasted, the dialog automatically fetches and displays a video preview within 3 seconds.
    *   The dialog displays the default download path and provides a button for the user to change it.
    *   The dialog allows the user to select quality, format (MP4/MP3), and whether to "Include subtitles when available".
    *   All downloads are sanitized to have valid filenames and converted to a compatible format (MP4 H.264/AAC).
    *   The downloaded video file has its YouTube thumbnail embedded.
    *   Before starting, the system checks for sufficient disk space and shows an error if there is not enough space within 2 seconds.
    *   The "Add to Download Queue" button sends the configured download task to the Activity Center.

### Story 3.3: Download an Entire Playlist
As a user, I want to download all videos from a playlist with a single action, choosing the format, quality, and save location for the batch.

*   Acceptance Criteria:
    *   A "Download Playlist" button on the playlist details view opens the download dialog.
    *   The dialog displays the default download path and provides a button for the user to change it.
    *   The dialog dynamically populates quality options based on the highest quality found within the playlist.
    *   The system uses smart quality fallback: if a video is unavailable in the chosen quality, it automatically downloads the next highest quality available for that specific video.
    *   All successfully downloaded videos have their thumbnails embedded.

### Story 3.4: View Downloads Page
As a user, I want to see a dedicated "Downloads" page that lists all my queued, in-progress, and completed downloads so I can track their status.

*   Acceptance Criteria:
    *   The page displays a list of all downloads with their title, status, and progress bar.
    *   Failed downloads have a "Retry" button that restarts the download from the beginning.

### Story 3.5: Basic Offline Playback
As a user, I want to click on a successfully downloaded video and have it play within the application with a full set of basic controls.

*   Acceptance Criteria:
    *   When clicking a downloaded video, the player first verifies the local file exists. If not, it shows a "File not found" message within 1 second.
    *   The player correctly loads and plays the local video file within 2 seconds.
    *   The player controls include buttons for play/pause, volume, a loop toggle, and a menu to select available subtitle tracks.
    *   The player's seek bar is fully functional and visually indicates the buffered/loaded portion of the video.

## Epic 4: Background Tasks & Activity Center

### Story 4.1: Persistent Backend Task Management Service
As a developer, I need a centralized, persistent service to manage the state and progress of all long-running background tasks.

*   Acceptance Criteria:
    *   A `background_tasks` table is created in the SQLite database to store task information.
    *   All new tasks (imports, downloads) are saved as a record in this table.
    *   The service supports parent/child task relationships (for playlist downloads) to handle partial failures gracefully.
    *   On application startup, the service reads this table to resume the state of any unfinished tasks, ensuring no progress is lost if the app is closed.

### Story 4.2: Integrate Core Services with Task Manager
As a developer, I need the import and download services to report their status to the new Task Management service (now `BackgroundTaskService`) to handle partial failures gracefully, especially for operations involving multiple items like playlist downloads.

*   Acceptance Criteria:
    *   Playlist imports and downloads (specifically those involving multiple sub-items like downloading all videos in a playlist) create a "parent" task. The parent task's progress reflects the completion of its "child" video tasks.
    *   If some videos in a playlist download fail, the parent task is marked as "Completed with errors."
    *   The download service (and any service creating tasks) updates the task's progress and final status in the database via `BackgroundTaskService`.

### Story 4.3: Activity Center UI
As a user, I want to see a persistent widget in the corner of the screen that shows me my active tasks, which I can cancel or clear at any time.

*   Acceptance Criteria:
    *   A persistent widget is displayed in the bottom-right corner of the application.
    *   The widget header shows an active task count (e.g., "Active (2)") and a minimize icon.
    *   The widget displays a list of all `In Queue` and `In Progress` tasks.
    *   Each task item displays its type (e.g., Import, Download), thumbnail, title, a progress bar, and a status tag.
    *   Each active task in the widget has a "Cancel" button that stops the corresponding backend task within 2 seconds.
    *   Progress updates from the backend are throttled to no more than 5 updates per second to keep the UI performant.
    *   When a task is completed (successfully or failed), it remains visible with a final status and a timestamp for 5 seconds, and then automatically fades out.
    *   A "Clear All" (trash can icon) button is present to manually remove all completed tasks from the view.

## Epic 5: Playlist Health & Status Sync

### Story 5.1: Backend Health Check Service
As a developer, I need a backend service that can check an imported playlist against YouTube to see if any videos have been deleted or privated.

*   Acceptance Criteria:
    *   The service iterates through the videos of a given playlist.
    *   For each video, it uses a lightweight `yt-dlp` command to verify its current status on YouTube.
    *   It updates the `availability_status` (e.g., 'Live', 'Deleted', 'Private') for the video in the local database within 1 second.
    *   The service processes videos in a low-concurrency queue (e.g., one or two at a time) to avoid sending a burst of requests that could lead to IP rate-limiting.

### Story 5.2: Display Video Health Status in UI
As a user, I want to see a colored dot next to each video in an imported playlist so I know if it's still available on YouTube and when that status was last checked.

*   Acceptance Criteria:
    *   In the video list item component, a colored dot is displayed based on the video's `availability_status` from the database.
    *   The colors are: Green for 'Live', Yellow for 'Unlisted/Private', and Red for 'Deleted'.
    *   A tooltip on the dot explains the status on hover (e.g., "Status: Live").
    *   The playlist view header displays a "Status last checked: [timestamp]" (e.g., "3 hours ago") message.

### Story 5.3: Implement Auto-Sync Settings UI
As a user, I want to configure how often my playlists are automatically checked for status updates.

*   Acceptance Criteria:
    *   A dedicated "Auto-Sync Settings" section is created on the Settings page.
    *   The UI provides controls (e.g., radio buttons) to select the frequency (e.g., Hourly, Daily, Weekly, Never).
    *   "Daily" is the default setting.
    *   A note explaining the resource usage trade-off is present (e.g., "More frequent syncing provides the most up-to-date status but uses more system resources.").

### Story 5.4: Scheduled Background Sync
As a developer, I need a scheduler that automatically and safely runs the Health Check Service on all imported playlists based on the user's chosen frequency.

*   Acceptance Criteria:
    *   The scheduler reads the user's sync frequency from settings to determine its interval.
    *   The scheduler pauses if a user-initiated task (like a new import or download) is active, to prioritize the user's actions. It will resume after the user's tasks are complete.

### Story 5.5: Manual Playlist Refresh
As a user, I want a button to manually trigger a health check on a specific playlist so I can get its up-to-the-minute status on demand.

*   Acceptance Criteria:
    *   The context menu for any imported YouTube playlist has a "Refresh Status Now" button.
    *   Clicking the button triggers the `HealthCheckService` for that single playlist.
    *   The UI provides immediate feedback that a check is in progress for that specific playlist (e.g., a spinning icon next to the "Last checked" timestamp).