### **Implementation Plan with Subtasks**

### **Sprint 1: Foundation & Core Viewing**

**Goal:** To establish the application's foundational shell and core viewing functionality.

* **1.1: Main Application Layout**
    * `[x]` Create a `MainLayout.tsx` component that defines the primary application structure (e.g., sidebar and main content areas).
    * `[x]` Create a `Sidebar.tsx` component with navigation links for Dashboard, Playlists, History, Downloads, and Settings, each with an appropriate icon.
    * `[x]` Create a `TopNavbar.tsx` component with placeholders for the `+ Add` button and user avatar.
    * `[x]` Integrate the Sidebar and TopNavbar components into the `MainLayout.tsx`.
    * `[x]` Configure the application's router to use this `MainLayout` for all primary views.

* **1.2: Build Dashboard UI Structure**
    * `[ ]` Create the `Dashboard.tsx` page component.
    * `[ ]` Implement the layout for the dashboard to define widget areas.
    * `[ ]` Create a `RecentPlaylistsWidget.tsx` component with a title and "View all" link.
    * `[ ]` Implement the empty state UI for the `RecentPlaylistsWidget`.
    * `[ ]` Create a `ContinueWatchingWidget.tsx` component with a title and "View history" link.
    * `[ ]` Implement the empty state UI for the `ContinueWatchingWidget`.
    * `[ ]` Integrate both widget components into the `Dashboard.tsx` page.

* **1.3: Import Public Playlist**
    * `[ ]` Add the "Add Playlist" item to the `+ Add` dropdown menu, which opens the unified `AddPlaylistDialog`.
    * `[ ]` Implement the URL input field UI, including the clear ('x') button on the "Add from YouTube" tab.
    * `[ ]` Create an IPC handler (`playlist:get-preview`) to fetch preview metadata from a URL.
    * `[ ]` Call the preview IPC handler from the dialog and display the returned preview data.
    * `[ ]` Implement the "Import" button to call the main `playlist:import` IPC handler and pass the task to the Activity Center.

* **1.4: View Playlist Details**
    * `[ ]` Create a `PlaylistDetailsView.tsx` component for the main content area.
    * `[ ]` Implement the logic for the component to receive a playlist ID when a playlist is selected.
    * `[ ]` Use a `useQuery` hook to call the `playlist:get-details` IPC handler with the ID.
    * `[ ]` Implement the UI for the playlist header.
    * `[ ]` Create a `VideoListItem.tsx` component to display a single video's information.
    * `[ ]` Map over the fetched data in `PlaylistDetailsView.tsx` and render the `VideoListItem` components.
    * `[ ]` Implement loading and empty state UIs.

* **1.5: Search within Playlist**
    * `[ ]` Add a search input field UI component to `PlaylistDetailsView.tsx`.
    * `[ ]` Create a local state to hold the search query text.
    * `[ ]` Implement client-side logic to filter the video list based on the search query.
    * `[ ]` Add a debounce to the search input to improve performance.

* **1.6: Infinite Scroll for Video Lists**
    * `[ ]` Choose and install a library for list virtualization (e.g., `@tanstack/react-virtual`).
    * `[ ]` Refactor the video list rendering logic in `PlaylistDetailsView.tsx` to use the chosen virtualization library.
    * `[ ]` Test the implementation with a large dataset (e.g., 1000+ items) to ensure performance.

---

### **Sprint 2: Custom Playlist Management**

**Goal:** To deliver the complete feature set for creating and curating personal, local playlists.

* **2.1: Add New Playlist (Custom or from YouTube)**
    * `[ ]` Update the `+ Add` dropdown menu to have a single "Add Playlist" item.
    * `[ ]` Create the main `AddPlaylistDialog.tsx` component with a tabbed interface.
    * `[ ]` Build the form for the "Custom Playlist" tab, ensuring the button is labeled "Create Playlist" and character counters are implemented.
    * `[ ]` Implement the logic for the "Create Playlist" button on this tab to call the appropriate IPC handler, including the check for duplicate titles.
    * `[ ]` Build the UI and logic for the "Add from YouTube" tab, reusing the components and logic from Epic 1.

* **2.2: Add Videos to a Custom Playlist**
    * `[ ]` Implement the "Add to Playlist" option in the video context menu.
    * `[ ]` Create the UI to display the list of available custom playlists.
    * `[ ]` Implement the backend logic to add the video-to-playlist association, including the check to prevent duplicates.
    * `[ ]` Implement the success notification toast.

* **2.3: Remove Videos from a Custom Playlist**
    * `[ ]` Implement the "Remove from Playlist" option in the video context menu.
    * `[ ]` Create the confirmation dialog component with the specified clarifying text.
    * `[ ]` On confirmation, implement the backend logic to remove the video-to-playlist association in the database.

* **2.4: Edit Custom Playlist Details**
    * `[ ]` Implement the "Edit Details" option in the custom playlist context menu.
    * `[ ]` Create a dialog for editing, pre-populating the fields with existing data.
    * `[ ]` On save, implement the backend logic to update the playlist's details in the database, including the check for duplicate titles.

* **2.5: Delete a Custom Playlist**
    * `[ ]` Implement the "Delete Playlist" option in the custom playlist context menu.
    * `[ ]` Create the confirmation dialog with the specified warning text.
    * `[ ]` On confirmation, implement the backend logic to remove the playlist and all its video associations from the database, including the check to stop active playback.

