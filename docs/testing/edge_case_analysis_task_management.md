# Edge Case Analysis: Persistent Backend Task Management Service

**Document Version:** 1.0
**Date:** 2025-07-04
**Author:** Edge Case Synthesizer

---

## 1.0 Introduction

This document provides a detailed analysis of edge cases, failure conditions, and chaos engineering scenarios for the **Persistent Backend Task Management Service**. The analysis is based on a synthesis of the feature's functional requirements, user stories, high-level design, and existing test plan. The goal is to proactively identify potential weaknesses and define expected resilient behaviors to ensure the service is robust and reliable.

---

## 2.0 Edge Case Analysis

### 2.1 Data-related

*   **Scenario:** A task is created with a `null` or empty `title`.
    *   **Expected Behavior:** The `BackgroundTaskService` should reject the request with an `InvalidInputError`. The database schema for the `title` column should have a `NOT NULL` constraint to provide a secondary layer of defense. The operation should not result in a `null` or empty title being persisted.

*   **Scenario:** A task's `progress` is updated with a negative number or a value greater than 1.
    *   **Expected Behavior:** The service should clamp the value to the valid range [0.0, 1.0] or, preferably, reject the update with an `InvalidInputError`. This prevents data corruption and ensures progress calculations remain logical.

*   **Scenario:** `created_at` or `updated_at` timestamps are in an invalid format.
    *   **Expected Behavior:** The service should be solely responsible for generating these timestamps using a reliable method (e.g., `new Date().toISOString()`). The repository layer should not accept these values from clients. If invalid data is somehow manually inserted into the database, the service should handle the record gracefully upon loading, potentially marking it as `failed` and logging a data corruption error.

*   **Scenario:** A child task is created where `parent_id` points to a non-existent task.
    *   **Expected Behavior:** The database schema should enforce a foreign key constraint on `parent_id` referencing `background_tasks(id)`. This will cause the `INSERT` operation to fail at the database level. The `BackgroundTaskRepository` should catch this constraint violation and bubble it up as a specific `ParentTaskNotFoundError`.

*   **Scenario:** A circular dependency is created (e.g., Task A's `parent_id` is B, and Task B's `parent_id` is A).
    *   **Expected Behavior:** When an `update` operation sets a `parent_id`, the `BackgroundTaskService` must perform a validation check. It should traverse up the potential parent hierarchy to ensure the new parent is not a descendant of the current task. If a cycle is detected, the operation must be rejected with an `InvalidStateTransitionError` or a more specific `CircularDependencyError`.

### 2.2 State-related

*   **Scenario:** An `update` operation is received for a task that is already in a terminal state (`completed`, `failed`, `completed_with_errors`).
    *   **Expected Behavior:** The service's business logic should prevent any state or progress modifications to tasks that are already in a terminal state. It should throw an `InvalidStateTransitionError` to the caller.

*   **Scenario:** A `cancel` command is issued for a task that isn't running (`queued`, `completed`, `failed`).
    *   **Expected Behavior:**
        *   If `queued`: The task status should be transitioned to `cancelled`.
        *   If `completed` or `failed`: The command should be ignored, and the service should return a `false` or throw an `InvalidStateTransitionError`, as the task is already finished.

*   **Scenario:** Rapid, concurrent updates to the same task (Race Conditions).
    *   **Expected Behavior:** The `BackgroundTaskRepository`'s `update` method should be the synchronization point. It should use a `SELECT ... FOR UPDATE` if the database supported it, but with SQLite, it should wrap the read-modify-write logic within a `BEGIN IMMEDIATE TRANSACTION`. This ensures that concurrent updates are serialized, preventing lost updates. For progress aggregation on a parent task, updates should be queued to ensure they are processed sequentially.

### 2.3 System-level

*   **Scenario:** The application is closed abruptly (power loss) while a task is being written to the database.
    *   **Expected Behavior:** All write operations (`CREATE`, `UPDATE`) must be wrapped in SQLite transactions. If the application closes mid-transaction, the database's journaling mechanism will ensure the transaction is rolled back upon the next startup, preventing partial writes and data corruption. The `resumeUnfinishedTasks` logic will then correctly pick up the task in its last known *consistent* state.

*   **Scenario:** How does the service behave when the system runs out of memory?
    *   **Expected Behavior:** This is a catastrophic failure. The main process is likely to crash. The key is what happens on restart. The transactional integrity of the database (see previous point) is paramount. On restart, the service should resume from the last known valid state. There is no expectation for the service to handle an OOM error gracefully at runtime, but it must recover cleanly.

*   **Scenario:** The database file is locked by another process.
    *   **Expected Behavior:** `better-sqlite3` will throw an error with a `code` of `SQLITE_BUSY`. The `SQLiteAdapter` must catch this specific error. For a short-term lock, it could implement a retry mechanism with a short backoff. For a persistent lock, it should bubble up a `DatabaseLockedError`, which the service layer can then handle, likely by failing the relevant task and logging a critical error.

