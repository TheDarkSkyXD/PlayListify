# SQLiteAdapter Query Method Pseudocode

**Description:** Executes a SQL query with optional parameters.

**Inputs:**

*   `sql`: string -- The SQL query to execute.
*   `params`: any[] -- An array of parameters to bind to the query.

**Outputs:**

*   `Promise<any[]>` -- A promise that resolves to an array of rows returned by the query.

**Logic:**

```
FUNCTION query(sql, params)
  // 1. Create a new Promise to handle asynchronous execution.
  CREATE promise = new Promise( (resolve, reject) => {

    // 2. Attempt to execute the SQL query.
    TRY
      // 3. Prepare the SQL statement for execution.
      SET statement = PREPARE_SQL_STATEMENT(this.db, sql)

      // 4. Bind parameters to the prepared statement.
      BIND_PARAMETERS(statement, params)

      // 5. Execute the prepared statement and fetch all results.
      SET results = EXECUTE_QUERY(statement)

      // 6. Resolve the promise with the query results.
      resolve(results)

    CATCH (error)
      // 7. If an error occurs during query execution:
      //   Log the error message including the SQL query.
      LOG "Error executing query: " + sql + ": " + error.message

      // 8. Reject the promise with the error.
      reject(error)

    ENDTRY
  })

  // 9. Return the promise.
  RETURN promise
ENDFUNCTION