---

### **Sprint 3: Core Backend Systems & Downloading**

**Goal:** To build the critical backend infrastructure for background tasks and the core download engine.

* **4.1: Persistent Backend Task Management Service**
    * `[ ]` Add a `background_tasks` table to the `schema.sql` file.
    * `[ ]` Create a backend service that can add, update, and remove tasks from the database.
    * `[ ]` Implement logic for parent/child task relationships.
    * `[ ]` Create IPC handlers for the frontend to get the current list of tasks and receive real-time updates.

* **4.2: Integrate Core Services with Task Manager**
    * `[ ]` Modify the playlist import and download services to create parent/child tasks in the Task Manager.
    * `[ ]` Modify the download service to report progress and status updates (e.g., In Queue, Downloading, Completed, Failed) to the Task Manager.

* **3.1: Implement Intelligent Quality Detection Service**
    * `[ ]` Create a backend service that uses `yt-dlp` to fetch available formats.
    * `[ ]` Implement logic to parse and clean the format list into a user-friendly set of qualities.
    * `[ ]` Create the IPC handler for the frontend to request these quality options.

* **3.2: Download a Single Video**
    * `[ ]` Create the `DownloadVideoDialog.tsx` component.
    * `[ ]` Update the dialog to call the quality detection service and populate the quality options dynamically.
    * `[ ]` Implement the "Select Location" UI and logic.
    * `[ ]` Implement the backend logic for thumbnail embedding, filename sanitization, and the pre-download disk space check.
    * `[ ]` Ensure the configured download task is sent to the Activity Center.

* **3.3: Download an Entire Playlist**
    * `[ ]` Create the `DownloadPlaylistDialog.tsx` component.
    * `[ ]` Implement the smart quality fallback logic in the backend download service.
    * `[ ]` Ensure the backend service saves all videos from the batch into a subfolder named after the playlist within the selected location.
    * `[ ]` Ensure thumbnail embedding and filename sanitization work for batch downloads.

---

### **Sprint 4: UI for Backend Systems & Playback**

**Goal:** To build the user-facing interfaces for the backend systems and enable offline playback.

* **4.3: Activity Center UI**
    * `[ ]` Create the `ActivityCenter.tsx` widget component.
    * `[ ]` Style it to be a persistent overlay in the bottom-right corner.
    * `[ ]` Implement the real-time connection to the backend Task Manager.
    * `[ ]` Create a `TaskItem.tsx` component with the specified detailed layout.
    * `[ ]` Implement the UI to display the list of tasks with progress bars and "Cancel" buttons.
    * `[ ]` Implement the "Clear All" and "Minimize" functionality.
    * `[ ]` Add the logic for the "fade out on completion" behavior.

* **3.4: View Downloads Page**
    * `[ ]` Create the `Downloads.tsx` page component.
    * `[ ]` The page should get real-time download status information from the backend task management service.
    * `[ ]` Implement the UI to display the list of downloads with their status and progress.
    * `[ ]` Implement the "Retry" button functionality for failed downloads.

* **3.5: Basic Offline Playback**
    * `[ ]` Create a `VideoPlayer.tsx` component.
    * `[ ]` Implement the pre-playback check for file existence.
    * `[ ]` Implement the core playback logic for local files.
    * `[ ]` Implement the full set of basic UI controls (play/pause, volume, seek/buffer bar, loop, subtitle menu).
    * `[ ]` Add logic to detect and load any associated subtitle files for the video.

---

### **Sprint 5: Playlist Health & Automation**

**Goal:** To implement the automated system for keeping playlist statuses up-to-date.

* **5.1: Backend Health Check Service**
    * `[ ]` Create a `HealthCheckService.ts` in the backend.
    * `[ ]` Implement the function that iterates through a playlist's videos.
    * `[ ]` Integrate `p-queue` or a similar library to process the checks in a low-concurrency queue.
    * `[ ]` Implement the logic to call `yt-dlp` for status verification.
    * `[ ]` Implement the database update logic.

* **5.2: Display Video Health Status in UI**
    * `[ ]` In the `VideoListItem.tsx` component, add the colored status dot.
    * `[ ]` Implement the logic to map the database status to the correct color.
    * `[ ]` Implement the tooltip component for the status dot.
    * `[ ]` Add the "Last checked" text component to the `PlaylistDetailsView.tsx` header.

* **5.3: Implement Auto-Sync Settings UI**
    * `[ ]` Build the "Auto-Sync Settings" UI section on the `Settings.tsx` page.
    * `[ ]` Implement the UI controls for selecting the frequency.
    * `[ ]` Implement the logic to save the chosen setting using `electron-store`.

* **5.4: Scheduled Background Sync**
    * `[ ]` In the backend, create a scheduler using a reliable method (e.g., `setInterval` on app startup).
    * `[ ]` Implement the logic for the scheduler to read the user's setting.
    * `[ ]` Implement the check to pause/resume the scheduler based on the status of the main task queue.
    * `[ ]` At each interval, the scheduler should trigger the `HealthCheckService` for all relevant playlists.

* **5.5: Manual Playlist Refresh**
    * `[ ]` Add the "Refresh Status Now" button to the playlist context menu.
    * `[ ]` Implement the IPC handler to trigger a one-time health check for a specific playlist ID.
    * `[ ]` Implement the UI feedback to show that a manual refresh is in progress.