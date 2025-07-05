# Primary Findings (Arc 1, Part 1): State Management & Persistence Patterns

*This document contains the initial findings for Research Arc 1, focusing on task state persistence strategies.*

## Finding 1.1: Atomic State Updates via SQLite Transactions

The most fundamental strategy for ensuring consistent and reliable persistence of task state in SQLite is the use of **ACID-compliant transactions**. SQLite guarantees that all operations wrapped within a transaction are atomic, meaning they either all complete successfully or none of them do. This prevents the database from ever entering an inconsistent state, even in the event of a program crash or power failure during the transaction.

A typical state change, such as moving a task from "queued" to "running" and setting its start time, should be performed within a single transaction block.

**Example Pseudocode:**
```sql
BEGIN TRANSACTION;
UPDATE tasks SET status = 'running', started_at = CURRENT_TIMESTAMP WHERE id = 'task-123';
-- Any other related updates, e.g., decrementing a queue counter
COMMIT;
```

This atomicity is a core feature of SQLite and is the primary mechanism for guaranteeing data integrity for state transitions.

*   **Source:** [SQLite Transaction Explained By Practical Examples](https://www.sqlitetutorial.net/sqlite-transaction/) - Confirms that SQLite transactions are atomic and a change cannot be broken down into smaller ones.

## Finding 1.2: The Persistent Queue Pattern

For a Node.js environment, a common and effective pattern is to abstract the task management logic into a **persistent queue** backed by SQLite. Instead of managing database transactions directly for every task operation, a dedicated queueing library can handle the process of:

1.  **Enqueuing:** Adding a new task as a row in the SQLite database.
2.  **Processing:** Dequeuing the task, executing its logic, and updating its status.
3.  **Persistence:** Ensuring the queue state survives application restarts or crashes.

The open-source library `node-persistent-queue` is a direct implementation of this pattern. It is designed specifically for "long-running sequential tasks" and uses SQLite for its on-disk queue, processing tasks in a First-In-First-Out (FIFO) serial manner. This pattern provides a high-level abstraction over raw database operations, simplifying the implementation of a reliable task management service.

*   **Source:** [GitHub - damoclark/node-persistent-queue](https://github.com/damoclark/node-persistent-queue) - Provides a simple SQLite-backed queue for long-running sequential tasks.
*   **Source:** [node-persistent-queue - npm](https://www.npmjs.com/package/node-persistent-queue) - Reinforces the library's purpose of maintaining an on-disk queue that persists through crashes.

## Finding 1.3: Handling Database Locks with a Work Queue

When dealing with potential database contention (e.g., multiple processes trying to write to the database simultaneously, leading to `SQLITE_BUSY` errors), a common strategy is to implement a **deferred execution work queue**.

If a database operation is attempted while the database is locked, instead of failing immediately, the operation is placed into an in-memory queue. This "work queue" then attempts to execute the operations sequentially once the database becomes available. This pattern adds a layer of resilience specifically for handling database lock errors, ensuring that state updates are not lost due to temporary contention.

*   **Source:** [node.js sqlite transaction isolation - Stack Overflow](https://stackoverflow.com/questions/29532526/node-js-sqlite-transaction-isolation) - Describes a pattern of deferring execution by storing a function in a "work queue" if the database object is locked.