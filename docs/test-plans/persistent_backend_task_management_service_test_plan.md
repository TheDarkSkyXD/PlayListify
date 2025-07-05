# Test Plan-- Persistent Backend Task Management Service

**Document Version--** 1.0
**Date--** 2025-07-04
**Author--** Spec-To-TestPlan Converter

---

## 1.0 Introduction

This document outlines the comprehensive test plan for the **Persistent Backend Task Management Service**. The purpose of this service is to create, manage, and persist the state of long-running background tasks within the application, ensuring resilience against application restarts and providing a clear structure for complex, multi-step operations.

This plan details the testing strategy across multiple levels, including unit, integration, and API contract tests. It also defines strategies for handling edge cases, failures, and long-term regression.

## 2.0 Test Scope

This test plan directly targets the AI-verifiable success criteria defined in the functional requirements for the Persistent Backend Task Management Service.

The scope of this plan covers the following requirements--

-   **FR.4.1.1--** A `background_tasks` table shall be created in the SQLite database.
-   **FR.4.1.2--** All new tasks shall be saved as a record in the `background_tasks` table.
-   **FR.4.1.3--** The service shall support parent/child task relationships.
-   **FR.4.1.4--** The service shall resume the state of unfinished tasks on application startup.

## 3.0 Test Methodology

### 3.1 London School TDD

The testing approach will adhere to the principles of the **London School of Test-Driven Development (TDD)**. The focus is on testing the behavior and interactions of components, not their internal implementation.

-   **Collaborator Mocking--** In unit tests, direct collaborators of the service under test (e.g., `BackgroundTaskRepository`) will be mocked. This isolates the service's logic and allows us to verify that it sends the correct commands to its dependencies.
-   **Observable Outcomes--** Tests will verify observable outcomes-- either a state change (verified by checking the arguments passed to a mocked collaborator) or a return value.

### 3.2 AI-Verifiable Completion Criteria

Each test case defined in this document represents an AI-verifiable task. The completion of this test plan is achieved when all test cases are implemented, are passing, and are integrated into the project's continuous integration (CI) pipeline.

-   **Criterion--** A pull request containing the implementation of a test case is merged.
-   **Verification--** The CI build, including the execution of the test suite, passes successfully.

---

## 4.0 Test Levels & Cases

### 4.1 Unit Tests (`BackgroundTaskService`)

**Objective--** To test the business logic of the `BackgroundTaskService` in complete isolation from its dependencies.

**Setup--** The `BackgroundTaskRepository` will be fully mocked for all unit tests.

**Test Cases--**

-   **UTC-01-- Create a Single Task**
    -   **Description--** Verify that calling `createTask` on the service results in a single call to the repository's `create` method with correctly formatted task data.
    -   **AI-Verifiable Outcome--** The mock `repository.create` method is called exactly once with an object containing `task_type`, `title`, and `status-- 'queued'`.

-   **UTC-02-- Create a Parent and Child Task**
    -   **Description--** Verify that creating a child task correctly associates it with its parent via the `parent_id`.
    -   **AI-Verifiable Outcome--** The mock `repository.create` method is called for the child task with a `parent_id` matching the ID of the previously created parent task.

-   **UTC-03-- Update Task Status**
    -   **Description--** Verify that the service correctly handles valid state transitions (e.g., `queued` -> `in_progress`).
    -   **AI-Verifiable Outcome--** The mock `repository.update` method is called with the correct `id` and the new `status`.

-   **UTC-04-- Update Task Progress**
    -   **Description--** Verify that progress updates are correctly passed to the repository.
    -   **AI-Verifiable Outcome--** The mock `repository.update` method is called with the correct `id` and a `progress` value between 0.0 and 1.0.

-   **UTC-05-- Parent Progress Aggregation**
    -   **Description--** When a child task's progress is updated, the parent task's progress should be recalculated as the average of all its children.
    -   **AI-Verifiable Outcome--** After a child task update, the mock `repository.update` method is called for the parent task with the correctly calculated aggregate progress.

-   **UTC-06-- Parent Status Aggregation (All Children Success)**
    -   **Description--** When the last child task completes successfully, the parent task's status should transition to `completed`.
    -   **AI-Verifiable Outcome--** Upon the final child's completion, the mock `repository.update` is called for the parent with `status-- 'completed'`.

-   **UTC-07-- Parent Status Aggregation (One Child Fails)**
    -   **Description--** If any child task transitions to a `failed` state, the parent task's status should become `completed_with_errors`.
    -   **AI-Verifiable Outcome--** When a child fails, the mock `repository.update` is called for the parent with `status-- 'completed_with_errors'`.

### 4.2 Integration Tests (`BackgroundTaskService` <-> `BackgroundTaskRepository`)

**Objective--** To verify the correct interaction between the service and the data persistence layer.

**Setup--** These tests will use a real `BackgroundTaskRepository` connected to an in-memory `better-sqlite3` database instance to ensure speed and isolation.

**Test Cases--**

-   **ITC-01-- Database Schema Creation**
    -   **Description--** Verify that the `background_tasks` table is created with the correct schema on application initialization.
    -   **AI-Verifiable Outcome--** A `PRAGMA table_info('background_tasks')` query returns the columns defined in `FR.4.1.1` with the correct types and constraints.

-   **ITC-02-- Create and Retrieve Task**
    -   **Description--** Verify that a task created via the service is correctly persisted in the database and can be retrieved.
    -   **AI-Verifiable Outcome--** A task object created by `service.createTask` can be retrieved from the database via a direct `SELECT` query, and its properties match the input.

