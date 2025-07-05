# Functional Requirements

This document outlines the functional requirements for the Playlistify application. Each requirement is accompanied by measurable success criteria and TDD anchors to facilitate test-driven development.

## Epic 1: Project Foundation & Playlist Viewing

### Story 1.1: Main Application Layout

*   **Description:** The application must present a consistent and intuitive layout with a sidebar and top navigation bar.
*   **FR.1.1.1:** The application shall open to a primary window within 2 seconds.
    *   **Success Criteria:** The application window is fully rendered and interactive within 2 seconds of launch.
    *   **TDD Anchor:** `tests/acceptance/test_app_launch.py::TestAppLaunch::test_main_window_loads_quickly`
*   **FR.1.1.2:** A persistent sidebar shall be visible on the left, taking up no more than 20% of the screen width.
    *   **Success Criteria:** The sidebar is present on all main application views and its width does not exceed 20% of the screen width.
    *   **TDD Anchor:** `tests/acceptance/test_app_layout.py::TestAppLayout::test_sidebar_presence_and_dimensions`
*   **FR.1.1.3:** A persistent top navigation bar shall be visible at the top, with a height no more than 10% of the screen height.
    *   **Success Criteria:** The top navigation bar is present on all main application views and its height does not exceed 10% of the screen height.
    *   **TDD Anchor:** `tests/acceptance/test_app_layout.py::TestAppLayout::test_top_nav_bar_presence_and_dimensions`

### Story 1.2: Build Dashboard UI Structure

*   **Description:** The application must provide a dashboard as the central starting point, displaying "Recent Playlists" and "Continue Watching" history.
*   **FR.1.2.1:** A "Dashboard" screen shall be created with clearly defined sections for "Recent Playlists" and "Continue Watching".
     *   **Success Criteria:** The Dashboard screen is accessible via a sidebar link with `href="#dashboard"` and contains distinct visual sections with `id="recent-playlists"` and `id="continue-watching"`.
     *   **TDD Anchor:** `tests/acceptance/test_dashboard.py::TestDashboard::test_dashboard_layout`
*   **FR.1.2.2:** These sections shall initially display an appropriate empty state (e.g., "Your recent playlists will appear here"). Each empty state message should be no more than 50 characters.
     *   **Success Criteria:** When no recent playlists or "Continue Watching" history is available, the sections with `id="recent-playlists"` and `id="continue-watching"` display placeholder messages with `class="empty-state-message"` that are no longer than 50 characters.
     *   **TDD Anchor:** `tests/acceptance/test_dashboard.py::TestDashboard::test_dashboard_empty_state`
*   **FR.1.2.3:** The structure shall be ready to receive and display real data as soon as the corresponding features are completed in later stories.
    *   **Success Criteria:** The Dashboard layout is designed to dynamically populate with playlist and video data when available.
    *   **TDD Anchor:** (This is a structural requirement, verified through code review)

### Story 1.3: Import Public Playlist

*   **Description:** The application must allow users to import public YouTube playlists using a URL.
*   **FR.1.3.1:** The "+ Add" menu shall contain an option labeled "Add Playlist".
     *   **Success Criteria:** The "+ Add" menu in the top navigation bar, identified by `id="add-menu"`, includes an item with the text "Add Playlist" and `id="add-playlist-item"`.
     *   **TDD Anchor:** `tests/acceptance/test_playlist_flows.py::TestPlaylistFlows::test_add_playlist_menu_item`
*   **FR.1.3.2:** Clicking the "Add Playlist" menu item shall open a dialog box with `id="add-playlist-dialog"` for the user to paste a YouTube playlist URL.
     *   **Success Criteria:** Clicking the "Add Playlist" menu item opens a dialog with `id="add-playlist-dialog"` containing a visible input field with `id="playlist-url"` for a YouTube playlist URL.
     *   **TDD Anchor:** `tests/acceptance/test_playlist_flows.py::TestPlaylistFlows::test_add_playlist_dialog`
*   **FR.1.3.3:** After a valid URL is entered in the `playlist-url` input field, the dialog shall automatically fetch and display a preview of the playlist (Thumbnail with `id="playlist-thumbnail"`, Title with `id="playlist-title"`, Video Count with `id="playlist-video-count"`, etc.) within 3 seconds.
     *   **Success Criteria:** Upon entering a valid YouTube playlist URL, the dialog displays the playlist's thumbnail, title, and video count within 3 seconds.
     *   **TDD Anchor:** `tests/acceptance/test_playlist_flows.py::TestPlaylistFlows::test_add_playlist_preview`
*   **FR.1.3.4:** When the user clicks the final "Import" button with `id="import-playlist-button"` in the dialog, the dialog shall close immediately, and the import task shall instantly appear in the Activity Center with status "Queued".
     *   **Success Criteria:** Clicking the "Import" button closes the dialog with `id="add-playlist-dialog"` and adds a new task to the Activity Center with the status "Queued". The task in the Activity Center should have `class="activity-item"` and a status element with `class="activity-status"` containing "Queued".
     *   **TDD Anchor:** `tests/acceptance/test_playlist_flows.py::TestPlaylistFlows::test_add_playlist_import`
