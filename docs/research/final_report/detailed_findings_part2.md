# Detailed Findings: Arc 2 - Resilience, Error Handling, and Recovery

*This section details the specific findings related to ensuring the system is robust and can recover from errors and application crashes.*

### Finding 2.1: The Checkpointing Pattern
For long-running, divisible tasks (e.g., a large file download), checkpointing is a key resilience pattern. It involves periodically saving the task's progress to its record in the database (e.g., in the `details` JSON blob). If the task is interrupted, the recovery service can read this checkpoint and resume the task from the last saved state, rather than starting from the beginning. This saves time and resources.

### Finding 2.2: Task Journaling
The act of creating a task record in the database before execution is a form of journaling. It logs the "intent" to do work. This ensures that if a crash occurs after a task is requested but before it starts, the task is not lost. The recovery process can identify this "journal entry" (a task with status `QUEUED`) and ensure it is processed.

### Finding 2.3: Handling `SQLITE_BUSY` with a Busy Timeout
The most effective way to handle temporary database locks (`SQLITE_BUSY` errors) is to use the database driver's built-in busy timeout mechanism. By setting a timeout on the connection (e.g., 5 seconds), the driver will automatically retry a locked operation for that duration before throwing an error. This is much simpler and more efficient than building custom retry logic in the application.

### Finding 2.4: Resuming Interrupted Tasks on Startup
A core resilience feature is the ability to recover from an unexpected shutdown. The standard pattern is:
1.  On application startup, the task service queries the database for all tasks left in a `RUNNING` state.
2.  These tasks are considered interrupted. The safest action is to atomically update their status back to `QUEUED`.
3.  This ensures they will be picked up by a worker and re-processed. This relies on the tasks being idempotent.

### Finding 2.5: Idempotent Task Execution
To allow for safe retries, tasks must be idempotent (safe to run multiple times). The "Idempotent Consumer" pattern achieves this. Before a worker executes a task, it checks if the task's unique ID has already been logged in a separate `processed_task_ids` table. If it has, the task is a duplicate and is discarded. If not, the task is executed, and its ID is added to the table upon successful completion.

### Finding 2.S1: Idempotency Key Store Lifecycle Management
There is no universal standard for cleaning up the `processed_task_ids` table. The safest approach is to never delete from it. However, to manage storage, a practical compromise for a desktop application is a **time-based cleanup (TTL)**, where a background job periodically deletes records older than a safe threshold (e.g., 30 days).