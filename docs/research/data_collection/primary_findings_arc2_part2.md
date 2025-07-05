# Primary Findings (Arc 2, Part 2): Resilience, Error Handling, and Recovery

*This document contains findings for Research Arc 2 related to handling database-level failures.*

## Finding 2.3: Handling `SQLITE_BUSY` Errors with a Busy Timeout

When multiple processes or threads attempt to write to the SQLite database simultaneously, it can result in a `SQLITE_BUSY` error. Rather than implementing a complex manual retry system with exponential backoff in the application logic, the most effective and standard pattern is to use SQLite's built-in "busy timeout" mechanism.

*   **Description:** A busy timeout can be configured on the database connection. When a transaction attempts to start and finds the database locked, SQLite will wait and retry for the specified duration before returning a `SQLITE_BUSY` error. This handles short-lived locks transparently without requiring any special application-level code.

*   **Implementation with `better-sqlite3`:** The `better-sqlite3` library directly exposes this functionality through the `timeout` option in the database constructor.

    **Example:**
    ```javascript
    const db = require('better-sqlite3')('tasks.db', {
      timeout: 5000 // Set a 5-second busy timeout
    });
    ```
    In this configuration, if a statement cannot be executed immediately due to a lock, `better-sqlite3` will automatically retry the operation for up to 5000 milliseconds before throwing a `SQLITE_BUSY` exception.

*   **Benefits:**
    *   **Simplicity:** It is significantly simpler than writing a custom retry loop. The handling is transparent to the application code that executes the queries.
    *   **Efficiency:** The retrying is handled at a low level within the native SQLite C-code, which is more efficient than handling it in the Node.js event loop.
    *   **Effectiveness:** It directly addresses the most common cause of `SQLITE_BUSY` errors, which is temporary contention between writers.

*   **Conclusion:** For handling temporary database locks, configuring a reasonable busy timeout (e.g., a few seconds) is the first and most effective line of defense. A manual retry strategy should only be considered if this built-in mechanism proves insufficient for a specific workload.

*   **Source:** [Set A Busy Timeout](https://www.sqlite.org/c3ref/busy_timeout.html) - Official SQLite documentation describing the busy handler that sleeps for a specified amount of time.
*   **Source:** [SQLite Error: SQLITE_BUSY: Database is Busy - Sling Academy](https://www.slingacademy.com/article/sqlite-error-sqlite-busy-database-is-busy/) - Recommends configuring a timeout period as a primary approach to handle temporary lock conflicts.
*   **Source:** [How does it handle SQLITE_BUSY error? · Issue #155 · WiseLibs/better-sqlite3](https://github.com/WiseLibs/better-sqlite3/issues/155) - Confirms that `better-sqlite3` uses a `timeout` property to configure this behavior.

## Finding 2.4: Resuming Interrupted Tasks on Application Startup

A primary benefit of a persistent task queue is the ability to resume operations after an unexpected shutdown. The strategy for identifying and handling interrupted tasks is a critical part of the system's resilience.

*   **Description:** When the application starts, the task management service must query the `tasks` table to find any tasks that were left in a non-terminal state. These are tasks that were not marked as `COMPLETED` or `FAILED` before the application closed.

*   **Identifying Interrupted Tasks:** The most common way to identify an interrupted task is to find all tasks that have a status of `RUNNING`. A task in this state was actively being processed when the application shut down.

    **Example SQL Query on Startup:**
    ```sql
    SELECT id, type, details FROM tasks WHERE status = 'RUNNING';
    ```
    This query retrieves all tasks that were in the middle of execution.

*   **Handling and Resuming:** Once these "stale" or "interrupted" tasks are identified, the service has several options:
    1.  **Re-queue the Task:** The simplest and safest approach is to change the status of all `RUNNING` tasks back to `QUEUED`. This ensures the task will be picked up again by a worker. This strategy relies on the tasks being idempotent (see Arc 2, Key Question 4) to prevent issues from reprocessing.
    2.  **Mark as Failed:** An alternative is to change the status of all `RUNNING` tasks to `FAILED` with a specific error message like "Interrupted due to application shutdown." This prevents automatic retries and allows a user or a separate process to decide whether to re-queue them manually.
    3.  **Resume from Checkpoint:** For tasks that use checkpointing (Finding 2.1), the service can read the last saved progress from the task's `details` and re-queue the task with instructions to resume from that specific point.

*   **The "Stale" Worker Problem:** A potential issue is a task being marked as `RUNNING` by a worker that has crashed, while other workers are still active. To prevent a task from being stuck in a `RUNNING` state forever, a "heartbeat" or "lease" mechanism can be implemented, where a running task must periodically update a `last_heartbeat` timestamp. A separate cleanup process can then find and re-queue any tasks whose heartbeat is older than a certain threshold.

*   **Source:** [r/dotnet on Reddit: Clear Hangfire Scheduled Tasks on Start/Reboot Server or App](https://www.reddit.com/r/dotnet/comments/w509p8/clear_hangfire_scheduled_tasks_on_startreboot/) - Mentions that job persistence frameworks like Hangfire support "resuming interrupted jobs."
*   **Source:** [[Feature] Resume Interrupted Task Queue · Issue #1445 · stashapp/stash](https://github.com/stashapp/stash/issues/1445) - Describes the user problem of a task queue being lost when a task is interrupted, highlighting the need for a persistent queue that can be resumed.

## Finding 2.5: Idempotent Task Execution via Message ID Tracking

Idempotency is the property of an operation where applying it multiple times does not change the result beyond the initial application. In a task queue, this is crucial for preventing duplicate processing when a task is retried after a crash or network failure.

*   **Description:** The most common pattern for achieving idempotency is to treat each task as a "message" and track the unique IDs of messages that have already been successfully processed. When a worker picks up a new task, it first checks if the task's ID has already been logged as completed.

*   **Implementation Pattern (Idempotent Consumer):**
    1.  **Assign a Unique ID:** Every task that enters the queue must have a globally unique identifier. This ID can be generated by the client submitting the task or by the queueing service itself. This corresponds to the `id` column in the `tasks` table schema (Finding 1.5).
    2.  **Track Processed IDs:** A separate database table (e.g., `processed_task_ids`) is maintained to store the IDs of all tasks that have been successfully completed.
    3.  **Check Before Processing:** When a worker begins processing a task, the very first step within its transaction is to check if the task's ID already exists in the `processed_task_ids` table.
    4.  **Conditional Execution:**
        *   If the ID is present, the task is a duplicate. The worker immediately discards the task and marks it as complete without executing its logic.
        *   If the ID is not present, the worker executes the task's logic.
    5.  **Log on Completion:** Upon successful completion of the task's logic, the worker adds the task's ID to the `processed_task_ids` table. This logging and the actual task completion logic should ideally occur within the same database transaction to ensure atomicity.

*   **Benefits:**
    *   **Prevents Duplicate Work:** Guarantees that a task's side effects (e.g., downloading a file, sending an email) only happen once, even if the task is delivered and attempted multiple times.
    *   **Enables Safe Retries:** Allows the system to be configured to "at-least-once" delivery, which is simple and reliable, while the idempotency layer handles the "at-most-once" execution guarantee.

*   **Source:** [Microservices Pattern: Pattern: Idempotent Consumer](https://microservices.io/patterns/communication-style/idempotent-consumer.html) - Describes the pattern of having a consumer record the IDs of processed messages in a database to detect and discard duplicates.
*   **Source:** [What is Idempotence? Explained with Real-World Examples](https://www.freecodecamp.org/news/idempotence-explained/) - Explains how a message queue can ensure an operation is executed only once, even if the message is delivered multiple times.