*   **FR.1.3.5:** Once the background task is complete, the new playlist shall appear in the sidebar, identified by `id="playlist-sidebar"`, within 5 seconds, and a success notification with `class="success-notification"` shall be displayed for 3 seconds.
     *   **Success Criteria:** After the import task completes, the playlist is added to the sidebar navigation within 5 seconds, and a success notification appears for 3 seconds.
     *   **TDD Anchor:** `tests/acceptance/test_playlist_flows.py::TestPlaylistFlows::test_add_playlist_sidebar_update`

### Story 1.4: View Playlist Details

*   **Description:** The application must allow users to view the details of an imported playlist.
*   **FR.1.4.1:** Clicking a playlist in the sidebar shall display its contents in the main view within 2 seconds.
    *   **Success Criteria:** Selecting a playlist from the sidebar displays the playlist's details in the main content area within 2 seconds.
    *   **TDD Anchor:** `tests/acceptance/test_playlist_flows.py::TestPlaylistFlows::test_view_playlist_details`
*   **FR.1.4.2:** The view shall show the playlist's header (title with `id="playlist-title"`, video count with `id="playlist-video-count"`, etc.) and a "Last checked" timestamp with `id="last-checked"`.
     *   **Success Criteria:** The playlist details view includes the playlist's title, total video count, and a "Last checked" timestamp indicating the last time the playlist's status was checked.
     *   **TDD Anchor:** `tests/acceptance/test_playlist_flows.py::TestPlaylistFlows::test_playlist_header_info`
*   **FR.1.4.3:** Each video in the list, with `class="video-item"`, shall display its Thumbnail with `id="video-thumbnail"`, Title with `id="video-title"`, Channel Name with `id="video-channel"`, Duration with `id="video-duration"`, View Count with `id="video-views"`, Upload Date with `id="video-upload-date"`, a colored status dot with `id="video-status"`, and its downloaded quality (if applicable) with `id="video-quality"`.
     *   **Success Criteria:** Each video item in the playlist details view displays all the required information.
     *   **TDD Anchor:** `tests/acceptance/test_playlist_flows.py::TestPlaylistFlows::test_video_item_info`
*   **FR.1.4.4:** A loading state with `id="playlist-loading"` shall be shown while data is being fetched, with a loading animation displaying for no more than 3 seconds.
     *   **Success Criteria:** A loading animation is displayed while the playlist details are being fetched, and the animation disappears once the data is loaded or an error occurs. The animation should not display for longer than 3 seconds.
     *   **TDD Anchor:** `tests/acceptance/test_playlist_flows.py::TestPlaylistFlows::test_playlist_loading_state`

### Story 1.5: Search within Playlist

*   **Description:** The application must allow users to search for videos within a playlist.
*   **FR.1.5.1:** A search input field shall be present on the playlist detail view.
    *   **Success Criteria:** The playlist details view includes a visible input field labeled "Search".
    *   **TDD Anchor:** `tests/acceptance/test_song_search.py::TestSongSearch::test_search_input_present`
*   **FR.1.5.2:** As the user types in the search field, the visible list of videos shall filter in real-time (within 0.5 seconds) to show only videos whose titles match the search query.
    *   **Success Criteria:** The list of videos is filtered to display only those whose titles contain the search query (case-insensitive) within 0.5 seconds of typing.
    *   **TDD Anchor:** `tests/acceptance/test_song_search.py::TestSongSearch::test_real_time_filtering`

### Story 1.6: Infinite Scroll for Video Lists

*   **Description:** The application must provide a smooth scrolling experience for large playlists.
*   **FR.1.6.1:** For playlists with a large number of videos (e.g., >100), the UI shall not hang or become slow. Scrolling performance should maintain at least 30 frames per second.
     *   **Success Criteria:** Scrolling through a playlist with 100+ videos maintains a frame rate of at least 30 FPS, measured using performance monitoring tools. The frame rate should be consistently above 30 FPS during scrolling.
     *   **TDD Anchor:** `tests/performance/test_playlist_scrolling.py::TestPlaylistScrolling::test_playlist_scrolling_performance`
*   **FR.1.6.2:** Only the currently visible video items with `class="video-item"` shall be rendered in the DOM.
     *   **Success Criteria:** The number of video items rendered in the DOM is limited to those currently visible on the screen, plus a small buffer (e.g., 10 items above and below the visible area). This can be verified by checking the number of elements with `class="video-item"` present in the DOM during scrolling.
     *   **TDD Anchor:** `tests/acceptance/test_playlist_flows.py::TestPlaylistFlows::test_playlist_dom_rendering`
*   **FR.1.6.3:** Scrolling shall be smooth and performant.
    *   **Success Criteria:** Scrolling through the playlist should be smooth and without noticeable lag or stuttering.
    *   **TDD Anchor:** (Subjective visual test, but can be augmented with performance metrics)

## Epic 2: Custom Playlist Management

### Story 2.2: Add Videos to a Custom Playlist

