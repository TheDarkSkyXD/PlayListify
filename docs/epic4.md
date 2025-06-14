### **Epic 4: Background Tasks & Activity Center**

**Goal:** Implement a robust and optimized system for handling long-running tasks in the background and provide a UI for users to monitor the status of imports and downloads.

---

#### **Story 4.1: Persistent Backend Task Management Service**

**As a developer,** I need a centralized, persistent service to manage the state and progress of all long-running background tasks.

* **Acceptance Criteria:**
    * A `background_tasks` table must be created in the SQLite database to store task information.
    * All new tasks (imports, downloads) must be saved as a record in this table.
    * The service must support parent/child task relationships (for playlist downloads) to handle partial failures gracefully.
    * On application startup, the service must read this table to resume the state of any unfinished tasks, ensuring no progress is lost if the app is closed.
* **Subtasks:**
    * `[ ]` Add a `background_tasks` table to the `schema.sql` file.
    * `[ ]` Create a backend service that can add, update, and remove tasks from the database.
    * `[ ]` Implement logic for parent/child task relationships.
    * `[ ]` Create IPC handlers for the frontend to get the current list of tasks and receive real-time updates.

---

#### **Story 4.2: Integrate Core Services with Task Manager**

**As a developer,** I need the import and download services to report their status to the new Task Management service to handle partial failures gracefully.

* **Acceptance Criteria:**
    * Playlist imports and downloads must create a "parent" task. The parent task's progress should reflect the completion of its "child" video tasks.
    * If some videos in a playlist download fail, the parent task should be marked as "Completed with errors."
    * The download service must update the task's progress and final status in the database.
* **Subtasks:**
    * `[ ]` Modify the playlist import and download services to create parent/child tasks in the Task Manager.
    * `[ ]` Modify the download service to report progress and status updates (e.g., In Queue, Downloading, Completed, Failed) to the Task Manager.

---

#### **Story 4.3: Activity Center UI**

**As a user,** I want to see a persistent widget in the corner of the screen that shows me my active tasks, which I can cancel or clear at any time.

* **Acceptance Criteria:**
    * A persistent widget must be displayed in the bottom-right corner of the application.
    * The widget header must show an active task count (e.g., "Active (2)") and a minimize icon.
    * The widget must display a list of all `In Queue` and `In Progress` tasks.
    * Each task item must display its type (e.g., Import, Download), thumbnail, title, a progress bar, and a status tag (e.g., `In Queue`, `Downloading`).
    * Each active task in the widget must have a "Cancel" button that stops the corresponding backend task.
    * To keep the UI performant, progress updates from the backend must be throttled (updated no more than a few times per second).
    * When a task is completed (successfully or failed), it should remain visible with a final status, a timestamp (e.g., "Completed 2m ago"), and then automatically fade out after a short delay.
    * A "Clear All" (trash can icon) button must be present to manually remove all completed tasks from the view.
* **Subtasks:**
    * `[ ]` Create the `ActivityCenter.tsx` widget component.
    * `[ ]` Style it to be a persistent overlay in the bottom-right corner.
    * `[ ]` Implement the real-time connection to the backend Task Manager.
    * `[ ]` Create a `TaskItem.tsx` component with the specified detailed layout.
    * `[ ]` Implement the UI to display the list of tasks with progress bars and "Cancel" buttons.
    * `[ ]` Implement the "Clear All" and "Minimize" functionality.
    * `[ ]` Add the logic for the "fade out on completion" behavior.