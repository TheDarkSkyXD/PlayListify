# Detailed Edge Case Analysis for Task Management Service

This document provides a detailed breakdown of edge case scenarios for the persistent backend task management service. Each scenario includes a descriptive context and a precise, AI-verifiable expected outcome.

---

## 1. System-level Edge Cases

These test cases focus on the system's interaction with the database and filesystem under failure conditions.

### **EDGE-DB-001: Abrupt Closure During Write Transaction**

*   **Scenario:** A `createTask` operation is initiated, involving multiple related database inserts within a single transaction. Before the transaction is committed, the service process is terminated abruptly (e.g., via `kill -9`).
*   **Expected Behavior:**
    *   **AI-Verifiable Outcome:** After the service restarts, a direct database query for the task that was being created **must** return zero results. The database's internal consistency checks should pass, and there should be no record of the partially created task or its related entries. The transaction must have been fully rolled back.

### **EDGE-DB-002: Database File is Locked (`SQLITE_BUSY`)**

*   **Scenario:** A long-running read query or a separate process holds a lock on the SQLite database file. Concurrently, a new request arrives that requires a write operation (e.g., `updateTaskStatus`).
*   **Expected Behavior:**
    *   **AI-Verifiable Outcome:** The service must catch the `SQLITE_BUSY` error from the database driver. The system will then initiate a retry mechanism, attempting the transaction again up to a configured maximum (e.g., 5 retries) with a fixed delay (e.g., 50ms) between attempts. A `WARN` level log entry, including the text "SQLITE_BUSY detected, retrying transaction...", must be generated for each attempt. If all retries are exhausted, the service must throw a `ServiceUnavailableError`.

### **EDGE-DB-003: Database is Read-Only**

*   **Scenario:** The filesystem permissions for the database file are set to read-only (`chmod 444`). The service then attempts any write operation, such as creating or updating a task.
*   **Expected Behavior:**
    *   **AI-Verifiable Outcome:** The data adapter layer must catch the low-level I/O error from the SQLite driver. This error must be wrapped and re-thrown as a custom `DatabaseError`. The service layer will catch this and fail the operation gracefully, logging a `CRITICAL` error message stating "Attempted to write to a read-only database." No partial data should be written.

### **EDGE-DB-004: Disk Space Exhaustion (`SQLITE_FULL`)**

*   **Scenario:** The disk partition where the database file resides becomes full. The service attempts a write operation that requires increasing the size of the database file.
*   **Expected Behavior:**
    *   **AI-Verifiable Outcome:** The database driver will throw an `SQLITE_FULL` error. The data adapter must specifically catch this error and wrap it into a `DatabaseFullError`. The service layer must log a `CRITICAL` error with the message "Disk space exhausted. Database write failed." and the operation must be aborted cleanly.

---

## 2. State-related Edge Cases

These test cases focus on conditions arising from concurrent operations and invalid state transitions.

### **EDGE-STATE-001: Race Condition on Concurrent Updates**

*   **Scenario:** Two independent requests are processed concurrently for the same task ID. Request A attempts to update the task's progress to `50`. Request B attempts to update the task's status to `CANCELLED`.
*   **Expected Behavior:**
    *   **AI-Verifiable Outcome:** The database's transaction serialization (`BEGIN IMMEDIATE`) ensures that the updates do not interleave. The final state of the task must reflect the outcome of the *last-committed* transaction. For instance, if Request B commits last, a subsequent query for the task must return a record where `status` is `CANCELLED`. The database must remain in a consistent state, never reflecting a partial update from both requests.

---

## 3. Data-related Edge Cases

These test cases focus on handling inconsistent or logically invalid data.

### **EDGE-DATA-001: Resuming a Task with Inconsistent Data**

*   **Scenario:** An application restart is triggered. During the initialization sequence, the service scans for tasks to resume. It discovers a child task in a `PENDING` state whose parent task is already marked as `COMPLETED`. This represents a logically corrupt state.
*   **Expected Behavior:**
    *   **AI-Verifiable Outcome:** Upon detecting this inconsistency, the service must immediately update the status of the child task to `FAILED`. A specific, detailed error message must be written to the log, containing the parent task ID, the child task ID, and the reason for the failure, e.g., "Inconsistency detected: Child task `[child_id]` cannot be `PENDING` because parent task `[parent_id]` is `COMPLETED`. Marking child task as `FAILED`."