*   **Description:** The application must allow users to add videos to custom playlists.
*   **FR.2.2.1:** A context menu on any video item with `class="video-item"` shall provide an "Add to Playlist" option with `id="add-to-playlist"`.
     *   **Success Criteria:** The context menu for each video item includes an item labeled "Add to Playlist".
     *   **TDD Anchor:** `tests/acceptance/test_playlist_flows.py::TestPlaylistFlows::test_video_context_menu_add`
*   **FR.2.2.2:** This option shall open a submenu or dialog with `id="playlist-list"` listing all the user's custom playlists.
     *   **Success Criteria:** Selecting "Add to Playlist" displays a list of all the user's custom playlists within a submenu or dialog with `id="playlist-list"`. Each playlist item should have `class="playlist-item"`.
     *   **TDD Anchor:** `tests/acceptance/test_playlist_flows.py::TestPlaylistFlows::test_add_to_playlist_list`
*   **FR.2.2.3:** If a user attempts to add a video to a custom playlist that already contains that video, no duplicate entry shall be created. A brief, non-blocking notification with `class="notification"` (e.g., "Video is already in this playlist") shall be shown for 3 seconds.
     *   **Success Criteria:** Attempting to add a duplicate video to a playlist results in a non-blocking notification displaying for 3 seconds, and no duplicate entry is created in the playlist.
     *   **TDD Anchor:** `tests/acceptance/test_playlist_flows.py::TestPlaylistFlows::test_add_duplicate_video`
*   **FR.2.2.4:** Selecting a playlist shall correctly add the video to it and provide a success notification with `class="notification"` (e.g., "Video added to 'My Favorites'") for 3 seconds.
     *   **Success Criteria:** Selecting a playlist from the list adds the video to the selected playlist, and a success notification with `class="notification"` displays for 3 seconds.
     *   **TDD Anchor:** `tests/acceptance/test_playlist_flows.py::TestPlaylistFlows::test_add_video_success`

### Story 2.3: Remove Videos from a Custom Playlist

*   **Description:** The application must allow users to remove videos from custom playlists.
*   **FR.2.3.1:** A context menu on any video item with `class="video-item"` *within a custom playlist* shall provide a "Remove from Playlist" option with `id="remove-from-playlist"`.
     *   **Success Criteria:** The context menu for each video item in a custom playlist includes an item labeled "Remove from Playlist".
     *   **TDD Anchor:** `tests/acceptance/test_playlist_flows.py::TestPlaylistFlows::test_video_context_menu_remove`
*   **FR.2.3.2:** A confirmation dialog with `id="remove-confirmation-dialog"` shall be displayed before removing the video.
     *   **Success Criteria:** Selecting "Remove from Playlist" displays a confirmation dialog with `id="remove-confirmation-dialog"` before removing the video.
     *   **TDD Anchor:** `tests/acceptance/test_playlist_flows.py::TestPlaylistFlows::test_remove_confirmation_dialog`
*   **FR.2.3.3:** The confirmation dialog with `id="remove-confirmation-dialog"` shall clearly state that the action only removes the video from the current playlist and does not delete the video from the library or from other playlists (e.g., "This will only remove the video from the '[Playlist Name]' playlist. It will not be deleted from your library."). The message should be displayed in an element with `id="confirmation-message"`.
     *   **Success Criteria:** The confirmation dialog displays the specified warning message.
     *   **TDD Anchor:** `tests/acceptance/test_playlist_flows.py::TestPlaylistFlows::test_remove_confirmation_message`
*   **FR.2.3.4:** After confirming removal, the video with `class="video-item"` shall be removed from the list within 1 second.
     *   **Success Criteria:** After confirming the removal, the video is removed from the list within 1 second.
     *   **TDD Anchor:** `tests/acceptance/test_playlist_flows.py::TestPlaylistFlows::test_remove_video_speed`

### Story 2.4: Edit Custom Playlist Details

*   **Description:** The application must allow users to edit the title and description of custom playlists.
*   **FR.2.4.1:** A context menu on any custom playlist with `class="playlist-item"` shall provide an "Edit Details" option with `id="edit-details"`.
     *   **Success Criteria:** The context menu for each custom playlist includes an item labeled "Edit Details".
     *   **TDD Anchor:** `tests/acceptance/test_playlist_flows.py::TestPlaylistFlows::test_playlist_context_menu_edit`
*   **FR.2.4.2:** This shall open a dialog with `id="edit-playlist-dialog"` pre-filled with the current title in input field with `id="playlist-title"` and description in textarea with `id="playlist-description"`.
     *   **Success Criteria:** Selecting "Edit Details" opens a dialog with the current playlist title and description pre-filled in the appropriate input fields.
     *   **TDD Anchor:** `tests/acceptance/test_playlist_flows.py::TestPlaylistFlows::test_playlist_edit_dialog`
*   **FR.2.4.3:** The system must prevent renaming a playlist to a title that already exists, showing an error message with `id="duplicate-title-error"` if attempted within 2 seconds.
     *   **Success Criteria:** Attempting to rename a playlist to a title that already exists results in an error message with `id="duplicate-title-error"` being displayed within 2 seconds, and the playlist title is not updated.
     *   **TDD Anchor:** `tests/acceptance/test_playlist_flows.py::TestPlaylistFlows::test_playlist_duplicate_title`

