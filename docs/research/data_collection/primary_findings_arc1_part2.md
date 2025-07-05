# Primary Findings (Arc 1, Part 2): State Management & Persistence Patterns

*This document contains findings for Research Arc 1 related to database flushing and caching strategies.*

## Finding 1.4: Write-Through vs. Write-Back Caching for Task State

When updating task states frequently (e.g., progress updates), the choice between write-through and write-back caching becomes a critical trade-off between data integrity and performance.

### Write-Through Caching (High Integrity)

*   **Description:** In a write-through strategy, data is written to the cache (in-memory representation) and the backing store (the SQLite database) simultaneously. The operation is only considered complete after the data is successfully written to both.
*   **Pros:**
    *   **High Data Integrity:** The database is always up-to-date. If the application crashes, the last known state of a task is safely persisted on disk. This is the simplest and most reliable method for ensuring data is not lost.
    *   **Simplicity:** The logic is straightforward, as there is no need to manage "dirty" data in the cache that needs to be written later.
*   **Cons:**
    *   **Higher Latency:** Every write operation must wait for the disk I/O to complete, which is significantly slower than writing to memory. This can become a bottleneck if task progress is updated very frequently.
*   **Use Case:** This approach is strongly preferred for applications where data integrity is a primary concern, such as databases and file systems. For a task management service, this applies to critical state transitions like "queued" -> "running" or "running" -> "completed".

*   **Source:** [Write-through vs Write-back Cache: What's the Difference?](https://www.linkedin.com/advice/0/what-difference-between-write-through-write-back-rlx4e) - States that write-through is preferable for applications requiring high data integrity.
*   **Source:** [disk cache mode: "write back" vs "write through" in iscsi context - Server Fault](https://serverfault.com/questions/1113656/disk-cache-mode-write-back-vs-write-through-in-iscsi-context) - Notes that drives where data integrity is a concern (like for databases) usually have write caching disabled (i.e., operate in write-through mode).

### Write-Back Caching (High Performance)

*   **Description:** In a write-back strategy, data is only written to the cache. The write to the backing database is deferred and happens later (e.g., after a certain delay, or when the cache is full). The cache keeps track of which data is "dirty" (has not been written to the database).
*   **Pros:**
    *   **High Performance / Low Latency:** Write operations are extremely fast as they only involve updating memory. Multiple updates to the same piece of data can be combined into a single, more efficient database write.
*   **Cons:**
    *   **Risk of Data Loss:** If the application crashes before the dirty data in the cache is flushed to the database, those updates are lost permanently.
    *   **Complexity:** The implementation is more complex, as it requires logic to manage the flushing of dirty cache entries.
*   **Use Case:** This approach is suitable for applications that require high write performance and can tolerate some degree of data loss or sensitivity, such as video games or image editing software. It could be considered for non-critical, high-frequency updates like task progress percentages, where losing the absolute latest value in a crash is acceptable.

*   **Source:** [cpu architecture - Write-back vs Write-Through caching? - Stack Overflow](https://stackoverflow.com/questions/27087912/write-back-vs-write-through-caching) - Highlights that write-back has better performance because memory writes are slower than cache writes.

### Hybrid Approach

A hybrid approach is often the most practical solution for a task management service:
*   Use **write-through** for critical, low-frequency state transitions (e.g., `CREATE`, `START`, `FAIL`, `COMPLETE`).
*   Use **write-back** for non-critical, high-frequency progress updates (e.g., `progress: 5%` -> `progress: 6%`). The progress can be flushed to the database periodically (e.g., every few seconds) or when a critical state transition occurs.