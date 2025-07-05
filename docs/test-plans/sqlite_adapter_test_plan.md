# Test Plan for SQLiteAdapter Class

## 1. Introduction

This document outlines the test plan for the `SQLiteAdapter` class. It details the scope, strategy, and specific test cases designed to ensure the functionality, reliability, security, and performance of the `SQLiteAdapter`. This test plan emphasizes interaction-based testing, adopting London School TDD principles, and defining comprehensive strategies for regression, edge case, and chaos testing.

## 2. Test Scope

This test plan covers the following aspects of the `SQLiteAdapter` class:

*   **Functional Requirements:** All requirements defined in [`docs/specifications/sqlite_adapter/functional_requirements.md`](docs/specifications/sqlite_adapter/functional_requirements.md), including constructor validation, parameter assignment, database connection, schema application, SQL query validation, SQL injection prevention, query timeout, query execution, error handling, and statement finalization.
*   **Non-Functional Requirements:** All requirements defined in [`docs/specifications/sqlite_adapter/non_functional_requirements.md`](docs/specifications/sqlite_adapter/non_functional_requirements.md), including constructor performance, reliability, and security, as well as query method performance, reliability, security, and maintainability.
*   **User Stories:** All user stories defined in [`docs/specifications/sqlite_adapter/user_stories.md`](docs/specifications/sqlite_adapter/user_stories.md), including connecting to the database, initializing the schema, configuring retry logic, executing SQL queries, preventing SQL injection, setting query timeouts, and handling database errors.
*   **Edge Cases:** All edge cases defined in [`docs/specifications/sqlite_adapter/edge_cases.md`](docs/specifications/sqlite_adapter/edge_cases.md), including invalid database paths, invalid schema paths, database connection failures, schema execution errors, concurrent access, null/empty SQL queries, SQL injection attempts, query timeouts, deadlocks, database connection loss, and invalid parameter types.

**AI Verifiable End Results:**

*   Successful connection to the database with valid parameters.
*   Correct application of the database schema.
*   Execution of valid SQL queries and retrieval of correct results.
*   Prevention of SQL injection attacks.
*   Graceful handling of database errors and edge cases.
*   Adherence to performance and reliability requirements.

## 3. Test Strategy

This test plan follows the London School TDD approach, emphasizing interaction-based testing and verifying observable outcomes. Key aspects of the strategy include:

*   **London School TDD:** Tests are written before the implementation, focusing on the desired behavior and interactions of the `SQLiteAdapter`.
*   **Mocking Collaborators:** External dependencies, such as the `sqlite3` library and file system operations, are mocked to isolate the `SQLiteAdapter` and ensure focused testing.
*   **Interaction Verification:** Tests verify that the `SQLiteAdapter` interacts correctly with its collaborators (e.g., calls the `sqlite3` library with the correct parameters).
*   **State Verification:** Tests verify that the `SQLiteAdapter`'s internal state is updated correctly (e.g., `isConnected` flag is set appropriately).
*   **Outcome Verification:** Tests verify the observable outcomes of the `SQLiteAdapter`'s operations (e.g., exceptions are thrown for invalid inputs, query results are returned correctly).

## 4. Test Cases

### 4.1 Constructor

#### 4.1.1 FR.1.1-- Invalid dbPath (Null or Empty)

*   **Description:** Tests that an `ArgumentException` is thrown when the `dbPath` is null or empty.
*   **Steps:**
    1.  Attempt to create an `SQLiteAdapter` instance with a null `dbPath`.
    2.  Attempt to create an `SQLiteAdapter` instance with an empty `dbPath`.
*   **Expected Result:** An `ArgumentException` is thrown in both cases.
*   **AI Verifiable Outcome:** Verify that the constructor throws an `ArgumentException` with a specific error message indicating the invalid `dbPath`.

#### 4.1.2 FR.1.2-- Invalid dbPath (Invalid Characters)

*   **Description:** Tests that an `ArgumentException` is thrown when the `dbPath` contains invalid characters.
*   **Steps:**
    1.  Attempt to create an `SQLiteAdapter` instance with a `dbPath` containing invalid characters (e.g., `C:\path:to*file?.db`).
*   **Expected Result:** An `ArgumentException` is thrown.
*   **AI Verifiable Outcome:** Verify that the constructor throws an `ArgumentException` with a specific error message indicating the invalid characters in the `dbPath`.