### Story 2.5: Delete a Custom Playlist

*   **Description:** The application must allow users to delete custom playlists.
*   **FR.2.5.1:** A context menu on any custom playlist with `class="playlist-item"` shall provide a "Delete Playlist" option with `id="delete-playlist"`.
     *   **Success Criteria:** The context menu for each custom playlist includes an item labeled "Delete Playlist".
     *   **TDD Anchor:** `tests/acceptance/test_playlist_flows.py::TestPlaylistFlows::test_playlist_context_menu_delete`
*   **FR.2.5.2:** A confirmation dialog with `id="delete-confirmation-dialog"` shall be displayed, clearly stating that the action is permanent (e.g., "Are you sure? This will permanently delete the playlist 'My Awesome Mix'. This cannot be undone."). The message should be displayed in an element with `id="confirmation-message"`.
     *   **Success Criteria:** Selecting "Delete Playlist" opens a confirmation dialog with the specified warning message.
     *   **TDD Anchor:** `tests/acceptance/test_playlist_flows.py::TestPlaylistFlows::test_playlist_delete_confirmation`
*   **FR.2.5.3:** If a video from the playlist is currently playing, confirming the deletion shall stop the video playback within 1 second before deleting the playlist.
     *   **Success Criteria:** If a video from the playlist being deleted is currently playing, playback is stopped within 1 second before the playlist is deleted. The playback should be stopped by calling the `stopPlayback()` function.
     *   **TDD Anchor:** `tests/acceptance/test_playlist_flows.py::TestPlaylistFlows::test_playlist_delete_stop_playback`

## Epic 3: Core Downloading & Offline Playback

### Story 3.1: Implement Intelligent Quality Detection Service

*   **Description:** The application must determine the available quality options for a YouTube video or playlist.
*   **FR.3.1.1:** The service shall use `yt-dlp` to fetch a list of all available formats for a given URL.
    *   **Success Criteria:** The service successfully retrieves a list of available formats from YouTube using `yt-dlp`.
    *   **TDD Anchor:** `tests/backend/test_download_service.py::TestDownloadService::test_yt_dlp_format_fetching`
*   **FR.3.1.2:** The service shall parse this list and return a clean, ordered set of available qualities (e.g., '720p', '1080p', '4K', '8K') within 5 seconds.
    *   **Success Criteria:** The service returns a sorted array of available qualities within 5 seconds.
    *   **TDD Anchor:** `tests/backend/test_download_service.py::TestDownloadService::test_quality_parsing_and_sorting`
*   **FR.3.1.3:** The service shall be exposed via an IPC handler that the frontend can call.
    *   **Success Criteria:** The `download:get-quality-options` IPC handler is accessible from the frontend and returns the array of qualities.
    *   **TDD Anchor:** `tests/integration/test_download_integration.py::TestDownloadIntegration::test_get_quality_ipc`

### Story 3.2: Download a Single Video via URL

*   **Description:** The application must allow users to download a single video from a YouTube URL, with options to select format, quality, subtitles, and save location.
*   **FR.3.2.1:** A "Download Video" option shall open the "Download Video" dialog with `id="download-video-dialog"`.
     *   **Success Criteria:** The "Download Video" dialog can be opened.
     *   **TDD Anchor:** `tests/acceptance/test_download_management.py::TestDownloadManagement::test_download_video_dialog_opens`
*   **FR.3.2.2:** When a valid URL is pasted into the input field with `id="video-url"`, the dialog shall automatically fetch and display a video preview with title with `id="video-title"`, thumbnail with `id="video-thumbnail"`, etc., within 3 seconds.
     *   **Success Criteria:** Pasting a valid YouTube URL displays a video preview with title, thumbnail, etc., within 3 seconds.
     *   **TDD Anchor:** `tests/acceptance/test_download_management.py::TestDownloadManagement::test_download_video_preview`
*   **FR.3.2.3:** The dialog shall display the default download path with `id="download-path"` and provide a button with `id="change-download-path"` for the user to change it.
     *   **Success Criteria:** The dialog shows the default download location and a "Change" button.
     *   **TDD Anchor:** `tests/acceptance/test_download_management.py::TestDownloadManagement::test_download_video_path`
*   **FR.3.2.4:** The dialog shall allow the user to select quality using a dropdown with `id="quality-select"`, format (MP4/MP3) using a dropdown with `id="format-select"`, and whether to "Include subtitles when available" using a checkbox with `id="include-subtitles"`.
     *   **Success Criteria:** The dialog contains dropdowns/checkboxes for quality, format and subtitles options.
     *   **TDD Anchor:** `tests/acceptance/test_download_management.py::TestDownloadManagement::test_download_video_options`
*   **FR.3.2.5:** All downloads shall be sanitized to have valid filenames and converted to a compatible format (MP4 H.264/AAC).
    *   **Success Criteria:** Downloaded files have sanitized filenames and correct format.
    *   **TDD Anchor:** `tests/backend/test_download_service.py::TestDownloadService::test_filename_sanitization_and_format`
