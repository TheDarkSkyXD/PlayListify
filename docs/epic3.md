### **Epic 3: Core Downloading & Offline Playback**

**Goal:** Implement a robust and intelligent archiving system, allowing users to download videos with smart quality selection and watch them offline.

---

#### **Story 3.1: Implement Intelligent Quality Detection Service**

**As a developer,** I need a backend service that can analyze a YouTube video or playlist URL and determine the specific quality options available for download.

* **Acceptance Criteria:**
    * The service must use `yt-dlp` to fetch a list of all available formats for a given URL.
    * The service must parse this list and return a clean set of available qualities (e.g., '720p', '1080p', '4K').
    * The service must be exposed via an IPC handler that the frontend can call.
* **Subtasks:**
    * `[ ]` Create a backend service that uses `yt-dlp` to fetch available formats.
    * `[ ]` Implement logic to parse and clean the format list into a user-friendly set of qualities.
    * `[ ]` Create the IPC handler for the frontend to request these quality options.

---

#### **Story 3.2: Download a Single Video**

**As a user,** I want to download a single video from a playlist or URL with full control over the options, so I can save specific content to my library.

* **Acceptance Criteria:**
    * The "Download" option in a video's context menu or the "Download Video" option in the `+ Add` menu will open the "Download Video" dialog.
    * The dialog must allow format selection (MP4/MP3) and dynamically populate the quality dropdown based on the available qualities for that specific video.
    * All downloaded videos must be converted to a standard MP4 (H.264/AAC) format to ensure playback compatibility.
    * All downloaded video files must have their YouTube thumbnail embedded.
    * Video titles must be sanitized to remove characters that are invalid for filenames.
    * The dialog must display the default download path and provide a button for the user to select a different location.
    * Before the download starts, the system must check for sufficient disk space and show an error if there is not enough.
* **Subtasks:**
    * `[ ]` Create the `DownloadVideoDialog.tsx` component.
    * `[ ]` Update the dialog to call the quality detection service and populate the quality options dynamically.
    * `[ ]` Implement the "Select Location" UI and logic.
    * `[ ]` Implement the backend logic for thumbnail embedding, filename sanitization, and the pre-download disk space check.
    * `[ ]` Ensure the configured download task is sent to the Activity Center.

---

#### **Story 3.3: Download an Entire Playlist**

**As a user,** I want to download all videos from a playlist with a single action, and for any video that doesn't have my selected quality, I want the app to automatically download the best available quality instead.

* **Acceptance Criteria:**
    * A "Download Playlist" button on the playlist details view will open the download dialog.
    * The dialog will allow the user to select format, quality, and save location for the entire batch.
    * If a specific video is not available in the user's chosen quality, the system must automatically download the next highest quality available for that video (smart quality fallback).
    * Each successfully downloaded video must have its thumbnail embedded and its filename sanitized.
* **Subtasks:**
    * `[ ]` Create the `DownloadPlaylistDialog.tsx` component.
    * `[ ]` Implement the smart quality fallback logic in the backend download service.
    * `[ ]` Ensure the backend service saves all videos from the batch into a subfolder named after the playlist within the selected location.
    * `[ ]` Ensure thumbnail embedding and filename sanitization work for batch downloads.

---

#### **Story 3.4: View Downloads Page**

**As a user,** I want to see a dedicated "Downloads" page that lists all my queued, in-progress, and completed downloads so I can track their status and retry failed downloads.

* **Acceptance Criteria:**
    * The page must display a list of all downloads with their title, status (e.g., Queued, Downloading, Completed, Failed), and a progress bar.
    * Downloads marked as "Failed" must have a "Retry" button that re-queues the download from the beginning.
* **Subtasks:**
    * `[ ]` Create the `Downloads.tsx` page component.
    * `[ ]` The page should get real-time download status information from the backend task management service.
    * `[ ]` Implement the UI to display the list of downloads with their status and progress.
    * `[ ]` Implement the "Retry" button functionality for failed downloads.

---

#### **Story 3.5: Basic Offline Playback**

**As a user,** I want to click on a successfully downloaded video and have it play within the application so I don't need an external player.

* **Acceptance Criteria:**
    * When a downloaded video is clicked, the app must first verify that the local file still exists. If not, it will show a "File not found" message.
    * The player must correctly load and play the local MP4 video file.
    * The player controls must include buttons for play/pause, volume, a loop toggle, and a menu to select available subtitle tracks.
    * The player's seek bar must be fully functional and must visually indicate the buffered/loaded portion of the video.
* **Subtasks:**
    * `[ ]` Create a `VideoPlayer.tsx` component.
    * `[ ]` Implement the pre-playback check for file existence.
    * `[ ]` Implement the core playback logic for local files.
    * `[ ]` Implement the full set of basic UI controls (play/pause, volume, seek/buffer bar, loop, subtitle menu).
    * `[ ]` Add logic to detect and load any associated subtitle files for the video.
