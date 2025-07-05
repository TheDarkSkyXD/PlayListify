# Pseudocode-- `SQLiteAdapter.query`

**Method Signature:** `query(sql: string, params: any[]): Promise<any[]>`

**Description:** Executes a given SQL query with optional parameters and returns the results. This method is asynchronous and ensures proper resource management and error handling.

---

**BEGIN** `query` method

  **PROMISE**(resolve, reject)

    **DECLARE** `statement` = `null`

    // 1. **Input Validation**
    //    Ensure the SQL query string is valid before proceeding.
    **IF** `sql` is `null` OR `sql` is `empty` **THEN**
      `LOG("Error-- SQL query cannot be null or empty.", "ERROR")`
      `REJECT` with new `Error("SQL query cannot be null or empty.")`
      **RETURN**
    **END IF**

    // 2. **Database Connection Check**
    //    Verify that the database connection is active.
    **CALL** `CHECK_DATABASE_CONNECTION()`
    // This helper function is expected to throw an error if the connection is not available,
    // which will be caught by the main CATCH block.

    **TRY**
      // 3. **Execution Logic**
      `LOG("Executing query-- " + sql, "INFO")`

      // 3.1. **Prepare the Statement**
      //      Create a prepared statement from the SQL string to prevent SQL injection.
      `statement` = `PREPARE_STATEMENT(self.db, sql)`

      // 3.2. **Bind Parameters**
      //      Bind the provided parameters to the prepared statement.
      **IF** `params` exists AND has items **THEN**
        `BIND_PARAMETERS(statement, params)`
      **END IF**

      // 3.3. **Execute the Statement**
      //      Run the prepared statement against the database.
      `raw_result` = `EXECUTE_STATEMENT(statement)`

      // 3.4. **Process the Result**
      //      Convert the raw database result into a clean array of objects.
      `processed_result` = `PROCESS_RESULT(raw_result)`

      // 3.5. **Resolve the Promise**
      //      Return the final result to the caller.
      `RESOLVE(processed_result)`

    **CATCH** `error`
      // 4. **Error Handling**
      //    If any step in the TRY block fails, log the error and reject the promise.
      `LOG("Failed to execute query-- " + error.message, "ERROR")`
      `REJECT(error)`

    **FINALLY**
      // 5. **Resource Cleanup**
      //    Ensure the prepared statement is always finalized to free up resources,
      //    preventing memory leaks.
      **IF** `statement` is not `null` **THEN**
        `FINALIZE_STATEMENT(statement)`
        `LOG("Statement finalized.", "DEBUG")`
      **END IF**

  **END PROMISE**

**END** `query` method

---

### Helper Functions Used--

-   `CHECK_DATABASE_CONNECTION()`: Verifies the database is connected.
-   `LOG(message, level)`: Logs messages for debugging and monitoring.
-   `PREPARE_STATEMENT(db, sql)`: Creates a prepared SQL statement.
-   `BIND_PARAMETERS(statement, params)`: Binds parameters to the statement.
-   `EXECUTE_STATEMENT(statement)`: Runs the prepared statement.
-   `PROCESS_RESULT(result)`: Formats the raw query result.
-   `FINALIZE_STATEMENT(statement)`: Cleans up the statement resources.