*   **FR.3.2.6:** The downloaded video file shall have its YouTube thumbnail embedded.
    *   **Success Criteria:** The downloaded MP4 video has the YouTube thumbnail embedded as metadata.
    *   **TDD Anchor:** `tests/backend/test_download_service.py::TestDownloadService::test_thumbnail_embedding`
*   **FR.3.2.7:** Before starting, the system shall check for sufficient disk space and show an error message with `id="disk-space-error"` if there is not enough space within 2 seconds.
     *   **Success Criteria:** An error message with `id="disk-space-error"` is displayed within 2 seconds if there is not enough disk space.
     *   **TDD Anchor:** `tests/backend/test_download_service.py::TestDownloadService::test_download_disk_space`
*   **FR.3.2.8:** The "Add to Download Queue" button with `id="add-to-queue"` sends the configured download task to the Activity Center. The Activity Center item should have `class="activity-item"` and a status element with `class="activity-status"` containing "Queued".
     *   **Success Criteria:** Clicking "Add to Download Queue" adds a new task to the Activity Center with the correct parameters.
     *   **TDD Anchor:** `tests/integration/test_download_integration.py::TestDownloadIntegration::test_download_to_activity_center`

### Story 3.3: Download an Entire Playlist

*   **Description:** The application must allow users to download all videos from a playlist.
*   **FR.3.3.1:** A "Download Playlist" button with `id="download-playlist-button"` on the playlist details view shall open the download dialog with `id="download-playlist-dialog"`.
     *   **Success Criteria:** The playlist details view includes a "Download Playlist" button that opens the download dialog.
     *   **TDD Anchor:** `tests/acceptance/test_download_management.py::TestDownloadManagement::test_download_playlist_button`
*   **FR.3.3.2:** The dialog shall display the default download path with `id="download-path"` and provide a button with `id="change-download-path"` for the user to change it.
     *   **Success Criteria:** The download dialog displays the default download path and a button to change it.
     *   **TDD Anchor:** `tests/acceptance/test_download_management.py::TestDownloadManagement::test_download_playlist_path`
*   **FR.3.3.3:** The dialog shall dynamically populate quality options in dropdown with `id="quality-select"` based on the highest quality found within the playlist.
     *   **Success Criteria:** The quality options in the download dialog are populated based on the highest available quality in the playlist.
     *   **TDD Anchor:** `tests/acceptance/test_download_management.py::TestDownloadManagement::test_download_playlist_quality`
*   **FR.3.3.4:** If a video is unavailable in the chosen quality, the download for that specific video shall fail, and the parent playlist download task will be marked as 'Completed with errors'.
    *   **Success Criteria:** If the chosen quality is unavailable for a video, the individual video download fails and the parent task status is updated correctly.
    *   **TDD Anchor:** `tests/backend/test_download_service.py::TestDownloadService::test_download_failure_and_parent_task_status_update`
*   **FR.3.3.5:** All successfully downloaded videos shall have their thumbnails embedded.
    *   **Success Criteria:** Downloaded videos have thumbnails embedded.
    *   **TDD Anchor:** `tests/backend/test_download_service.py::TestDownloadService::test_playlist_thumbnail_embedding`

### Story 3.4: View Downloads Page

*   **Description:** The application must provide a dedicated "Downloads" page.
*   **FR.3.4.1:** The page shall display a list of all downloads with `class="download-item"` with their title with `id="download-title"`, status with `id="download-status"`, and progress bar with `id="download-progress"`.
     *   **Success Criteria:** The "Downloads" page lists all downloads with title, status, and progress bar.
     *   **TDD Anchor:** `tests/acceptance/test_download_management.py::TestDownloadManagement::test_downloads_page_list`
*   **FR.3.4.2:** Failed downloads with `class="download-item"` shall have a "Retry" button with `id="retry-download"` that restarts the download from the beginning.
     *   **Success Criteria:** Each failed download has a "Retry" button that restarts the download.
     *   **TDD Anchor:** `tests/acceptance/test_download_management.py::TestDownloadManagement::test_downloads_page_retry`

### Story 3.5: Basic Offline Playback

*   **Description:** The application must provide basic offline playback functionality.
*   **FR.3.5.1:** When clicking a downloaded video with `class="downloaded-video"`, the app shall first verify that the local file exists. If not, it shall show a "File not found" message with `id="file-not-found"` within 1 second.
     *   **Success Criteria:** Clicking a downloaded video triggers a file existence check, and a "File not found" message is displayed within 1 second if the file is missing.
     *   **TDD Anchor:** `tests/acceptance/test_playback_functionality.py::TestPlaybackFunctionality::test_offline_playback_file_check`
*   **FR.3.5.2:** The player with `id="video-player"` shall correctly load and play the local video file within 2 seconds.
     *   **Success Criteria:** The player loads and starts playing the video within 2 seconds if file exists.
     *   **TDD Anchor:** `tests/acceptance/test_playback_functionality.py::TestPlaybackFunctionality::test_offline_playback_load_speed`
