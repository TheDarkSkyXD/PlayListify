# SQLiteAdapter Functional Requirements

This document details the functional requirements for the `SQLiteAdapter` class, including the constructor and `query` method. It also serves as the central repository for requirements that are referenced by other specification documents (e.g., Non-Functional Requirements, User Stories, Edge Cases).

## Constructor

### FR.1: Database Path Validation
**Description:** The constructor must validate the provided database path (`dbPath`).
**Success Criteria:**
**Success Criteria:**
*   FR.1.1: An `ArgumentException` is thrown if `dbPath` is null or empty.
*   FR.1.2: An `ArgumentException` is thrown if `dbPath` is not a valid path. A valid path is defined as a non-null, non-empty string that adheres to the following rules:
    *   It must not contain any invalid characters (e.g., \, :, *, ?, ", <, >, |).
    *   Forward slashes (/) are allowed as directory separators.
    *   It can be an absolute path (e.g., C:/path/to/database.db) or a relative path (e.g., ./database.db).
    *   UNC paths (e.g., //server/share/database.db) are also considered valid.
### FR.2: Parameter Assignment
**Description:** The constructor must assign the provided parameters to the corresponding properties. If parameters are null, default values must be used.
**Success Criteria:**
*   FR.2.1: `this.dbPath` is assigned the value of `dbPath`.
*   FR.2.2: `this.schemaPath` is assigned the value of `schemaPath` if provided, otherwise, it defaults to `DEFAULT_SCHEMA_PATH` ("schema/database_schema.sql").
*   FR.2.3: `this.maxRetries` is assigned the value of `maxRetries` if provided, otherwise, it defaults to `DEFAULT_MAX_RETRIES` (5).
*   FR.2.4: `this.retryIntervalMs` is assigned the value of `retryIntervalMs` if provided, otherwise, it defaults to `DEFAULT_RETRY_INTERVAL_MS` (1000).

### FR.3: Database Connection
**Description:** The constructor must establish a connection to the SQLite database at the specified `dbPath`. It should retry the connection multiple times with exponential backoff. This is to handle transient network issues or temporary database unavailability.
**Success Criteria:**
*   FR.3.1: The database connection is established within `this.maxRetries` attempts.
*   FR.3.2: `this.isConnected` is set to `TRUE` if the connection is successful.
*   FR.3.3: A `DatabaseConnectionError` is thrown if the connection fails after `this.maxRetries` attempts.

### FR.4: Schema Application
**Description:** The constructor must apply the database schema from the file specified in `this.schemaPath`.
**Success Criteria:**
*   FR.4.1: The schema is read from the file at `this.schemaPath`.
*   FR.4.2: The schema is executed against the database.
*   FR.4.3: A `SchemaExecutionError` is thrown if the schema execution fails.
*   FR.4.4: All schema operations are performed within a transaction.
*   FR.4.5: If schema execution fails, the transaction is rolled back.

### FR.5: Database Connection Check Timer
**Description:** The constructor must set up a timer that periodically checks the database connection. The interval should be configurable.
**Success Criteria:**
*   FR.5.1: The `CHECK_DATABASE_CONNECTION` method is called every `connectionCheckIntervalMs`. If the connection check fails, an error is logged, and the method attempts to reconnect to the database.
*   FR.5.2: The `connectionCheckIntervalMs` parameter defaults to 5000ms (5 seconds) if not provided.
*   FR.5.3: The timer is set up using the `SET_INTERVAL` function.

## Query Method

### FR.6: SQL Query Validation
**Description:** The `query` method must validate the provided SQL query.
**Success Criteria:**
**Success Criteria:**
*   FR.6.1: An `ArgumentException` is thrown if the `sql` parameter is null or empty.
### FR.7: SQL Injection Prevention
**Description:** The `query` method must prevent SQL injection attacks by using parameterized queries.
**Success Criteria:**
*   FR.7.1: The `sql` query is prepared using the `PREPARE_STATEMENT` function. `PREPARE_STATEMENT` is a helper function within the `SQLiteAdapter` that utilizes the `sqlite3` library's prepare method to create a prepared statement for parameterized queries.
*   FR.7.2: Parameters are bound to the prepared statement using the `BIND_PARAMETERS` function. `BIND_PARAMETERS` is a helper function within the `SQLiteAdapter` that binds the provided parameters to the prepared statement, ensuring proper escaping and preventing SQL injection.
*   FR.7.3: String concatenation is NOT used to build the SQL query. Instead, parameterized queries are used to prevent SQL injection attacks. This ensures that user-provided data is treated as data, not as executable code.

### FR.8: Query Timeout
**Description:** The `query` method must implement a timeout mechanism to prevent long-running queries from blocking the application.
**Success Criteria:**
*   FR.8.1: A timer is set up using `SET_GENERIC_TIMER` to call `ABORT_QUERY` after `queryTimeoutMs` (30000ms).
*   FR.8.2: The timer is cleared using `CLEAR_GENERIC_TIMER` when the query completes successfully or fails.
*   FR.8.3: The query is aborted using `ABORT_QUERY` if the timeout expires.

### FR.9: Query Execution
**Description:** The `query` method must execute the provided SQL query and return the results.
**Success Criteria:**
*   FR.9.1: The prepared statement is executed using the `EXECUTE_STATEMENT` function. `EXECUTE_STATEMENT` is a helper function within the `SQLiteAdapter` that executes the prepared statement using the `sqlite3` library's run/get/all methods.
*   FR.9.2: The result is processed using the `PROCESS_RESULT` function. `PROCESS_RESULT` is a helper function within the `SQLiteAdapter` that transforms the raw result from the `sqlite3` library into a standard array of objects.
*   FR.9.3: The processed result is returned as a `Promise.resolve`.

### FR.10: Error Handling and Retry Logic
**Description:** The `query` method must handle potential errors during query execution, including deadlock errors.
**Success Criteria:**
*   FR.10.1: If a `DeadlockError` occurs and the retry count is less than `MAX_QUERY_RETRIES`, the query is retried after a backoff period.
**Success Criteria:**
*   FR.10.2: If a `QueryExecutionError` occurs (other than `DeadlockError`) or the retry count exceeds `MAX_QUERY_RETRIES`, a `QueryExecutionError` is thrown.
### FR.11: Statement Finalization
**Description:** The `query` method must finalize the prepared statement to release resources.
**Success Criteria:**
*   FR.11.1: The prepared statement is finalized using the `FINALIZE_STATEMENT` function in the `FINALLY` block.