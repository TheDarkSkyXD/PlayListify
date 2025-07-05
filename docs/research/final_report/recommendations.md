# Recommendations

*This section provides a final, consolidated set of actionable recommendations for the "Playlistify" project based on the complete body of research.*

### Foundational Recommendations (Must-Haves)

1.  **Adopt the Integrated Model:** The proposed architecture in the [`integrated_model.md`](../synthesis/integrated_model.md) document should be used as the definitive blueprint for the task management service. It correctly layers the essential patterns for reliability, resilience, and performance.

2.  **Prioritize the Implementation Sequence:** Development should follow the logical dependency of the research arcs:
    1.  **First:** Implement the core state management patterns from Arc 1 (database schema, transactional service layer).
    2.  **Second:** Implement the resilience and recovery patterns from Arc 2 (startup recovery, idempotency).
    3.  **Third:** Implement the performance optimizations and advanced features from Arc 3 (WAL mode, dependency management).

3.  **Enforce Unidirectional Data Flow:** The architecture must strictly enforce the separation between the main and renderer processes. The backend owns the database, and the UI subscribes to state changes via IPC events. There should be no exceptions to this rule.

### Specific Technical Recommendations

4.  **Database Configuration:**
    *   Enable `WAL` mode immediately upon database connection.
    *   Set the `synchronous` pragma to `NORMAL`.
    *   Configure the `better-sqlite3` connection with a `timeout` of at least 5000ms.
    *   Use `IMMEDIATE` transactions for all write operations initiated by the task service.

5.  **Task Resilience:**
    *   Implement the startup recovery check to re-queue any tasks left in a `RUNNING` state.
    *   Implement the Idempotent Consumer pattern using a separate `processed_task_ids` table to ensure safe retries.
    *   For long-running download tasks, implement checkpointing by periodically saving the number of bytes downloaded to the task's `details` field.

6.  **Concurrency and Dependencies:**
    *   Continue using `p-queue` to manage the concurrency of I/O-bound tasks. There is no current need to introduce `worker_threads`.
    *   Implement the parent-child task relationship using a `parentId` column in the `tasks` table.
    *   Ensure that application-layer cycle detection (using DFS) is implemented before any feature that allows users to create dependencies between tasks.

### Future Considerations

7.  **Idempotency Key Cleanup:** While not an immediate priority for the MVP, a time-based cleanup strategy for the `processed_task_ids` table should be planned for a future release to manage long-term database growth. A TTL (Time-To-Live) of 30-60 days is a reasonable starting point.

8.  **Stale Task Heartbeat:** The simple startup recovery model is sufficient for the initial implementation. However, if the system evolves to have multiple, independent worker processes in the future, a "heartbeat" or "lease" mechanism for running tasks should be investigated to provide more robust detection of stale tasks.