*   **FR.3.5.3:** The player with `id="video-player"` controls shall include buttons for play/pause with `id="play-pause"`, volume with `id="volume-control"`, a loop toggle with `id="loop-toggle"`, and a menu to select available subtitle tracks with `id="subtitle-menu"`.
     *   **Success Criteria:** The player includes play/pause, volume, loop toggle, and subtitle selection controls.
     *   **TDD Anchor:** `tests/acceptance/test_playback_functionality.py::TestPlaybackFunctionality::test_offline_playback_controls`
*   **FR.3.5.4:** The player's seek bar with `id="seek-bar"` shall be fully functional and visually indicate the buffered/loaded portion of the video.
     *   **Success Criteria:** The seek bar is functional and displays the buffered portion of the video. The buffered portion should be indicated with `id="buffered-portion"`.
     *   **TDD Anchor:** `tests/acceptance/test_playback_functionality.py::TestPlaybackFunctionality::test_offline_playback_seek`

## Epic 4: Background Tasks & Activity Center

### Story 4.1: Persistent Backend Task Management Service

*   **Description:** The application must provide a persistent task management service.
*   **FR.4.1.1:** A `background_tasks` table shall be created in the SQLite database to store task information.
     *   **Success Criteria:** The `background_tasks` table exists in the SQLite database with the following schema: `id INTEGER PRIMARY KEY, type TEXT, status TEXT, progress REAL, targetId TEXT, parentId INTEGER, details JSON, createdAt DATETIME, updatedAt DATETIME, completedAt DATETIME`.
     *   **TDD Anchor:** `tests/backend/test_task_management.py::TestTaskManagement::test_background_tasks_table`
*   **FR.4.1.2:** All new tasks (imports, downloads) shall be saved as a record in the `background_tasks` table.
     *   **Success Criteria:** Each new import or download task results in a new record in the `background_tasks` table with the correct `task_type`, `title`, and `status`.
     *   **TDD Anchor:** `tests/integration/test_task_integration.py::TestTaskIntegration::test_new_task_saved`
*   **FR.4.1.3:** The service shall support parent/child task relationships (for playlist downloads) to handle partial failures gracefully.
     *   **Success Criteria:** Tasks can have a parent-child relationship, allowing for aggregated status and error handling. The `background_tasks` table should have a `parent_id` column that references the `id` column. The parent task's status should reflect the aggregated status of its child tasks.
     *   **TDD Anchor:** `tests/backend/test_task_management.py::TestTaskManagement::test_parent_child_tasks`
*   **FR.4.1.4:** On application startup, the service shall read this table to resume the state of any unfinished tasks, ensuring no progress is lost if the app is closed.
     *   **Success Criteria:** Unfinished tasks are resumed on application startup. The tasks should have the same `task_type`, `title`, `status`, and `progress` as before the application was closed.
     *   **TDD Anchor:** `tests/backend/test_task_management.py::TestTaskManagement::test_resume_unfinished_tasks`

### Story 4.2: Integrate Core Services with Task Manager

*   **Description:** Core services must report their status to the Task Management service.
*   **FR.4.2.1:** Playlist imports and downloads shall create a "parent" task in the `background_tasks` table.
     *   **Success Criteria:** Initiating a playlist import or download creates a parent task in the task management system. The task should have `task_type` as "playlist_import" or "playlist_download".
     *   **TDD Anchor:** `tests/integration/test_task_integration.py::TestTaskIntegration::test_playlist_creates_parent`
*   **FR.4.2.2:** The parent task's progress shall reflect the completion of its "child" video tasks.
     *   **Success Criteria:** The parent task's progress is updated based on the progress of its child tasks. The parent task's `progress` value should be equal to the average `progress` value of its child tasks.
     *   **TDD Anchor:** `tests/integration/test_task_integration.py::TestTaskIntegration::test_parent_progress_reflects_children`
*   **FR.4.2.3:** If some videos in a playlist download fail, the parent task shall be marked as "Completed with errors."
     *   **Success Criteria:** If some child tasks fail, the parent task is marked as "Completed with errors" and the `status` field is updated to "Completed with errors".
     *   **TDD Anchor:** `tests/integration/test_task_integration.py::TestTaskIntegration::test_parent_completed_with_errors`
*   **FR.4.2.4:** The download service shall update the task's progress and final status in the database via `BackgroundTaskService`.
     *   **Success Criteria:** The download service updates the task information in the database. The `progress` and `status` fields in the `background_tasks` table should be updated correctly.
     *   **TDD Anchor:** `tests/integration/test_download_integration.py::TestDownloadIntegration::test_download_updates_task`

### Story 4.3: Activity Center UI

*   **Description:** The application must display a persistent Activity Center widget.
*   **FR.4.3.1:** A persistent widget with `id="activity-center"` shall be displayed in the bottom-right corner of the application.
     *   **Success Criteria:** The Activity Center widget is visible in the bottom-right corner.
     *   **TDD Anchor:** `tests/acceptance/test_activity_center.py::TestActivityCenter::test_activity_center_widget_visible`
*   **FR.4.3.2:** The widget header with `id="activity-center-header"` shall show an active task count (e.g., "Active (2)") with `id="active-task-count"` and a minimize icon with `id="minimize-icon"`.
     *   **Success Criteria:** The widget header displays the number of active tasks and a minimize icon.
     *   **TDD Anchor:** `tests/acceptance/test_activity_center.py::TestActivityCenter::test_activity_center_header`