#### 4.1.3 FR.2.1-- Valid dbPath Assignment

*   **Description:** Tests that the `dbPath` parameter is correctly assigned to the `this.dbPath` property.
*   **Steps:**
    1.  Create an `SQLiteAdapter` instance with a valid `dbPath`.
*   **Expected Result:** The `this.dbPath` property is assigned the value of the provided `dbPath`.
*   **AI Verifiable Outcome:** Verify that `this.dbPath` is equal to the provided `dbPath`.

#### 4.1.4 FR.2.2-- schemaPath Assignment (Provided and Default)

*   **Description:** Tests that the `schemaPath` parameter is correctly assigned to the `this.schemaPath` property, or defaults to `DEFAULT_SCHEMA_PATH` if not provided.
*   **Steps:**
    1.  Create an `SQLiteAdapter` instance with a valid `schemaPath`.
    2.  Create an `SQLiteAdapter` instance without a `schemaPath`.
*   **Expected Result:**
    1.  `this.schemaPath` is assigned the value of the provided `schemaPath`.
    2.  `this.schemaPath` is assigned the value of `DEFAULT_SCHEMA_PATH` ("schema/database_schema.sql").
*   **AI Verifiable Outcome:**
    1.  Verify that `this.schemaPath` is equal to the provided `schemaPath`.
    2.  Verify that `this.schemaPath` is equal to `DEFAULT_SCHEMA_PATH`.

#### 4.1.5 FR.2.3-- maxRetries Assignment (Provided and Default)

*   **Description:** Tests that the `maxRetries` parameter is correctly assigned to the `this.maxRetries` property, or defaults to `DEFAULT_MAX_RETRIES` (5) if not provided.
*   **Steps:**
    1.  Create an `SQLiteAdapter` instance with a valid `maxRetries`.
    2.  Create an `SQLiteAdapter` instance without a `maxRetries`.
*   **Expected Result:**
    1.  `this.maxRetries` is assigned the value of the provided `maxRetries`.
    2.  `this.maxRetries` is assigned the value of `DEFAULT_MAX_RETRIES` (5).
*   **AI Verifiable Outcome:**
    1.  Verify that `this.maxRetries` is equal to the provided `maxRetries`.
    2.  Verify that `this.maxRetries` is equal to `DEFAULT_MAX_RETRIES`.

#### 4.1.6 FR.2.4-- retryIntervalMs Assignment (Provided and Default)

*   **Description:** Tests that the `retryIntervalMs` parameter is correctly assigned to the `this.retryIntervalMs` property, or defaults to `DEFAULT_RETRY_INTERVAL_MS` (1000) if not provided.
*   **Steps:**
    1.  Create an `SQLiteAdapter` instance with a valid `retryIntervalMs`.
    2.  Create an `SQLiteAdapter` instance without a `retryIntervalMs`.
*   **Expected Result:**
    1.  `this.retryIntervalMs` is assigned the value of the provided `retryIntervalMs`.
    2.  `this.retryIntervalMs` is assigned the value of `DEFAULT_RETRY_INTERVAL_MS` (1000).
*   **AI Verifiable Outcome:**
    1.  Verify that `this.retryIntervalMs` is equal to the provided `retryIntervalMs`.
    2.  Verify that `this.retryIntervalMs` is equal to `DEFAULT_RETRY_INTERVAL_MS`.

#### 4.1.7 FR.3.1: Database Connection Success

*   **Description:** Tests that the database connection is established within `this.maxRetries` attempts.
*   **Steps:**
    1.  Create an `SQLiteAdapter` instance with a valid `dbPath`.
*   **Expected Result:** The database connection is established within `this.maxRetries` attempts.
*   **AI Verifiable Outcome:** Verify that `this.isConnected` is set to `TRUE`. Mock the `CONNECT_TO_DATABASE` function to simulate successful connections.

#### 4.1.8 FR.3.2: Database Connection Failure

*   **Description:** Tests that a `DatabaseConnectionError` is thrown if the connection fails after `this.maxRetries` attempts.
*   **Steps:**
    1.  Create an `SQLiteAdapter` instance with a valid `dbPath`, but simulate connection failures.
