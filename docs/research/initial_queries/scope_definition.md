# Research Scope Definition: Persistent Backend Task Management Service

## 1. Objective

This research aims to conduct a comprehensive study on the principles, patterns, and best practices for designing and implementing a persistent backend task management service. The specific context for this research is a desktop application environment (e.g., Electron) that utilizes a local, single-file database (e.g., SQLite) for state persistence.

The primary output of this research will be a detailed report that informs the formal specification of this service for the "Playlistify" application, as detailed in the user blueprint ([`project.md`](project.md:1)).

## 2. In-Scope Topics

The research will focus on the following core areas, as defined by the research arcs:

*   **Task State Management & Persistence:** Strategies for reliably storing and updating task state (queued, running, failed, completed, etc.), schema design for task tables in SQLite, and balancing in-memory caching with database-as-source-of-truth.
*   **Resilience & Recovery:** Patterns for ensuring task execution survives application crashes or unexpected shutdowns (e.g., journaling, checkpointing), handling database failures (e.g., deadlocks, connection loss), resuming interrupted tasks on startup, and ensuring idempotent task execution.
*   **Concurrency & Dependencies:** Models for managing concurrent task execution (e.g., worker threads, job queues), handling complex parent-child task dependencies, detecting and preventing circular dependencies, and mitigating performance bottlenecks specific to a SQLite-based system.

## 3. Out-of-Scope Topics

This research will explicitly **exclude** the following areas to maintain focus:

*   **Distributed Task Queues:** Systems designed for multi-server, distributed environments (e.g., RabbitMQ, Kafka, Celery) are considered out of scope, as the focus is on a local, single-machine architecture.
*   **Cloud-Based Task Management Services:** Managed services from cloud providers (e.g., AWS Step Functions, Google Cloud Tasks) will not be investigated.
*   **Real-time, Low-Latency Tasking:** The focus is on background tasks that can tolerate some latency (e.g., file downloads, data processing), not on systems requiring microsecond-level scheduling.
*   **User Interface (UI) Implementation:** While the research will inform what data is available, the specific UI/UX design of a task management dashboard or "Activity Center" is out of scope.

## 4. Context from User Blueprint

The research is heavily informed by the "Playlistify" project blueprint ([`project.md`](project.md:3520)). Specifically, **Epic 4: Background Tasks & Activity Center** ([`project.md`](project.md:3249)) and **Story 4.1: Persistent Backend Task Management Service** ([`project.md`](project.md:3255)) provide direct context. The application's use of Electron, TypeScript, `better-sqlite3`, and `p-queue` establishes the core technology stack that the research findings must be applicable to. The need to manage long-running tasks like playlist imports and video downloads is the primary driver for this investigation.