*   **FR.4.3.3:** The widget with `id="activity-center"` shall display a list of all `In Queue` and `In Progress` tasks with `class="activity-item"`.
     *   **Success Criteria:** The widget lists all tasks with "In Queue" and "In Progress" statuses.
     *   **TDD Anchor:** `tests/acceptance/test_activity_center.py::TestActivityCenter::test_activity_center_task_list`
*   **FR.4.3.4:** Each task item with `class="activity-item"` shall display its type with `id="task-type"` (e.g., Import, Download), thumbnail with `id="task-thumbnail"`, title with `id="task-title"`, a progress bar with `id="task-progress"`, and a status tag with `id="task-status"`.
     *   **Success Criteria:** Each task item displays all the required information.
     *   **TDD Anchor:** `tests/acceptance/test_activity_center.py::TestActivityCenter::test_activity_center_task_item`
*   **FR.4.3.5:** Each active task with `class="activity-item"` in the widget shall have a "Cancel" button with `id="cancel-task"` that stops the corresponding backend task within 2 seconds.
     *   **Success Criteria:** Each active task has a "Cancel" button that stops the backend task within 2 seconds. The task's `status` should be updated to "Cancelled".
     *   **TDD Anchor:** `tests/integration/test_activity_center.py::TestActivityCenter::test_activity_center_cancel_task`
*   **FR.4.3.6:** Progress updates from the backend shall be throttled to no more than 5 updates per second to keep the UI performant.
     *   **Success Criteria:** The UI updates no more than 5 times per second. The number of updates to the `progress` field with `id="task-progress"` should not exceed 5 per second, measured using performance monitoring tools.
     *   **TDD Anchor:** `tests/performance/test_activity_center.py::TestActivityCenter::test_activity_center_throttle`
*   **FR.4.3.7:** When a task with `class="activity-item"` is completed (successfully or failed), it shall remain visible with a final status with `id="task-status"` and a timestamp with `id="task-timestamp"` for 5 seconds, and then automatically fade out.
     *   **Success Criteria:** Completed tasks remain visible for 5 seconds before fading out.
     *   **TDD Anchor:** `tests/acceptance/test_activity_center.py::TestActivityCenter::test_activity_center_fade_out`
*   **FR.4.3.8:** A "Clear All" (trash can icon) button with `id="clear-all"` shall be present to manually remove all completed tasks with `class="activity-item"` from the view.
     *   **Success Criteria:** A "Clear All" button is present and removes all completed tasks from the view.
     *   **TDD Anchor:** `tests/acceptance/test_activity_center.py::TestActivityCenter::test_activity_center_clear_all`

## Epic 5: Playlist Health & Status Sync

### Story 5.1: Backend Health Check Service

*   **Description:** A backend service is needed to check if videos are still available on YouTube.
*   **FR.5.1.1:** The service shall iterate through the videos of a given playlist.
     *   **Success Criteria:** The service processes each video in a given playlist by calling the `checkVideoStatus()` method on each video.
     *   **TDD Anchor:** `tests/backend/test_health_check.py::TestHealthCheck::test_health_check_iterates_videos`
*   **FR.5.1.2:** For each video, it shall use a lightweight `yt-dlp` command to verify its current status on YouTube.
     *   **Success Criteria:** The service uses `yt-dlp` to check the video's status by calling the `yt-dlp` command with the video URL and parsing the output for availability information.
     *   **TDD Anchor:** `tests/backend/test_health_check.py::TestHealthCheck::test_health_check_uses_yt_dlp`
*   **FR.5.1.3:** It shall update the `availability_status` (e.g., 'AVAILABLE', 'UNAVAILABLE', 'PRIVATE') for the video in the local database within 1 second.
     *   **Success Criteria:** The service updates the `availability_status` field in the `videos` table in the local database within 1 second.
     *   **TDD Anchor:** `tests/backend/test_health_check.py::TestHealthCheck::test_health_check_updates_status`
*   **FR.5.1.4:** The service shall process videos in a low-concurrency queue (e.g., one or two at a time) to avoid sending a burst of requests that could lead to IP rate-limiting.
     *   **Success Criteria:** The service processes videos with a concurrency of 1 or 2. This can be verified by monitoring the number of concurrent calls to the `yt-dlp` command.
     *   **TDD Anchor:** `tests/backend/test_health_check.py::TestHealthCheck::test_health_check_concurrency`

### Story 5.2: Display Video Health Status in UI

*   **Description:** The UI must display the health status of each video.
*   **FR.5.2.1:** In the video list item component with `class="video-item"`, a colored dot with `id="video-status"` shall be displayed based on the video's `availability_status` from the database.
     *   **Success Criteria:** A colored dot is displayed based on the video's status.
     *   **TDD Anchor:** `tests/acceptance/test_playlist_flows.py::TestPlaylistFlows::test_video_status_dot`
