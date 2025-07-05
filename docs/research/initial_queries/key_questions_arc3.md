# Key Research Questions: Arc 3 - Concurrency, Dependencies, and Scalability

This document outlines the central questions for Arc 3. This research arc investigates the challenges of running multiple tasks concurrently, managing relationships between them, and ensuring the system performs well as the number of tasks grows, all within the constraints of a local SQLite database.

### Core Questions:

1.  **Concurrency Models:** What are the common models for managing concurrency in a multi-tasking desktop application environment?
    *   *Sub-question:* Compare the implementation, performance, and complexity of using a job queue (like `p-queue`) with dedicated worker threads (`worker_threads` in Node.js) for processing background tasks.

2.  **Task Dependencies:** How can the system efficiently manage and enforce complex parent-child task dependencies?
    *   *Sub-question:* What are the database schema and query patterns required to ensure a child task cannot run before its parent is in a specific state?
    *   *Sub-question:* How should the system handle the failure of a parent task? Should child tasks be automatically canceled?

3.  **Circular Dependency Detection:** What are the standard algorithms for detecting and preventing circular dependencies when establishing or modifying task relationships (e.g., preventing Task A from depending on Task B if Task B already depends on Task A)?
    *   *Sub-question:* Should this validation occur at the application layer before a database write, or can it be enforced with database constraints?

4.  **SQLite Performance & Bottlenecks:** What are the known performance considerations and potential bottlenecks for a task management system built on SQLite, and how can they be mitigated?
    *   *Sub-question:* How does high-frequency writing (e.g., constant progress updates) impact database performance, and what is the role of WAL (Write-Ahead Logging) mode in mitigating this?
    *   *Sub-question:* What are the best practices for transaction management to ensure both data integrity and high throughput?