# Practical Applications for the Playlistify Project

*This document translates the key research insights into specific, practical applications and recommendations for the development of the "Playlistify" task management service.*

### 1. Database Configuration (`BackgroundTaskService.ts`)

*   **Action:** Immediately upon initializing the `better-sqlite3` database connection, the following PRAGMA commands must be executed in order:
    1.  `PRAGMA journal_mode = WAL;` - To ensure concurrent read/write access.
    2.  `PRAGMA synchronous = NORMAL;` - To improve write throughput with an acceptable trade-off for this application type.
*   **Action:** The `better-sqlite3` connection must be configured with a `timeout` of at least `5000` milliseconds to gracefully handle temporary database locks.
*   **Action:** All write operations (e.g., creating a task, updating a status) performed by the service must be wrapped in `IMMEDIATE` transactions (e.g., `db.transaction(...).immediate(...)`) to prevent `SQLITE_BUSY` errors between concurrent workers.

### 2. Task Schema (`/schema/database_schema.sql`)

*   **Action:** The `tasks` table schema must include all the recommended columns from Finding 1.5, including `id`, `type`, `status`, `parentId`, `progress`, `details` (as JSON), `error`, and relevant timestamps.
*   **Action:** Create indexes on the `status`, `type`, and `parentId` columns to ensure efficient querying.
*   **Action:** Create a separate `processed_task_ids` table with columns `task_id` (PRIMARY KEY) and `created_at` to support idempotent task execution.

### 3. Service Logic (`BackgroundTaskService.ts`)

*   **Action:** Implement a `recoverInterruptedTasks()` function that is called once on application startup. This function will query for all tasks with `status = 'RUNNING'` and update them to `status = 'QUEUED'`.
*   **Action:** All task execution logic must be wrapped in an idempotency check. Before running a task's core logic, the service must first check if the `task_id` exists in the `processed_task_ids` table.
*   **Action:** Upon successful completion of a task, its `id` must be added to the `processed_task_ids` table within the same transaction that marks the task as `COMPLETED`.
*   **Action:** Implement a `cleanupIdempotencyKeys()` function that runs periodically (e.g., once a day) to delete records from `processed_task_ids` older than a safe threshold (e.g., 30 days).

### 4. Dependency Management Logic

*   **Action:** When creating a task that depends on another, the service must first load the dependency graph into memory and perform a Depth-First Search (DFS) to check for cycles. The new dependency should only be committed to the database if the check passes.

### 5. IPC and UI Communication (`ipc-contract.ts`, `ActivityCenter.tsx`)

*   **Action:** Adhere strictly to the unidirectional data flow pattern. The `BackgroundTaskService` will be the single source of truth.
*   **Action:** Whenever a task is created, or its status/progress is updated in the database, the service must emit an IPC event (e.g., `task:updated`) with the updated task data.
*   **Action:** The UI (e.g., the Activity Center) must listen for this `task:updated` event and update its local, in-memory cache, which will trigger a re-render. The UI should not poll the backend for updates.