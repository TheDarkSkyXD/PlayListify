### **Epic 2: Custom Playlist Management**

**Goal:** Empower users to create, populate, and manage their own local playlists from scratch.

---

#### **Story 2.1: Add New Playlist (Custom or from YouTube)**

**As a user,** I want to select 'Add Playlist' from the main menu and then choose whether to create a new custom playlist or import one from a YouTube URL within a single dialog.

* **Acceptance Criteria:**
    * The `+ Add` dropdown menu must contain a single option: "Add Playlist".
    * Clicking this opens a dialog titled "Add Playlist" with two tabs: "Custom Playlist" and "Add from YouTube".
    * The "Custom Playlist" tab must have fields for Title and Description and a "Create Playlist" button.
    * The Title field must enforce a 100-character limit and the Description field must enforce a 512-character limit. Both should display a character counter (e.g., `25/100`).
    * If a user tries to create a playlist with a title that already exists, an error message must be displayed, and the playlist will not be created.
    * The "Add from YouTube" tab must contain the full preview-and-import flow defined in Epic 1.
* **Subtasks:**
    * `[ ]` Update the `+ Add` dropdown menu to have a single "Add Playlist" item.
    * `[ ]` Create the main `AddPlaylistDialog.tsx` component with a tabbed interface.
    * `[ ]` Build the form for the "Custom Playlist" tab, ensuring the button is labeled "Create Playlist" and character counters are implemented.
    * `[ ]` Implement the logic for the "Create Playlist" button on this tab to call the appropriate IPC handler, including the check for duplicate titles.
    * `[ ]` Build the UI and logic for the "Add from YouTube" tab, reusing the components and logic from Epic 1.

---

#### **Story 2.2: Add Videos to a Custom Playlist**

**As a user,** I want to add a video from an existing playlist to one of my custom playlists so I can organize content according to my own themes.

* **Acceptance Criteria:**
    * A context menu on any video item must provide an "Add to Playlist" option.
    * This option must open a submenu or dialog listing all the user's custom playlists.
    * If a user attempts to add a video to a custom playlist that already contains that video, no duplicate entry will be created. A brief, non-blocking notification (e.g., "Video is already in this playlist") should be shown.
    * Selecting a playlist correctly adds the video to it and provides a success notification (e.g., "Video added to 'My Favorites'").
* **Subtasks:**
    * `[ ]` Implement the "Add to Playlist" option in the video context menu.
    * `[ ]` Create the UI to display the list of available custom playlists.
    * `[ ]` Implement the backend logic to add the video-to-playlist association, including the check to prevent duplicates.
    * `[ ]` Implement the success notification toast.

---

#### **Story 2.3: Remove Videos from a Custom Playlist**

**As a user,** I want to remove a video from one of my custom playlists to keep it organized and relevant.

* **Acceptance Criteria:**
    * A context menu on any video item *within a custom playlist* must provide a "Remove from Playlist" option.
    * A confirmation dialog must be displayed before removing the video.
    * The confirmation dialog must clearly state that the action only removes the video from the current playlist and does not delete the video from the library or from other playlists. (e.g., "This will only remove the video from the '[Playlist Name]' playlist. It will not be deleted from your library.")
* **Subtasks:**
    * `[ ]` Implement the "Remove from Playlist" option in the video context menu.
    * `[ ]` Create the confirmation dialog component with the specified clarifying text.
    * `[ ]` On confirmation, implement the backend logic to remove the video-to-playlist association in the database.

---

#### **Story 2.4: Edit Custom Playlist Details**

**As a user,** I want to be able to change the title and description of my custom playlists after I've created them.

* **Acceptance Criteria:**
    * A context menu on any custom playlist must provide an "Edit Details" option.
    * This opens a dialog pre-filled with the current title and description.
    * The system must prevent renaming a playlist to a title that already exists, showing an error if attempted.
* **Subtasks:**
    * `[ ]` Implement the "Edit Details" option in the custom playlist context menu.
    * `[ ]` Create a dialog for editing, pre-populating the fields with existing data.
    * `[ ]` On save, implement the backend logic to update the playlist's details in the database, including the check for duplicate titles.

---

#### **Story 2.5: Delete a Custom Playlist**

**As a user,** I want to delete an entire custom playlist that I no longer need.

* **Acceptance Criteria:**
    * A context menu on any custom playlist must provide a "Delete Playlist" option.
    * A confirmation dialog must be displayed, clearly stating that the action is permanent (e.g., "Are you sure? This will permanently delete the playlist 'My Awesome Mix'. This cannot be undone.").
    * If a video from the playlist is currently playing, confirming the deletion must first stop the video playback before deleting the playlist.
* **Subtasks:**
    * `[ ]` Implement the "Delete Playlist" option in the custom playlist context menu.
    * `[ ]` Create the confirmation dialog with the specified warning text.
    * `[ ]` On confirmation, implement the backend logic to remove the playlist and all its video associations from the database, including the check to stop active playback.