---

## 3.0 Failure Condition Synthesis

### 3.1 Dependency Failures

*   **Scenario:** `SQLiteAdapter` throws an error during a `read` or `write` operation.
    *   **Expected Behavior:** The `BackgroundTaskRepository` should catch the low-level database error and re-throw it as a more specific, abstracted exception (e.g., `DatabaseReadError`, `DatabaseWriteError`). The `BackgroundTaskService` should catch this and fail the associated task gracefully, setting its status to `failed` and logging the internal error for diagnostics.

*   **Scenario:** The file system is read-only, preventing database writes.
    *   **Expected Behavior:** The `SQLiteAdapter` will receive an I/O error from the OS via `better-sqlite3`. This should be identified and re-thrown as a `FileSystemReadOnlyError`. The application should probably enter a degraded state, preventing any new tasks from being created and notifying the user of the critical issue.

### 3.2 Resource Exhaustion

*   **Scenario:** The database connection pool is exhausted.
    *   **Expected Behavior:** Since `better-sqlite3` is synchronous and uses a single connection per database instance, this scenario isn't applicable in the same way as with other databases. However, if concurrent operations were managed via a worker pool, the pool could be exhausted. In that case, new requests should be queued or rejected with a `ResourceExhaustedError`.

*   **Scenario:** The system runs out of disk space while the database is trying to expand.
    *   **Expected Behavior:** The `SQLiteAdapter` will receive a `SQLITE_FULL` error. This must be caught and re-thrown as a `DiskFullError`. The service should immediately fail the current task and any queued tasks that require database writes. It should notify the user and potentially pause all background activity until space is freed.

### 3.3 Invalid Operations

*   **Scenario:** Attempting to resume a task that has a status of `completed` but progress of less than 1.
    *   **Expected Behavior:** This indicates data corruption. During the `resumeUnfinishedTasks` process, the service should validate the data it loads. If it finds such an inconsistency, it should mark the task as `failed`, log a "Corrupted Task Record" error with the task's ID, and continue loading other valid tasks. It must not crash.

*   **Scenario:** Attempting to create a child task for a parent task that is already marked as `completed`.
    *   **Expected Behavior:** The business logic in `createTask` must first load the parent task and check its status. If the parent is in a terminal state, the request to create a new child must be rejected with an `InvalidStateTransitionError`.

---

## 4.0 Chaos Engineering Scenarios

### 4.1 Hypothesis 1 (Database Unavailability)

*   **Hypothesis:** If the database connection is lost while the `BackgroundTaskService` is running, any new tasks should be queued in memory and persisted once the connection is restored. In-flight operations should fail gracefully and be retried.
*   **Experiment:**
    1.  Inject a fault into the `SQLiteAdapter` that causes it to throw `SQLITE_BUSY` or a custom `ConnectionLostError` for all operations.
    2.  Attempt to create and update several tasks.
    3.  **Observe:** The service should not crash. The operations should fail with specific, logged errors.
    4.  Disable the fault injection.
    5.  **Verify:** The service should not automatically retry (as this requires an in-memory queue which is not specified). However, on application restart, the `resumeUnfinishedTasks` logic should correctly restore state. A more advanced implementation could include an in-memory queue for resilience against temporary outages.

### 4.2 Hypothesis 2 (Corrupted Task Data)

*   **Hypothesis:** If a task record in the database is corrupted (e.g., `status` field has an invalid value), the service should isolate the corrupted task, log the error, and continue to function with the remaining valid tasks.
*   **Experiment:**
    1.  Manually shut down the application.
    2.  Use a SQLite editor to change a task's `status` to an invalid value like `COMPLEETED` or set a numeric field to a string.
    3.  Restart the application.
    4.  **Observe:** The application starts without crashing. Check the logs for a "Corrupted Task Record" error message.
    5.  **Verify:** The corrupted task should be marked as `failed` in the database, and all other valid tasks should be loaded and processed correctly.

### 4.3 Hypothesis 3 (High Task Volume)

*   **Hypothesis:** The service should remain performant and stable when creating and updating thousands of tasks in a short period.
*   **Experiment:**
    1.  Create a script that calls the `createTask` and `updateTaskProgress` methods via the IPC interface in a tight loop (e.g., 10,000 tasks).
    2.  **Monitor:** Track the main process's memory usage and CPU load.
    3.  **Observe:** Memory and CPU should spike but then stabilize and should not grow unboundedly. The UI should remain responsive.
    4.  **Verify:** All 10,000 tasks should be created correctly in the database. Performance metrics for the parent progress aggregation logic (as described in `ECT-05` of the test plan) should be captured and asserted to be within acceptable limits (e.g., <50ms per update).