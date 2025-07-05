# Pseudocode-- SQLiteAdapter.CHECK_DATABASE_CONNECTION

## Method-- CHECK_DATABASE_CONNECTION

### Description
Ensures the database connection is active by performing a lightweight "ping" query. If the connection is lost, it attempts to reconnect using a retry mechanism with exponential backoff.

### Parameters
- None

### Returns
- `void`

### Throws
- `DatabaseConnectionError`-- If the connection check or reconnection fails after all retry attempts.

### Class Properties Used
- `db`-- The database connection object.
- `dbPath`-- The path to the database file.
- `isConnected`-- A boolean flag indicating the connection status.
- `maxRetries`-- The maximum number of times to attempt reconnection.
- `retryIntervalMs`-- The base interval for retry attempts in milliseconds.

### Helper Functions Used
- `LOG(message, level)`-- For logging information.
- `EXECUTE_PING_QUERY(db)`-- Executes a simple, fast query like `SELECT 1`.
- `CONNECT_TO_DATABASE(dbPath)`-- To establish a new database connection.
- `CALCULATE_BACKOFF_TIME(retries, intervalMs)`-- To calculate the wait time for the next retry.
- `MANAGE_TIMER(timerId, action, callback, delayMs)`-- To wait for a specified duration (simulating a sleep/delay).

---

### Logic

1.  **START METHOD `CHECK_DATABASE_CONNECTION`**

2.  **Verify Connection with a Ping Query**
    - `LOG("Verifying database connection with a ping query.", "INFO")`
    - **TRY**
        - `EXECUTE_PING_QUERY(this.db)`
        - `LOG("Connection is alive.", "INFO")`
        - SET `this.isConnected` = `true`
        - **RETURN** // Connection is healthy, no further action needed.
    - **CATCH** `pingError`
        - `LOG("Ping query failed. Connection may be stale. Error: " + pingError.message, "WARN")`
        - SET `this.isConnected` = `false`
        - // Proceed to reconnection logic below.

3.  **Initialize Reconnection Loop**
    - `LOG("Attempting to reconnect to the database...", "WARN")`
    - DECLARE `retries` = 0

4.  **BEGIN a loop** that continues as long as `retries` < `this.maxRetries`.

    a.  **TRY to connect to the database--**
        i.   `LOG("Connection attempt " + (retries + 1) + " of " + this.maxRetries + ".", "INFO")`
        ii.  SET `newDbConnection` = `CONNECT_TO_DATABASE(this.dbPath)`

    b.  **IF the connection is successful (`newDbConnection` is not null/invalid)--**
        i.   SET `this.db` = `newDbConnection`
        ii.  SET `this.isConnected` = `true`
        iii. `LOG("Successfully reconnected to the database.", "INFO")`
        iv.  **EXIT LOOP**

    c.  **ELSE (connection failed)--**
        i.   INCREMENT `retries` by 1.
        ii.  `LOG("Connection attempt " + retries + " failed.", "WARN")`
        iii. **IF `retries` >= `this.maxRetries` THEN--**
            -   BREAK LOOP (to proceed to the final error throw)
        iv.  **ELSE (more retries are available)--**
            -   CALCULATE `backoffTime` = `CALCULATE_BACKOFF_TIME(retries, this.retryIntervalMs)`
            -   `LOG("Waiting for " + backoffTime + "ms before next retry.", "INFO")`
            -   CALL `MANAGE_TIMER` to wait for `backoffTime` milliseconds. This is a blocking wait/sleep.

5.  **END LOOP**

6.  **Post-Loop Final Check**
    -   IF `this.isConnected` is `false` THEN
        -   `LOG("Failed to reconnect to the database after " + this.maxRetries + " attempts.", "ERROR")`
        -   **THROW** a new `DatabaseConnectionError` with the message "Unable to establish a connection to the database."

7.  **END METHOD**