Of course. Here is the complete and detailed plan for Epic 3, incorporating all the solutions and refinements from our conversation to make it robust and user-friendly.

### **Epic 3: Core Downloading & Offline Playback**

**Goal:** Implement a robust and intelligent archiving system, allowing users to download videos with smart quality selection and watch them offline.

---

#### **Story 3.1: Implement Intelligent Quality Detection Service**

**As a developer,** I need a backend service that can analyze a YouTube video or playlist URL and determine the specific quality options available for download.

* **Acceptance Criteria:**
    * The service must use `yt-dlp` to fetch the list of all available formats for a given URL.
    * The service must parse this list and return a clean, ordered set of available qualities (e.g., '720p', '1080p', '4K', '8K').
* **Subtasks:**
    * `[ ]` Create a backend service that uses `yt-dlp` to fetch format lists.
    * `[ ]` Implement logic to parse and clean the format list into a user-friendly set of quality options.
    * `[ ]` Create an IPC handler that the frontend can call to get these quality options for a given URL.

---

#### **Story 3.2: Download a Single Video via URL**

**As a user,** I want to download a single video from a YouTube URL, with options to select format, quality, subtitles, and save location.

* **Acceptance Criteria:**
    * The `+ Add` menu will have a "Download Video" option that opens the "Download Video" dialog.
    * When a valid URL is pasted, the dialog must automatically fetch and display a video preview.
    * The dialog must display the default download path and provide a button for the user to change it.
    * The dialog must allow the user to select quality, format (MP4/MP3), and whether to "Include subtitles when available".
    * All downloads must be sanitized to have valid filenames and converted to a compatible format (MP4 H.264/AAC).
    * The downloaded video file must have its YouTube thumbnail embedded.
    * Before starting, the system must check for sufficient disk space and show an error if there is not enough.
    * The "Add to Download Queue" button sends the configured download task to the Activity Center.
* **Subtasks:**
    * `[ ]` Add the "Download Video" option to the `+ Add` menu.
    * `[ ]` Create the `DownloadVideoDialog.tsx` component.
    * `[ ]` Implement the auto-fetch and preview functionality.
    * `[ ]` Add UI controls for quality, format, subtitles, and the "Select Location" button.
    * `[ ]` Pass the selected location and options to the backend download service.
    * `[ ]` Implement the disk space check in the backend.
    * `[ ]` Implement filename sanitization and thumbnail embedding.

---

#### **Story 3.3: Download an Entire Playlist**

**As a user,** I want to download all videos from a playlist with a single action, choosing the format, quality, and save location for the batch.

* **Acceptance Criteria:**
    * A "Download Playlist" button will open a dialog with download options.
    * The dialog must display the default download path and provide a button for the user to change it.
    * The dialog must dynamically populate quality options based on the highest quality found within the playlist.
    * The system must use **smart quality fallback**: if a video is unavailable in the chosen quality, it must automatically download the next highest quality available for that specific video.
    * All successfully downloaded videos must have their thumbnails embedded.
* **Subtasks:**
    * `[ ]` Add a "Download Playlist" button to the playlist details view.
    * `[ ]` Create the `DownloadPlaylistDialog.tsx` component.
    * `[ ]` Add a "Select Location" UI element to the dialog.
    * `[ ]` Implement the smart quality fallback logic in the backend download service.
    * `[ ]` Ensure the backend service saves all videos into the selected folder.

---

#### **Story 3.4: View Downloads Page**

**As a user,** I want to see a dedicated "Downloads" page that lists all my queued, in-progress, and completed downloads so I can track their status.

* **Acceptance Criteria:**
    * The page must display a list of all downloads with their title, status, and progress bar.
    * Failed downloads must have a "Retry" button that restarts the download from the beginning.
* **Subtasks:**
    * `[ ]` Create the `Downloads.tsx` page component.
    * `[ ]` The page should get real-time download status information from the backend Task Management service.
    * `[ ]` Implement the UI to display the download list.
    * `[ ]` Implement the "Retry" button functionality for failed items.

---

#### **Story 3.5: Basic Offline Playback**

**As a user,** I want to click on a successfully downloaded video and have it play within the application with a full set of basic controls.

* **Acceptance Criteria:**
    * When clicking a downloaded video, the player must first verify the local file exists. If not, it will show a "File not found" message.
    * The player must correctly load and play the local video file.
    * The player controls must include buttons for play/pause, volume, a loop toggle, and a menu to select available subtitle tracks.
    * The player's seek bar must be fully functional and must visually indicate the buffered/loaded portion of the video.
* **Subtasks:**
    * `[ ]` Create a `VideoPlayer.tsx` component.
    * `[ ]` Implement the check to verify the file exists before attempting playback.
    * `[ ]` Implement the core playback logic for local files.
    * `[ ]` Implement the full set of basic UI controls (play/pause, volume, seek/buffer bar, loop, subtitle menu).
    * `[ ]` Add logic to detect and load any associated subtitle files for the video.