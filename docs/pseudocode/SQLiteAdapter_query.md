# Pseudocode-- `SQLiteAdapter.query`

**Method Signature:** `query(sql: string, params: any[]): Promise<any[]>`

**Description:** Executes a given SQL query with optional parameters and returns the results. It implements a retry mechanism for connection-related failures.

---

**BEGIN** `query` method

  **PROMISE**(resolve, reject)

    **DECLARE** `statement` = `null`
    **DECLARE** `retryAttempted` = `FALSE`

    // 1. **Input Validation**
    //    Ensure the SQL query string is valid before proceeding.
    **IF** `sql` is `null` OR `sql` is `empty` **THEN**
      `LOG("Error-- SQL query cannot be null or empty.", "ERROR")`
      `REJECT` with new `Error("SQL query cannot be null or empty.")`
      **RETURN**
    **END IF**

    **FUNCTION** `executeQuery`()
      **TRY**
        // 2. **Execution Logic**
        `LOG("Executing query-- " + sql, "INFO")`

        // 2.1. **Prepare the Statement**
        `statement` = `PREPARE_STATEMENT(self.db, sql)`

        // 2.2. **Bind Parameters**
        **IF** `params` exists AND has items **THEN**
          `BIND_PARAMETERS(statement, params)`
        **END IF**

        // 2.3. **Execute the Statement**
        `raw_result` = `EXECUTE_STATEMENT(statement)`

        // 2.4. **Process the Result**
        `processed_result` = `PROCESS_RESULT(raw_result)`

        // 2.5. **Resolve the Promise**
        `RESOLVE(processed_result)`

      **CATCH** `error`
        // 3. **Error Handling & Retry Logic**
        `LOG("Query failed-- " + error.message, "WARN")`

        // 3.1. **Check if Error is Connection-Related and if Retry is Possible**
        **IF** `IS_CONNECTION_ERROR(error)` AND `retryAttempted` is `FALSE` **THEN**
          `LOG("Connection error detected. Attempting to reconnect and retry.", "WARN")`
          `retryAttempted` = `TRUE`

          **TRY**
            // 3.1.1. **Attempt Reconnection**
            `CALL` `CHECK_DATABASE_CONNECTION()` // This will throw if it fails
            `LOG("Reconnection successful. Retrying query.", "INFO")`

            // 3.1.2. **Retry the Query**
            // Clear previous statement before retrying
            **IF** `statement` is not `null` **THEN**
              `FINALIZE_STATEMENT(statement)`
              `statement` = `null`
            **END IF**
            `executeQuery()` // Recursive call to retry
          **CATCH** `reconnectError`
            // 3.1.3. **Handle Reconnection Failure**
            `LOG("Failed to reconnect-- " + reconnectError.message, "ERROR")`
            `REJECT(reconnectError)` // Reject with the reconnection error
          **END TRY**

        **ELSE**
          // 3.2. **Handle Non-Connection Error or Failed Retry**
          `LOG("Failed to execute query (non-recoverable)-- " + error.message, "ERROR")`
          `REJECT(error)`
        **END IF**

      **FINALLY**
        // 4. **Resource Cleanup**
        //    Ensure the prepared statement is always finalized if it exists.
        **IF** `statement` is not `null` **THEN**
          `FINALIZE_STATEMENT(statement)`
          `LOG("Statement finalized.", "DEBUG")`
        **END IF**

    **END FUNCTION** `executeQuery`

    // Initial execution
    `executeQuery()`

  **END PROMISE**

**END** `query` method

---

### Helper Functions Used--

-   `IS_CONNECTION_ERROR(error)`: Checks if an error object indicates a database connection issue (e.g., `SQLITE_BUSY`, `SQLITE_IOERR`).
-   `CHECK_DATABASE_CONNECTION()`: Verifies and re-establishes the database connection if needed.
-   `LOG(message, level)`: Logs messages for debugging and monitoring.
-   `PREPARE_STATEMENT(db, sql)`: Creates a prepared SQL statement.
-   `BIND_PARAMETERS(statement, params)`: Binds parameters to the statement.
-   `EXECUTE_STATEMENT(statement)`: Runs the prepared statement.
-   `PROCESS_RESULT(result)`: Formats the raw query result.
-   `FINALIZE_STATEMENT(statement)`: Cleans up the statement resources.