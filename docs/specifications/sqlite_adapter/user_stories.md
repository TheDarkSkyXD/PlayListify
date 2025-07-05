# SQLiteAdapter User Stories

This document details the user stories for the `SQLiteAdapter` class. Refer to [`docs/specifications/sqlite_adapter/functional_requirements.md`](docs/specifications/sqlite_adapter/functional_requirements.md) for functional requirements.

## Constructor

### US.1: As a developer, I want to provide a database path so that the SQLiteAdapter can connect to the correct database.
**Description:** This user story focuses on the basic need to specify the database location.
**Acceptance Criteria:**
*   The `SQLiteAdapter` constructor accepts a `dbPath` parameter.
*   The `SQLiteAdapter` connects to the database specified by `dbPath`.

### US.2: As a developer, I want to provide a schema path so that the SQLiteAdapter can initialize the database with the correct schema.
**Description:** This user story focuses on the ability to initialize the database schema.
**Acceptance Criteria:**
*   The `SQLiteAdapter` constructor accepts a `schemaPath` parameter.
*   The `SQLiteAdapter` applies the schema from the file specified by `schemaPath`.
*   If `schemaPath` is not provided, it defaults to `DEFAULT_SCHEMA_PATH` ("schema/database_schema.sql").

### US.3: As a system administrator, I want to configure the maximum number of retries and retry interval so that the SQLiteAdapter can handle transient database connection errors.
**Description:** This user story focuses on the ability to configure the retry logic.
**Acceptance Criteria:**
*   The `SQLiteAdapter` constructor accepts `maxRetries` and `retryIntervalMs` parameters.
*   The `SQLiteAdapter` retries the database connection up to `maxRetries` times with a delay of `retryIntervalMs` milliseconds. `maxRetries` must be within the range of 0 to 10, and `retryIntervalMs` must be within the range of 100 to 10000.
*   If `maxRetries` and `retryIntervalMs` are not provided, default values are used (5 and 1000 respectively).

## Query Method

### US.4: As a developer, I want to execute SQL queries so that I can retrieve and manipulate data in the database.
**Description:** This user story focuses on the core functionality of executing SQL queries.
**Acceptance Criteria:**
*   The `SQLiteAdapter` provides a `query` method.
*   The `query` method accepts an `sql` parameter representing the SQL query to execute.
*   The `query` method returns a Promise that resolves with the query results.

### US.5: As a developer, I want to use parameterized queries so that I can prevent SQL injection attacks.
**Description:** This user story focuses on the security aspect of query execution.
**Acceptance Criteria:**
*   The `query` method supports parameterized queries.
*   The `query` method uses the `params` parameter to bind parameters to the SQL query.

### US.6: As a system administrator, I want to set a query timeout so that long-running queries do not block the application.
**Description:** This user story focuses on the ability to limit the execution time of queries.
**Acceptance Criteria:**
*   The `query` method implements a timeout mechanism.
*   The query is aborted if it exceeds the timeout.

### US.7: As a developer, I want to handle database errors gracefully so that the application does not crash.
**Description:** This user story focuses on error handling during query execution.
**Acceptance Criteria:**
*   The `query` method handles database errors (e.g., deadlock errors).
*   The `query` method retries queries that fail due to deadlock errors.
*   The `query` method returns a Promise.reject with an error message if the query fails.