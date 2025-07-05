# Test Plan: Persistent Backend Task Management Service

This document outlines the comprehensive testing strategy for the **Persistent Backend Task Management Service**. It details the unit, integration, and specialized tests required to ensure the service is robust, reliable, and correct according to the specified requirements.

---

## 1. Introduction

### 1.1. Purpose

The purpose of this test plan is to verify the functionality of the `BackgroundTaskService` and its components. The plan ensures that all functional requirements, success criteria, and edge cases are thoroughly tested before implementation and deployment.

### 1.2. Scope

This test plan covers the following functional requirements (FR):

-   **FR.4.1.1: Database Table Creation** -- The `background_tasks` table is created correctly.
-   **FR.4.1.2: Task Persistence** -- New background tasks are correctly saved to the database.
-   **FR.4.1.3: Parent/Child Task Relationships** -- Parent/child task logic is handled correctly, including status and progress aggregation.
-   **FR.4.1.4: State Resumption on Startup** -- The service can resume unfinished tasks when the application starts.

### 1.3. Test Philosophy

The testing approach adheres to the principles of **London School Test-Driven Development (TDD)**. The focus is on testing the behavior of objects and their interactions. Collaborators (dependencies) will be mocked in unit tests to isolate the component under test. Integration tests will then verify the interaction between live components, such as the service and the actual database.

---

## 2. Unit Tests (`BackgroundTaskService`)

These tests focus on the business logic within the `BackgroundTaskService`. The `BackgroundTaskRepository` will be mocked to isolate the service and verify its orchestration logic.

**Test Case ID -- Description -- Verifiable Outcome**

-   **UNIT-BGS-001** -- `createTask` with valid data -- The service calls the repository's `createTask` method with the correct parameters and returns the repository's result.
-   **UNIT-BGS-002** -- `createTask` with invalid `type` (null/empty) -- The service rejects the request, does not call the repository, and throws a validation error.
-   **UNIT-BGS-003** -- `getTask` with a valid ID -- The service calls the repository's `getTask` method with the correct ID.
-   **UNIT-BGS-004** -- `updateTaskStatus` for a valid, non-terminal task -- The service calls the repository's `updateTaskStatus` method with the correct ID and new status.
-   **UNIT-BGS-005** -- `updateTaskStatus` for a task in a terminal state (e.g., `COMPLETED`) -- The service rejects the update, does not call the repository, and throws an error indicating the task cannot be modified.
-   **UNIT-BGS-006** -- `updateTaskProgress` with a valid progress value (e.g., 50) -- The service calls the repository's `updateTaskProgress` method with the correct ID and progress value.
-   **UNIT-BGS-007** -- `updateTaskProgress` with an invalid value (<0 or >100) -- The service rejects the update, does not call the repository, and throws a validation error.
-   **UNIT-BGS-008** -- `cancelTask` for a running task -- The service calls the in-memory queue to cancel the task and then calls the repository's `updateTaskStatus` method with the status `CANCELLED`.
-   **UNIT-BGS-009** -- `cancelTask` for a non-running or non-existent task -- The service handles the request gracefully without error and does not call the repository.
-   **UNIT-BGS-010** -- `createTask` with a `parentId` that points to a completed parent task -- The service rejects the request and throws an error.
-   **UNIT-BGS-011** -- `createTask` attempts to create a circular parent-child dependency -- The service detects the circular dependency, rejects the request, and throws an error.

---

## 3. Integration Tests (`BackgroundTaskRepository`)

These tests verify the interaction between the `BackgroundTaskRepository` and a real SQLite database (which can be an in-memory instance for testing).

**Test Case ID -- Description -- Verifiable Outcome**