*   **FR.5.2.2:** The colors of the dot with `id="video-status"` shall be: Green for 'AVAILABLE', Yellow for 'PRIVATE', and Red for 'UNAVAILABLE'.
     *   **Success Criteria:** The dot's color matches the status: Green for 'AVAILABLE', Yellow for 'PRIVATE', and Red for 'UNAVAILABLE'.
     *   **TDD Anchor:** `tests/acceptance/test_playlist_flows.py::TestPlaylistFlows::test_video_status_dot_color`
*   **FR.5.2.3:** A tooltip with `id="status-tooltip"` on the dot with `id="video-status"` shall explain the status on hover (e.g., "Status: Available").
     *   **Success Criteria:** Hovering over the dot displays a tooltip explaining the status.
     *   **TDD Anchor:** `tests/acceptance/test_playlist_flows.py::TestPlaylistFlows::test_video_status_dot_tooltip`
*   **FR.5.2.4:** The playlist view header shall display a "Status last checked: [timestamp]" (e.g., "3 hours ago") message with `id="last-checked"`.
     *   **Success Criteria:** The header displays a "Status last checked" message with a timestamp.
     *   **TDD Anchor:** `tests/acceptance/test_playlist_flows.py::TestPlaylistFlows::test_playlist_last_checked`

### Story 5.3: Implement Auto-Sync Settings UI

*   **Description:** The application must allow users to configure auto-sync settings.
*   **FR.5.3.1:** A dedicated "Auto-Sync Settings" section with `id="auto-sync-settings"` shall be created on the Settings page.
     *   **Success Criteria:** A section labeled "Auto-Sync Settings" exists on the Settings page.
     *   **TDD Anchor:** `tests/acceptance/test_settings.py::TestSettings::test_auto_sync_settings_section`
*   **FR.5.3.2:** The UI shall provide controls (e.g., radio buttons with `class="sync-frequency"`) to select the frequency (e.g., Hourly, Daily, Weekly, Never).
     *   **Success Criteria:** Radio buttons exist for selecting the sync frequency.
     *   **TDD Anchor:** `tests/acceptance/test_settings.py::TestSettings::test_auto_sync_settings_frequency`
*   **FR.5.3.3:** The "Daily" option with `id="sync-frequency-daily"` shall be selected by default.
     *   **Success Criteria:** The "Daily" option is selected by default.
     *   **TDD Anchor:** `tests/acceptance/test_settings.py::TestSettings::test_auto_sync_settings_default`
*   **FR.5.3.4:** A note with `id="sync-frequency-note"` explaining the resource usage trade-off shall be present (e.g., "More frequent syncing provides the most up-to-date status but uses more system resources.").
     *   **Success Criteria:** A note explaining the resource usage is present.
     *   **TDD Anchor:** `tests/acceptance/test_settings.py::TestSettings::test_auto_sync_settings_note`

### Story 5.4: Scheduled Background Sync

*   **Description:** The application must automatically run the Health Check Service based on user settings.
*   **FR.5.4.1:** The scheduler shall read the user's sync frequency from settings to determine its interval.
     *   **Success Criteria:** The scheduler reads the auto-sync frequency from settings by calling the `getSyncFrequency()` method.
     *   **TDD Anchor:** `tests/backend/test_health_check.py::TestHealthCheck::test_health_check_reads_settings`
*   **FR.5.4.2:** **The scheduler will not initiate a new health check if the background task queue is actively processing tasks (i.e., `queue.size > 0` or `queue.pending > 0`). It will skip the current cycle and attempt to run again at its next scheduled interval.**
    *   **Success Criteria:** When the scheduler's interval triggers, it first checks the background task queue. If `queue.size > 0` or `queue.pending > 0`, the health check is skipped. This can be verified by instrumenting the scheduler to log skipped cycles.
     *   **TDD Anchor:** `tests/integration/test_health_check.py::TestHealthCheck::test_health_check_pauses_on_user_task`

### Story 5.5: Manual Playlist Refresh

*   **Description:** The application must allow users to manually refresh a playlist's status.
*   **FR.5.5.1:** The context menu for any imported YouTube playlist with `class="playlist-item"` shall have a "Refresh Status Now" button with `id="refresh-status"`.
     *   **Success Criteria:** A "Refresh Status Now" button exists in the context menu.
     *   **TDD Anchor:** `tests/acceptance/test_playlist_flows.py::TestPlaylistFlows::test_playlist_refresh_button`
*   **FR.5.5.2:** Clicking the button with `id="refresh-status"` shall trigger the `HealthCheckService` for that single playlist.
     *   **Success Criteria:** Clicking the button triggers the `HealthCheckService` for that playlist. The `HealthCheckService` should be called with the playlist ID as a parameter.
     *   **TDD Anchor:** `tests/integration/test_health_check.py::TestHealthCheck::test_playlist_refresh_triggers_health_check`
*   **FR.5.5.3:** The UI shall provide immediate feedback that a check is in progress for that specific playlist (e.g., a spinning icon with `id="refreshing-icon"` next to the "Last checked" timestamp with `id="last-checked"`).
     *   **Success Criteria:** A spinning icon is displayed while the health check is in progress.
     *   **TDD Anchor:** `tests/acceptance/test_playlist_flows.py::TestPlaylistFlows::test_playlist_refresh_feedback`

(The rest of the specification documents will be created in subsequent steps.)