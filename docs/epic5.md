### **Epic 5: Playlist Health & Status Sync**

**Goal:** Introduce a robust, automated status-checking system for imported playlists, with user-configurable settings, to keep users informed about video availability.

---

#### **Story 5.1: Backend Health Check Service**

**As a developer,** I need a backend service that can check an imported playlist against YouTube to see if any videos have been deleted or privated.

* **Acceptance Criteria:**
    * The service must iterate through the videos of a given playlist.
    * For each video, it must use a lightweight `yt-dlp` command to verify its current status on YouTube.
    * It must update the `availability_status` (e.g., 'Live', 'Deleted', 'Private') for the video in the local database.
    * Crucially, the service must process videos in a **low-concurrency queue** (e.g., one or two at a time) to avoid sending a burst of requests that could lead to IP rate-limiting.
* **Subtasks:**
    * `[ ]` Create a `HealthCheckService.ts` in the backend.
    * `[ ]` Implement the function that iterates through a playlist's videos.
    * `[ ]` Integrate `p-queue` or a similar library to process the checks in a low-concurrency queue.
    * `[ ]` Implement the logic to call `yt-dlp` for status verification.
    * `[ ]` Implement the database update logic.

---

#### **Story 5.2: Display Video Health Status in UI**

**As a user,** I want to see a colored dot next to each video in an imported playlist so I know if it's still available on YouTube and when that status was last checked.

* **Acceptance Criteria:**
    * In the video list item component, a colored dot must be displayed based on the video's `availability_status` from the database.
    * The colors will be: Green for 'Live', Yellow for 'Unlisted/Private', and Red for 'Deleted'.
    * A tooltip on the dot must explain the status on hover (e.g., "Status: Live").
    * To provide context, the playlist view header must display a "Status last checked: \[timestamp\]" (e.g., "3 hours ago") message.
* **Subtasks:**
    * `[ ]` In the `VideoListItem.tsx` component, add the colored status dot.
    * `[ ]` Implement the logic to map the database status to the correct color.
    * `[ ]` Implement the tooltip component for the status dot.
    * `[ ]` Add the "Last checked" text component to the `PlaylistDetailsView.tsx` header.

---

#### **Story 5.3: Implement Auto-Sync Settings UI**

**As a user,** I want to configure how often my playlists are automatically checked for status updates.

* **Acceptance Criteria:**
    * A dedicated "Auto-Sync Settings" section must be created on the Settings page.
    * The UI must provide controls (e.g., radio buttons) to select the frequency (e.g., Hourly, Daily, Weekly, Never).
    * "Daily" will be the default setting.
    * A note explaining the resource usage trade-off must be present (e.g., "More frequent syncing provides the most up-to-date status but uses more system resources.").
* **Subtasks:**
    * `[ ]` Build the "Auto-Sync Settings" UI section on the `Settings.tsx` page.
    * `[ ]` Implement the UI controls for selecting the frequency.
    * `[ ]` Implement the logic to save the chosen setting using `electron-store`.

---

#### **Story 5.4: Scheduled Background Sync**

**As a developer,** I need a scheduler that automatically and safely runs the Health Check Service on all imported playlists based on the user's chosen frequency.

* **Acceptance Criteria:**
    * The scheduler must read the user's sync frequency from settings to determine its interval.
    * The scheduler must **pause** if a user-initiated task (like a new import or download) is active, to prioritize the user's actions. It will resume after the user's tasks are complete.
* **Subtasks:**
    * `[ ]` In the backend, create a scheduler using a reliable method (e.g., `setInterval` on app startup).
    * `[ ]` Implement the logic for the scheduler to read the user's setting.
    * `[ ]` Implement the check to pause/resume the scheduler based on the status of the main task queue.
    * `[ ]` At each interval, the scheduler should trigger the `HealthCheckService` for all relevant playlists.

---

#### **Story 5.5: Manual Playlist Refresh**

**As a user,** I want a button to manually trigger a health check on a specific playlist so I can get its up-to-the-minute status on demand.

* **Acceptance Criteria:**
    * The context menu for any imported YouTube playlist must have a "Refresh Status Now" button.
    * Clicking the button must trigger the `HealthCheckService` for that single playlist.
    * The UI should provide immediate feedback that a check is in progress for that specific playlist (e.g., a spinning icon next to the "Last checked" timestamp).
* **Subtasks:**
    * `[ ]` Add the "Refresh Status Now" button to the playlist context menu.
    * `[ ]` Implement the IPC handler to trigger a one-time health check for a specific playlist ID.
    * `[ ]` Implement the UI feedback to show that a manual refresh is in progress.