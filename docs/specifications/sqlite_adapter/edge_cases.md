# SQLiteAdapter Edge Cases

This document details the edge cases for the `SQLiteAdapter` class. Refer to [`docs/specifications/sqlite_adapter/functional_requirements.md`](docs/specifications/sqlite_adapter/functional_requirements.md) for functional requirements.

## Constructor

### EC.1: Invalid Database Path
**Description:** The `dbPath` parameter is invalid (e.g., incorrect format, non-existent directory, insufficient permissions).
**Expected Behavior:**
*   The constructor throws an `ArgumentException`.
*   The application logs the error.
*   Examples of invalid paths:
    *   Null or empty string
    *   Path containing invalid characters: `C:\path:to*file?.db`
    *   Path to a non-existent directory: `C:\nonexistent\database.db`
    *   Path with insufficient permissions

### EC.2: Invalid Schema Path
**Description:** The `schemaPath` parameter is invalid (e.g., incorrect format, non-existent file, insufficient permissions).
**Expected Behavior:**
*   The constructor throws a `SchemaExecutionError`.
*   The application logs the error.

### EC.3: Database Connection Failure (All Retries Exhausted)
**Description:** The database connection fails after all retry attempts. This could be due to a permanently unavailable database, incorrect credentials, or network issues.
**Expected Behavior:**
*   The constructor throws a `DatabaseConnectionError`.
*   The application logs the error.

### EC.4: Schema Execution Error
**Description:** The SQL schema in the file contains errors and cannot be executed.
**Expected Behavior:**
*   The constructor throws a `SchemaExecutionError`.
*   The application logs the error.
*   The transaction is rolled back.

### EC.5: Concurrent Access to Database during Schema Application
**Description:** Another process or thread attempts to access the database while the schema is being applied.
**Expected Behavior:**
*   The constructor handles the concurrent access gracefully by using SQLite's built-in locking mechanisms (e.g., exclusive locking). It is assumed that SQLite's locking mechanisms are sufficient to prevent data corruption during schema application. Further validation through integration testing is required to confirm this assumption.
*   The schema application completes successfully, or throws a specific `ConcurrencyError` if the locking mechanisms fail after a reasonable number of retries. Note: Consider using optimistic locking as an alternative concurrency control mechanism to handle concurrent access to the database during schema application.

## Query Method

### EC.6: Null or Empty SQL Query
**Description:** The `sql` parameter is null or empty.
**Expected Behavior:**
*   The `query` method returns a `Promise.reject` with an error message.
*   The application logs the error.

### EC.7: SQL Injection Attempt
**Description:** The `sql` parameter contains malicious SQL code.
**Expected Behavior:**
*   The `query` method prevents SQL injection by using parameterized queries.
*   The malicious code is not executed.
*   The application logs a security warning.

### EC.8: Query Timeout
**Description:** The query execution exceeds the configured timeout.
**Expected Behavior:**
*   The query is aborted.
*   The `query` method returns a `Promise.reject` with an error message.
*   The application logs the error.

### EC.9: Deadlock
**Description:** The query execution results in a deadlock.
**Expected Behavior:**
*   The `query` method retries the query.
*   If the deadlock persists after multiple retries, the `query` method returns a `Promise.reject` with an error message.
*   The application logs the error.

### EC.10: Database Connection Loss during Query Execution
**Description:** The database connection is lost while the query is being executed.
**Expected Behavior:**
*   The `query` method attempts to reconnect to the database.
*   If the reconnection is successful, the query is retried.
*   If the reconnection fails, the `query` method returns a `Promise.reject` with an error message.
*   The application logs the error.

### EC.11: Invalid Parameter Type
**Description:** One or more parameters provided in the `params` array are of an incorrect type.
**Expected Behavior:**
*   The `query` method returns a `Promise.reject` with an error message.
*   The application logs the error.