-   **ITC-03-- Update and Retrieve Task**
    -   **Description--** Verify that updating a task's status or progress via the service correctly modifies the record in the database.
    -   **AI-Verifiable Outcome--** After calling `service.updateTaskStatus`, a `SELECT` query for that task ID returns a record with the updated status.

-   **ITC-04-- Resume Unfinished Tasks on Startup**
    -   **Description--** Verify that tasks with a non-terminal status are loaded by the service upon initialization.
    -   **Setup--** 1. Manually insert records for one `queued` and one `in_progress` task into the database. 2. Instantiate the service.
    -   **AI-Verifiable Outcome--** The service's internal state (e.g., accessible via a `getTask` method) contains the two unfinished tasks loaded from the database.

### 4.3 API/Contract Tests (`BackgroundTaskService` Public Interface)

**Objective--** To ensure the service's public methods are stable and provide consistent data shapes for other consuming services.

**Test Cases--**

-   **CTC-01-- `createTask` Contract**
    -   **Description--** Verify the signature and return value of the `createTask` method.
    -   **AI-Verifiable Outcome--** The method accepts an object with `task_type` and `title` and returns a full task object including a database `id` and default values (`status-- 'queued'`, `progress-- 0.0`).

-   **CTC-02-- `updateTaskStatus` Contract**
    -   **Description--** Verify the method signature and its effect.
    -   **AI-Verifiable Outcome--** The method accepts a `taskId` and a `status` string. It returns a boolean indicating success or throws a defined error on failure.

-   **CTC-03-- `getTask` Contract**
    -   **Description--** Verify the data shape of the task object returned by the service.
    -   **AI-Verifiable Outcome--** The `getTask(taskId)` method returns a task object matching the full schema, including `id`, `parent_id`, `status`, `progress`, etc.

---

## 5.0 Advanced Testing Strategies

### 5.1 Edge Case & Failure Condition Testing

-   **ECT-01-- Database Unavailable on Create/Update**
    -   **Scenario--** The database connection is lost when the service attempts a write operation.
    -   **Hypothesis--** The service should not crash. It should catch the error from the repository and throw a specific, catchable exception (e.g., `DatabaseError`).
    -   **AI-Verifiable Outcome--** The test asserts that the specific exception is thrown when the mocked repository's method is configured to throw an error.

-   **ECT-02-- Update Non-Existent Task**
    -   **Scenario--** `updateTaskStatus` is called with a `taskId` that does not exist.
    -   **Hypothesis--** The service should handle this gracefully, returning `false` or throwing a `TaskNotFoundError`.
    -   **AI-Verifiable Outcome--** The test asserts that the expected error is thrown or `false` is returned.

-   **ECT-03-- Invalid Status Transition**
    -   **Scenario--** An attempt is made to transition a task from `completed` back to `in_progress`.
    -   **Hypothesis--** The service's business logic should prevent this invalid transition and throw an `InvalidStateTransitionError`.
    -   **AI-Verifiable Outcome--** The test asserts that the specific error is thrown.

-   **ECT-04-- Resume from Corrupted Data**
    -   **Scenario--** The database contains a task record with a `null` status or other malformed data.
    -   **Hypothesis--** The service should either ignore the corrupted record or assign it a default `error` state upon startup, logging the issue. It must not crash.
    -   **AI-Verifiable Outcome--** The test verifies that the service starts successfully and that the corrupted task is either ignored or handled gracefully.

-   **ECT-05-- High-Volume Child Tasks**
    -   **Scenario--** A parent task is created with 10,000 child tasks, and their progress is updated rapidly.
    -   **Hypothesis--** The parent's progress and status aggregation logic should perform within an acceptable time threshold and not block other operations.
    -   **AI-Verifiable Outcome--** A performance test measures the time taken for the parent task update and asserts it is below a defined threshold (e.g., 50ms).

### 5.2 Recursive Regression Testing

A suite of regression tests will be established and maintained.

-   **Core Suite--** A fast-running subset of unit and integration tests (e.g., UTC-01, UTC-03, ITC-02) will be executed on every single commit to the codebase.
-   **Full Suite--** The entire test suite, including edge cases, will be run before any new release is deployed.
-   **Bug-Driven Growth--** Whenever a bug is discovered in the service, a new test case that specifically replicates the bug will be written first. The test will initially fail. The bug will then be fixed, causing the new test to pass. This test is then permanently added to the regression suite, ensuring the bug never reappears.

### 5.3 Chaos Testing

Once the service is deployed in a staging environment, chaos engineering principles will be applied to test for systemic resilience.

-   **Chaos Experiment #1-- Kill the DB Connection**
    -   **Action--** Randomly terminate the connection to the SQLite database while tasks are actively being created and updated.
    -   **Hypothesis--** The application will remain stable. In-flight operations will fail gracefully with logged errors. Upon reconnection, the startup-resume logic will ensure data consistency.
    -   **AI-Verifiable Outcome--** The system logs the expected errors, and a post-experiment data integrity check shows no corrupted task records.

-   **Chaos Experiment #2-- Simulate Disk Full**
    -   **Action--** Intercept database write calls and simulate a "disk full" I/O error.
    -   **Hypothesis--** The service will fail the specific task it was trying to write, update its status to `failed`, and log a descriptive error. The rest of the application will continue to function.
    -   **AI-Verifiable Outcome--** The target task's status becomes `failed` in the database, and application monitoring shows no service crashes.