*   **Expected Result:** A `DatabaseConnectionError` is thrown after `this.maxRetries` attempts.
*   **AI Verifiable Outcome:** Verify that the constructor throws a `DatabaseConnectionError`. Mock the `CONNECT_TO_DATABASE` function to simulate connection failures for all retry attempts.

#### 4.1.9 FR.4.1 - FR.4.5: Schema Application

*   **Description:** Tests that the schema is read from the file, executed against the database, and handles errors correctly.
*   **Steps:**
    1.  Create an `SQLiteAdapter` instance with a valid `dbPath` and `schemaPath`.
    2.  Create an `SQLiteAdapter` instance with a valid `dbPath` and `schemaPath` containing invalid SQL.
*   **Expected Result:**
    1.  The schema is read from the file at `this.schemaPath` and executed against the database.
    2.  A `SchemaExecutionError` is thrown if the schema execution fails.  All schema operations are performed within a transaction, and if schema execution fails, the transaction is rolled back.
*   **AI Verifiable Outcome:**
    1.  Mock `READ_FILE` and `EXECUTE_SQL` to verify that the schema is read and executed. Verify that no `SchemaExecutionError` is thrown.
    2.  Mock `READ_FILE` to return invalid SQL. Verify that a `SchemaExecutionError` is thrown. Mock `MANAGE_TRANSACTION` to verify that rollback is called.

#### 4.1.10 FR.5.1 - FR.5.3: Database Connection Check Timer

*   **Description:** Tests that the constructor sets up a timer that periodically checks the database connection.
*   **Steps:**
    1.  Create an `SQLiteAdapter` instance.
*   **Expected Result:** The `CHECK_DATABASE_CONNECTION` method is called every `connectionCheckIntervalMs` (defaulting to 5000ms if not provided). The timer is set up using the `SET_INTERVAL` function.
*   **AI Verifiable Outcome:** Mock the `SET_INTERVAL` function to verify that it's called with the correct parameters (the `CHECK_DATABASE_CONNECTION` method and the `connectionCheckIntervalMs`).

### 4.2 Query Method

#### 4.2.1 FR.6.1: Null or Empty SQL Query

*   **Description:** Tests that an `ArgumentException` is thrown if the `sql` parameter is null or empty.
*   **Steps:**
    1.  Call the `query` method with a null `sql` parameter.
    2.  Call the `query` method with an empty `sql` parameter.
*   **Expected Result:** An `ArgumentException` is thrown in both cases.
*   **AI Verifiable Outcome:** Verify that the `query` method throws an `ArgumentException` with a specific error message indicating the invalid `sql` parameter.

#### 4.2.2 FR.7.1 - FR.7.3: SQL Injection Prevention

*   **Description:** Tests that the `query` method prevents SQL injection attacks by using parameterized queries.
*   **Steps:**
    1.  Call the `query` method with an `sql` parameter containing malicious SQL code and a `params` parameter.
*   **Expected Result:** The malicious code is not executed. The `PREPARE_STATEMENT` and `BIND_PARAMETERS` functions are used to prepare the query.
*   **AI Verifiable Outcome:** Mock the `PREPARE_STATEMENT`, `BIND_PARAMETERS`, and `EXECUTE_STATEMENT` functions to verify that the SQL query is prepared and executed with the provided parameters, and that no SQL injection occurs. Verify that String concatenation is NOT used to build the SQL query.

#### 4.2.3 FR.8.1 - FR.8.3: Query Timeout

*   **Description:** Tests that the `query` method implements a timeout mechanism to prevent long-running queries from blocking the application.
*   **Steps:**
    1.  Call the `query` method with an `sql` parameter that simulates a long-running query.
*   **Expected Result:** The query is aborted after `queryTimeoutMs` (30000ms). The `ABORT_QUERY` function is called.
*   **AI Verifiable Outcome:** Mock the `SET_GENERIC_TIMER`, `CLEAR_GENERIC_TIMER`, and `ABORT_QUERY` functions to verify that the timeout mechanism is working correctly.

#### 4.2.4 FR.9.1 - FR.9.3: Query Execution

*   **Description:** Tests that the `query` method executes the provided SQL query and returns the results.
*   **Steps:**
    1.  Call the `query` method with a valid `sql` parameter and a `params` parameter.
