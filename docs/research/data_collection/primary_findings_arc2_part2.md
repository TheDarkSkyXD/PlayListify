# Arc 2: Primary Findings - Download Queue Management with `p-queue`

## Finding 2: Strategy for a Robust Download Queue

**Source(s):** npmjs.com (p-queue), GitHub (p-queue), Real Python, GeeksforGeeks

**Key Insight:** The `p-queue` library provides all the necessary features to implement a sophisticated, controllable, and efficient download manager. The core concepts to leverage are concurrency control, task prioritization, and queue lifecycle management.

**Paraphrased Summary:**
The download manager service in Playlistify will be built around a central `p-queue` instance. The following strategies will be implemented:

**1. Configurable Concurrency:**
*   **What:** The `concurrency` option in the `p-queue` constructor limits how many download tasks can run simultaneously.
*   **Implementation:** This value should not be hardcoded. It will be a user-configurable setting, managed by the `settingsService`, with a sensible default (e.g., 3). This allows users to balance download speed with their system's network and CPU resources.

**2. Task Prioritization:**
*   **What:** When adding a task to the queue using `.add()`, a `priority` can be assigned. Tasks with a higher priority number will be executed before tasks with a lower priority.
*   **Implementation:** Playlistify will use a simple priority scheme:
    *   **High Priority (e.g., `priority: 1`):** A single video download initiated directly by the user.
    *   **Normal Priority (e.g., `priority: 0`):** A playlist download initiated by the user.
    *   **Low Priority (e.g., `priority: -1`):** Background synchronization or metadata update tasks.
    This ensures that the application feels responsive to direct user actions.

**3. Queue Lifecycle Management:**
*   **What:** `p-queue` provides methods to control the execution of the entire queue.
*   **Implementation:** The download manager will expose functions that map directly to these `p-queue` methods:
    *   `pause()`: Calls `queue.pause()`. This will immediately pause the execution of new tasks.
    *   `resume()`: Calls `queue.start()`. This will resume the queue.
    *   `clear()`: Calls `queue.clear()`. This will remove all pending (not-yet-started) tasks from the queue.
    *   **Note:** Canceling an *in-progress* download is more complex and requires using an `AbortController` passed into the `yt-dlp-wrap` process, which can then be triggered to terminate the specific download task. The queue itself does not handle the cancellation of a running promise.

**4. State Persistence (Application Logic):**
*   **What:** `p-queue` itself does not handle persisting the queue state across application restarts.
*   **Implementation:** This is the responsibility of the application logic. Before adding a download task to `p-queue`, the application must first save the download item's metadata (URL, selected quality, output path, status: 'pending') to the SQLite database. On application startup, the download manager will query the database for any non-completed downloads and re-add them to the `p-queue` instance. This ensures that the download queue can be fully restored after a restart.