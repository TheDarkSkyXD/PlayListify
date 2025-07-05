# Knowledge Gaps & Adaptive Decisions (First Pass: Arc 1)

*This document outlines unanswered questions and areas needing deeper exploration after the initial research pass. It also documents the adaptive decision on how to proceed.*

## Identified Knowledge Gaps

The initial research for Arc 1 has provided a strong foundation, but it has also revealed several areas where more specific, practical information is required.

1.  **Practical Implementation of Hybrid Caching:**
    *   **Gap:** While the *concept* of a hybrid write-through/write-back caching strategy (Finding 1.4) is clear, the practical implementation details in a Node.js/`better-sqlite3` environment are not. How does one build an efficient batching and flushing mechanism for progress updates? Are there existing libraries that facilitate this?
    *   **Impact:** Without this knowledge, implementing the performant progress updates mentioned in the blueprint would be based on guesswork.

2.  **Schema for Complex Metadata:**
    *   **Gap:** The proposed schema (Finding 1.5) includes a JSON blob for `details`. While flexible, the best practices for structuring this JSON for different task types (e.g., a 'download' task vs. an 'import' task) are unknown. How should this data be structured to be both extensible and queryable (using SQLite's JSON functions)?
    *   **Impact:** A poorly designed JSON structure could lead to difficulties in debugging, reporting, and extending the system with new task types.

3.  **Performance Tuning `better-sqlite3` Transactions:**
    *   **Gap:** The research confirms that transactions are key (Finding 1.1), but specific performance tuning options within the `better-sqlite3` library (e.g., `IMMEDIATE` vs. `EXCLUSIVE` transactions) have not been explored. Which transaction type is optimal for a high-throughput task queue?
    *   **Impact:** The default transaction behavior might not be the most performant, potentially leading to bottlenecks as the number of tasks increases. This directly relates to the key questions in Arc 3 (Scalability).

## Adaptive Decision

The initial research has validated the core concepts of using SQLite for a task queue. The identified knowledge gaps are not significant enough to warrant a fundamental change in the research arcs. The original three arcs remain highly relevant.

However, the analysis reveals a strong interdependency between the findings in Arc 1 and the key questions in Arc 2 (Resilience) and Arc 3 (Concurrency/Scalability). For example, the choice of transaction type (Knowledge Gap #3) directly impacts both resilience and performance.

**Decision:**

1.  **Proceed with the original Research Arcs.** The current structure is effective.
2.  **Initiate Research on Arc 2 next.** The questions in Arc 2 (Resilience, Error Handling, and Recovery) are the most logical next step, as they build directly upon the foundation of database state management established in Arc 1. Understanding how to recover from crashes will provide critical context before tackling the more advanced concurrency and performance tuning topics in Arc 3.
3.  **Integrate Knowledge Gaps into Future Queries:** The identified gaps will be used to formulate more targeted queries in the subsequent research cycles. For example, when researching Arc 3, a specific query will be "performance of immediate vs exclusive transactions in better-sqlite3 for queueing."

This decision maintains the strategic direction of the research while adapting the tactical execution to explore the subject matter in the most logical and interconnected sequence.

## Identified Knowledge Gaps (Second Pass: Arc 2)

The research into Arc 2 has clarified the high-level patterns for resilience, but has also highlighted new, more specific knowledge gaps.

1.  **"Stale" Task Identification:**
    *   **Gap:** The pattern of re-queuing `RUNNING` tasks on startup (Finding 2.4) is simple, but potentially flawed. It doesn't distinguish between a task that was genuinely running during a crash and a task that is "stale" because its worker crashed while other parts of the application remained active. The concept of a "heartbeat" or "lease" was mentioned, but no practical implementation details were found.
    *   **Impact:** Without a robust way to identify truly stale tasks, the system might prematurely re-queue a task that is simply long-running, leading to potential race conditions or duplicate processing.

2.  **Idempotency Key Storage:**
    *   **Gap:** The "Idempotent Consumer" pattern (Finding 2.5) requires storing the IDs of processed tasks. It is unclear what the best practice is for managing this table. Should it be pruned? If so, when? Does it grow indefinitely?
    *   **Impact:** An unmanaged `processed_task_ids` table could grow to an enormous size over time, impacting database performance and storage footprint. The lifecycle of these idempotency keys is a significant unknown.

3.  **Checkpointing vs. Journaling:**
    *   **Gap:** The initial research defined checkpointing clearly (Finding 2.1) but only inferred a basic definition of journaling (Finding 2.2). The practical differences, trade-offs, and specific use cases for one over the other remain unclear. Is journaling simply logging the task creation, or is it a more involved "write-ahead log" for task operations?
    *   **Impact:** A clearer understanding of these two patterns is needed to make an informed recommendation on which to use for different types of tasks (e.g., a multi-step import vs. a single file download).

## Adaptive Decision (Second Pass)

The research from Arc 2 has reinforced the viability of the overall approach but has raised more specific questions about implementation. The interdependencies between all three arcs are now even clearer. For example, the performance implications of the idempotency key table (Gap #2) and the concurrency model for stale task detection (Gap #1) relate directly to Arc 3.

**Decision:**

1.  **Proceed with Research on Arc 3 next.** The questions in Arc 3 (Concurrency, Dependencies, and Scalability) are now the most critical. The findings from Arc 3 will provide the necessary context to resolve the new knowledge gaps identified here, particularly around performance and concurrent access.
2.  **Formulate Targeted Queries for Gaps:** The knowledge gaps identified above will be used to create highly specific queries during the research for Arc 3 and any subsequent targeted research cycles.
    *   For Gap #1: "database task queue heartbeat mechanism node.js"
    *   For Gap #2: "managing idempotency key table lifecycle"
    *   For Gap #3: "write-ahead logging vs checkpointing for application-level task recovery"

This decision continues the planned research trajectory while ensuring that the newly discovered, more granular questions are explicitly scheduled to be answered.

## Identified Knowledge Gaps (Third Pass: Arc 3)

The research into Arc 3 has successfully clarified the high-level architectural choices for concurrency and dependency management. However, it has also highlighted a final set of specific, low-level implementation questions.

1.  **Optimal WAL Checkpointing Strategy:**
    *   **Gap:** While enabling WAL mode is clearly beneficial (Finding 3.4), the optimal strategy for managing the WAL file itself is not. The research mentions running `pragma wal_checkpoint(full)` or `wal_checkpoint(truncate)` and reducing the `wal_autocheckpoint` interval, but provides no clear guidance on *when* and *why* to choose one over the other in the context of a desktop application.
    *   **Impact:** An unmanaged WAL file can grow very large, impacting disk space. An overly aggressive checkpointing strategy could negate some of the performance benefits of WAL mode.

2.  **Practical DFS Implementation for Cycle Detection:**
    *   **Gap:** The research identified DFS as the correct algorithm for cycle detection (Finding 3.3), but the practical details of implementing this efficiently against a relational database like SQLite are missing. How does one load the task graph into memory to perform the traversal without causing performance issues on a very large `tasks` table?
    *   **Impact:** An inefficient implementation could cause the process of adding a new dependency to be very slow, harming the user experience.

## Final Adaptive Decision

The initial research phase across all three arcs is now complete. The identified knowledge gaps are no longer high-level architectural questions but are now specific, targeted implementation details. The current research structure has been effective.

The next logical step is to move from broad, multi-arc research to **Phase 4: Targeted Research Cycles**. I will now use the specific, targeted queries formulated during the analysis phases to address the remaining knowledge gaps.

**Decision:**

1.  **Conclude the initial multi-arc research phase.**
2.  **Initiate Phase 4: Targeted Research Cycles.** The first cycle will address the most pressing knowledge gaps identified across all arcs, starting with the `better-sqlite3` transaction types and the practical implementation of hybrid caching.