# Secondary Findings (Arc 2, Part 1): Resilience, Error Handling, and Recovery

*This document contains targeted findings that refine or elaborate on the primary findings for Arc 2.*

## Finding 2.S1: Lifecycle Management of the Idempotency Key Store

While the "Idempotent Consumer" pattern (Finding 2.5) is a standard for preventing duplicate task processing, a critical knowledge gap exists regarding the long-term management of the `processed_task_ids` table.

*   **The Core Pattern:** The pattern involves storing the unique IDs of successfully processed tasks in a dedicated table to detect and discard duplicates. This is a well-established practice.
    *   **Source:** [Handling duplicate messages using the Idempotent consumer pattern](https://microservices.io/post/microservices/patterns/2020/10/16/idempotent-consumer.html) - Describes using a separate `PROCESSED_MESSAGES` table.
    *   **Source:** [Building an Idempotent Event Consumer with Quarkus and Kafka](https://medium.com/event-driven-utopia/building-an-idempotent-event-consumer-with-quarkus-and-kafka-1b342088d8db) - Reinforces that consumers must record successfully processed messages.

*   **The Knowledge Gap: Cleanup and Pruning:** Research does not reveal a single, standardized best practice for cleaning up this table. The table has the potential to grow indefinitely, which could become a performance and storage concern over time. Several potential strategies can be inferred, each with trade-offs:

    1.  **No Cleanup:** For many applications, the storage overhead of a simple list of IDs is negligible, and the safest approach is to never delete from this table. This provides the strongest and simplest guarantee against reprocessing historical tasks.
    2.  **Time-Based Cleanup (TTL):** A periodic background job could delete records older than a certain threshold (e.g., 30 days). This assumes that no message will ever be delayed or retried for longer than that threshold. This is a common strategy but introduces a small risk of reprocessing very old, delayed tasks.
    3.  **Bounded-Size Cleanup:** The table could be managed like a circular buffer, keeping only the last N thousand processed IDs. This caps the storage size but significantly increases the risk of reprocessing if an older task is retried.

*   **Conclusion:** There is no one-size-fits-all answer. The choice of a cleanup strategy depends on the specific requirements of the system:
    *   **For maximum safety and simplicity:** Do not automatically prune the idempotency key store.
    *   **For managing storage in a system with a defined message lifespan:** A time-based (TTL) cleanup is the most common and reasonable compromise.

    Given the context of a desktop application where storage is a consideration and tasks are unlikely to be delayed for extremely long periods, a **time-based cleanup strategy** appears to be the most appropriate practical solution, though it must be implemented with care.