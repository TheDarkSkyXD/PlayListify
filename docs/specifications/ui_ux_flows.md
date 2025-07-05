# UI/UX Flows

This document describes the user interface and user experience flows for key tasks within the Playlistify application.

## 1. Unified Flow: Creating or Importing a Playlist

1.  **User is on any main screen:** The user can access the "+ Add" menu from the top navigation bar.
    *   **UI Element:** Top navigation bar
    *   **Description:** A horizontal bar at the top of the application window, containing the application logo, navigation links, and the "+ Add" button.
2.  **User clicks the "+ Add" button:** A dropdown menu appears with a single item.
    *   **UI Element:** "+ Add" button
    *   **Description:** A button with a "+" icon and the label "Add". When clicked, it triggers the display of a dropdown menu.
    *   **Menu Contents:** The dropdown menu contains only one option: "Add Playlist".
3.  **User selects "Add Playlist":** A dialog box appears, providing two methods for adding a playlist.
    *   **UI Element:** Dialog box
    *   **Description:** A modal window titled "Add Playlist" that appears on top of the main application window. It contains two tabs: "Create Custom Playlist" and "Import from YouTube URL".

### 1A. Flow: Creating a Custom Playlist

1.  **User is in the "Add Playlist" dialog and selects the "Create Custom Playlist" tab:** The dialog displays input fields for the playlist title and description.
    *   **Mockup:** The "Create Custom Playlist" tab has input fields for "Playlist Title" (single-line text input) and "Description" (multi-line text input), each with a character counter displayed below. The "Create Playlist" button, styled with a green background and white text, is located at the bottom-right corner of the dialog.
2.  **User enters a title and (optionally) a description:** The character counters update in real-time as the user types.
3.  **User clicks the "Create Playlist" button:**
    *   The application validates the input. If the title is a duplicate, an error message is displayed.
    *   If the input is valid, a new, empty playlist is created.
    *   The dialog closes.
    *   The new playlist appears in the sidebar navigation.

### 1B. Flow: Importing a Playlist from YouTube

1.  **User is in the "Add Playlist" dialog and selects the "Import from YouTube URL" tab:** The dialog displays an input field for a YouTube playlist URL.
    *   **Mockup:** The "Import from YouTube URL" tab features a prominent input field labeled "YouTube Playlist URL" with a placeholder text "https://www.youtube.com/playlist?list=...". Below the input field, there's an "Import" button, styled with a blue background and white text, aligned to the right.
2.  **User pastes a valid YouTube playlist URL into the input field:**
    *   The application automatically fetches playlist metadata (title, thumbnail, video count) and displays it as a preview within the dialog.
    *   An error message is displayed if the URL is invalid or the playlist cannot be accessed.
3.  **User clicks the "Import" button:**
    *   The dialog closes.
    *   A task is added to the Activity Center, displaying the playlist title and a "Queued" status.
    *   The task's status updates in real-time as the playlist is imported.
4.  **When the playlist import is complete:**
    *   The task in the Activity Center changes to "Completed" or "Completed with errors".
    *   A success notification is displayed briefly.
    *   The imported playlist appears in the sidebar navigation.

## 2. Downloading a Video (from within a Playlist)

1.  **User is viewing a playlist's details:** The user sees a list of videos in the playlist.
    *   **UI Element:** Playlist details view
    *   **Description:** A view that displays the details of a playlist, including a list of videos, playlist metadata, and controls for managing the playlist.
2.  **User right-clicks a video item to open its context menu and selects "Download":** A download options dialog appears.
    *   **UI Element:** Context Menu
    *   **Description:** A right-click menu on a video item that contains actions for that video, including "Download".
3.  **The user selects the desired quality, format, and subtitle options:** The dialog displays the default download location.
    *   **UI Element:** Download options dialog
    *   **Description:** A modal window that appears on top of the playlist details view. It contains options for selecting the download quality, format, and subtitle options.
    *   **Mockup:** The download options dialog includes dropdown menus for "Quality" (e.g., "1080p", "720p") and "Format" (options: "MP4", "MP3"). A checkbox labeled "Include Subtitles" is present. The default download location is displayed as a read-only text field. The "Download" button, styled with a blue background and white text, is positioned at the bottom-right corner.
4.  **User clicks the "Download" button:**
    *   The dialog closes.
    *   A task is added to the Activity Center, displaying the video title and a "Queued" status.
    *   The task's status updates in real-time as the video is downloaded.
5.  **When the download is complete:**
    *   The task in the Activity Center changes to "Completed" or "Failed".
    *   A success notification is displayed briefly.

## 3. Playing a Downloaded Video

1.  **User is viewing a playlist's details:** The user sees a list of videos in the playlist.
    *   **UI Element:** Playlist details view
    *   **Description:** A view that displays the details of a playlist, including a list of videos in the playlist, playlist metadata, and controls for managing the playlist.
2.  **The user clicks on a downloaded video item:**
    *   The application verifies that the local file exists. If not, a "File not found" message is displayed.
    *   If the file exists, the video player opens and begins playing the video.
3.  **The user interacts with the video player controls:** The user can play/pause, adjust the volume, seek, toggle loop, and select subtitle tracks.
    *   **UI Element:** Video player
    *   **Description:** A video player component that displays the video and provides controls for playback.
    *   **Mockup:** The video player displays the video in the center. Below the video, there are controls: a play/pause button (icon changes based on state), a volume slider, a seek bar with a current time and total time display, a loop toggle button, and a subtitle selection menu (if subtitles are available).

## 4. Managing Application Settings

1.  **User clicks on "Settings" in the Sidebar:** The Settings page is displayed.
    *   **UI Element:** Sidebar
    *   **Description:** A vertical navigation bar on the left side of the application window, containing links to different sections of the application, such as "Playlists", "Settings", and "Activity Center".
2.  **User navigates to "Auto-Sync Settings":** The auto-sync settings section is displayed.
    *   **UI Element:** Settings page
    *   **Description:** A page that displays the application settings, organized into sections such as "General", "Downloads", and "Auto-Sync".
3.  **User selects a sync frequency (Hourly, Daily, Weekly, Never):** The selected frequency is saved.
    *   **UI Element:** Auto-sync settings section
    *   **Description:** A section on the Settings page that displays the auto-sync settings, including options for selecting the sync frequency.
    *   **Mockup:** The auto-sync settings section would contain a dropdown menu for selecting the sync frequency, with options such as "Hourly", "Daily", "Weekly", and "Never".