*   **Expected Result:** The prepared statement is executed using the `EXECUTE_STATEMENT` function. The result is processed using the `PROCESS_RESULT` function. The processed result is returned as a `Promise.resolve`.
*   **AI Verifiable Outcome:** Mock the `PREPARE_STATEMENT`, `BIND_PARAMETERS`, `EXECUTE_STATEMENT`, and `PROCESS_RESULT` functions to verify that the query is executed correctly and the results are processed and returned.

#### 4.2.5 FR.10.1 - FR.10.2: Error Handling and Retry Logic

*   **Description:** Tests that the `query` method handles potential errors during query execution, including deadlock errors.
*   **Steps:**
    1.  Call the `query` method with an `sql` parameter that simulates a deadlock error.
    2.  Call the `query` method with an `sql` parameter that simulates a `QueryExecutionError` (other than `DeadlockError`).
*   **Expected Result:**
    1.  If a `DeadlockError` occurs and the retry count is less than `MAX_QUERY_RETRIES`, the query is retried after a backoff period.
    2.  If a `QueryExecutionError` occurs (other than `DeadlockError`) or the retry count exceeds `MAX_QUERY_RETRIES`, a `QueryExecutionError` is thrown.
*   **AI Verifiable Outcome:** Mock the `EXECUTE_STATEMENT` function to simulate deadlock errors and other query execution errors. Verify that the query is retried for deadlock errors and that a `QueryExecutionError` is thrown for other errors or when the retry count exceeds `MAX_QUERY_RETRIES`.

#### 4.2.6 FR.11.1: Statement Finalization

*   **Description:** Tests that the `query` method finalizes the prepared statement to release resources.
*   **Steps:**
    1.  Call the `query` method with a valid `sql` parameter.
*   **Expected Result:** The prepared statement is finalized using the `FINALIZE_STATEMENT` function in the `FINALLY` block.
*   **AI Verifiable Outcome:** Mock the `FINALIZE_STATEMENT` function to verify that it's called after the query execution, regardless of whether the query succeeds or fails.

## 5. Regression Testing

A recursive regression testing strategy will be employed to ensure that new changes do not negatively impact existing functionality. This involves:

*   **Full Test Suite Execution:** After each code change, the entire test suite will be executed to verify that all existing functionality remains intact.
*   **Targeted Testing:** In addition to the full test suite, targeted tests will be executed to specifically test the areas affected by the code change.
*   **Automated Testing:** All regression tests will be automated to ensure that they can be executed quickly and efficiently.
*   **Continuous Integration:** Regression tests will be integrated into the continuous integration pipeline to provide early feedback on code changes.

## 6. Edge Case Testing

Edge case testing will focus on identifying and testing unusual or unexpected inputs and situations that could cause the `SQLiteAdapter` to fail. This involves:

*   **Boundary Value Analysis:** Testing the limits of input parameters (e.g., minimum and maximum values for `maxRetries` and `retryIntervalMs`).
*   **Invalid Input Testing:** Testing with invalid or malformed inputs (e.g., invalid database paths, SQL queries with syntax errors).
*   **Error Injection:** Intentionally injecting errors to test the `SQLiteAdapter`'s error handling capabilities (e.g., simulating database connection failures, schema execution errors, deadlock errors).
*   **Concurrency Testing:** Testing the `SQLiteAdapter`'s behavior under concurrent access (e.g., multiple threads or processes accessing the database simultaneously).

## 7. Chaos Testing

Chaos testing will involve intentionally introducing failures and disruptions into the system to test the `SQLiteAdapter`'s resilience and fault tolerance. This involves:

*   **Database Server Failures:** Simulating database server outages or restarts.
*   **Network Disruptions:** Simulating network latency, packet loss, or disconnections.
*   **Resource Exhaustion:** Simulating resource exhaustion (e.g., CPU, memory, disk space).
*   **Process Termination:** Intentionally terminating the `SQLiteAdapter` process.

The goal of chaos testing is to identify weaknesses in the `SQLiteAdapter`'s design and implementation and to ensure that it can gracefully handle failures and disruptions without data loss or corruption.

## 8. Conclusion

This test plan provides a comprehensive framework for testing the `SQLiteAdapter` class. By following the strategies and test cases outlined in this document, we can ensure that the `SQLiteAdapter` meets its functional and non-functional requirements and is reliable, secure, and performant.