-   **INT-BGR-001** -- Repository initialization -- The `background_tasks` table is created in the database with the correct schema as defined in **FR.4.1.1**.
-   **INT-BGR-002** -- `createTask` successfully persists a new task -- A new record corresponding to the task data exists in the `background_tasks` table. The returned object matches the created data.
-   **INT-BGR-003** -- `getTask` retrieves an existing task by ID -- The method returns the correct task object from the database.
-   **INT-BGR-004** -- `getTask` with a non-existent ID -- The method returns `null`.
-   **INT-BGR-005** -- `updateTaskStatus` correctly changes a task's status -- The `status` field for the specified task ID is updated in the database. A `completedAt` timestamp is added for terminal statuses.
-   **INT-BGR-006** -- `updateTaskProgress` correctly changes a task's progress -- The `progress` field for the specified task ID is updated in the database.
-   **INT-BGR-007** -- `handleChildTaskCompletion` correctly updates parent progress -- When a child task completes, the parent's `progress` is recalculated and updated correctly (e.g., 1 of 2 children done --> 50% progress).
-   **INT-BGR-008** -- `handleChildTaskCompletion` sets parent to `COMPLETED` when all children succeed -- When the last child task completes successfully, the parent task's status is updated to `COMPLETED`.
-   **INT-BGR-009** -- `handleChildTaskCompletion` sets parent to `COMPLETED_WITH_ERRORS` -- If at least one child fails and the rest complete, the parent task's status is updated to `COMPLETED_WITH_ERRORS`.
-   **INT-BGR-010** -- `createTask` with a non-existent `parentId` -- The database's foreign key constraint rejects the insert, and the repository throws a `SQLITE_CONSTRAINT` error.
-   **INT-BGR-011** -- `cancelTask` updates status to `CANCELLED` -- The `status` field for the task is updated to `CANCELLED` in the database.
-   **INT-BGR-012** -- State resumption on startup -- Unfinished tasks (`QUEUED`, `IN_PROGRESS`) are correctly loaded from the database when the service initializes.

---

## 4. API / Contract Tests

These tests ensure that events emitted by the service adhere to a defined structure, which is critical for decoupling the backend from the frontend.

**Test Case ID -- Description -- Verifiable Outcome**

-   **API-BGS-001** -- `emitTaskUpdate` sends the correct payload structure -- An event with the name `task-update` is emitted. The payload is an array of task objects, and each object contains all fields from the `background_tasks` table.
-   **API-BGS-002** -- `emitTaskUpdate` payload contains only active tasks -- The emitted task list only includes tasks with status `QUEUED` or `IN_PROGRESS`. Completed, failed, or cancelled tasks are not included.
-   **API-BGS-003** -- `emitTaskUpdate` is triggered after `createTask` -- A `task-update` event is emitted immediately after a new task is created.
-   **API-BGS-004** -- `emitTaskUpdate` is triggered after `updateTaskStatus` -- A `task-update` event is emitted immediately after a task's status changes.
-   **API-BGS-005** -- `emitTaskUpdate` is triggered after `updateTaskProgress` -- A `task-update` event is emitted immediately after a task's progress changes.

---

## 5. Edge Case & Failure Condition Testing

These tests explicitly target the failure conditions identified during the specification phase.

**Test Case ID -- Description -- Verifiable Outcome**

-   **EDGE-DB-001** -- Abrupt closure during a write transaction -- A test will simulate an application crash during a multi-statement update (e.g., `handleChildTaskCompletion`). The database state is verified to have rolled back to its pre-transaction state. **AI-Verifiable Outcome:** A post-crash query confirms that partial data was not committed.
-   **EDGE-DB-002** -- Database file is locked (`SQLITE_BUSY`) -- A test will simulate a locked database file. The service should catch the `SQLITE_BUSY` error and retry the operation according to its defined retry logic.
-   **EDGE-DB-003** -- Database is read-only -- A write operation is attempted on a read-only database file. The service should catch the I/O error and fail gracefully without crashing.
-   **EDGE-DB-004** -- Disk space exhaustion (`SQLITE_FULL`) -- A write operation is attempted when no disk space is available. The service should catch the `SQLITE_FULL` error and fail gracefully.
-   **EDGE-DATA-001** -- Resuming a task with inconsistent data -- On startup, a task with `status: "COMPLETED"` but `progress: 0.5` is read from the DB. The service should mark this task's status as `FAILED` and log an error.
-   **EDGE-STATE-001** -- Race condition on concurrent updates -- Two concurrent requests attempt to update the same task. The database transaction should serialize the updates, preventing a race condition. The final state of the task should reflect the last-committed update.

---

## 6. Specialized Testing Strategies

### 6.1. Regression Testing Strategy

A full suite of all unit and integration tests will be run automatically via a CI/CD pipeline upon every commit to the main branch. This ensures that new changes do not break existing functionality. A snapshot of the database schema will be maintained, and any changes to it must be part of a deliberate, versioned migration, which will also be tested.

### 6.2. Chaos Testing Strategy

Chaos testing will be performed to ensure system resilience under unpredictable conditions.

-   **Chaos-001: Random Task Cancellation:** A background process will randomly select and cancel `IN_PROGRESS` tasks. The system is expected to handle this gracefully, updating the task status to `CANCELLED` and, if applicable, updating the parent task's status correctly.
-   **Chaos-002: Database Connection Flapping:** A test harness will intermittently interrupt the connection to the SQLite database. The `BackgroundTaskService` is expected to handle these connection errors, attempt to reconnect, and queue any intervening operations until the connection is restored, without data loss.
