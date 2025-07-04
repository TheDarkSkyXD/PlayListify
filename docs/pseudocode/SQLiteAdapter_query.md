# SQLiteAdapter_query.md

## Description

Executes a SQL query with optional parameters.

## Inputs

*   `sql`: `string` - The SQL query to execute.
*   `params`: `any[]` - An array of parameters to bind to the query.

## Outputs

*   `Promise<any[]>` - A promise that resolves to an array of rows returned by the query. The structure of the returned rows depends on the query executed.

## Pseudocode

```
CLASS SQLiteAdapter

  METHOD query(sql: string, params: any[])

    -- INPUT VALIDATION
    IF sql IS NULL OR sql IS EMPTY THEN
      ERROR("SQL query cannot be null or empty.")
      RETURN Promise.reject("SQL query cannot be null or empty.")
    ENDIF

    -- SQL INJECTION PREVENTION (PARAMETERIZED QUERIES)
    -- The database library should handle proper escaping and parameter binding.
    -- DO NOT use string concatenation to build the SQL query.

    -- TIMEOUT LOGIC
    queryTimeoutMs = 30000 -- 30 seconds
    timerId = SET_GENERIC_TIMER(ABORT_QUERY(this.db, statement), queryTimeoutMs)

    TRY
      -- PREPARE STATEMENT (Using parameterized query)
      statement = PREPARE_STATEMENT(this.db, sql)

      -- BIND PARAMETERS (Using database library's binding mechanism)
      IF params IS NOT NULL AND params.length > 0 THEN
        BIND_PARAMETERS(statement, params)
      ENDIF

      -- EXECUTE QUERY
      result = EXECUTE_STATEMENT(statement)

      -- CLEAR TIMEOUT TIMER
      CLEAR_GENERIC_TIMER(timerId)

      -- PROCESS RESULT
      rows = PROCESS_RESULT(result)

      RETURN Promise.resolve(rows)

    CATCH (QueryExecutionError e)
      -- CLEAR TIMEOUT TIMER
      CLEAR_GENERIC_TIMER(timerId)

      -- ERROR HANDLING AND RETRY LOGIC (Example)
      IF e IS DeadlockError AND retryCount < MAX_QUERY_RETRIES THEN
        WAIT(CALCULATE_BACKOFF_TIME(retryCount,RETRY_INTERVAL_MS))
        retryCount = retryCount + 1
        LOG("Retrying query due to deadlock. Retry count: " + retryCount)
        RETURN this.query(sql, params) -- Recursive call to retry the query
      ELSE
        ERROR("Query execution failed. Error: " + e.message)
        RETURN Promise.reject("Query execution failed. Error: " + e.message)
      ENDIF

    FINALLY
      -- FINALIZE STATEMENT
      FINALIZE_STATEMENT(statement)

    END_TRY

  END_METHOD

  -- HELPER FUNCTIONS (EXAMPLES)

  FUNCTION PREPARE_STATEMENT(db: sqlite3.Database, sql: string)
    -- Implementation depends on the SQLite library being used.
    -- This should prepare the SQL statement for execution.
    -- Example: return db.prepare(sql);
    RETURN db.prepare(sql) -- Placeholder, replace with actual statement preparation logic
  END_FUNCTION

  FUNCTION BIND_PARAMETERS(statement: sqlite3.Statement, params: any[])
    -- Implementation depends on the SQLite library being used.
    -- This should bind the parameters to the prepared statement.
    -- Example: statement.bind(params);
    statement.bind(params) -- Placeholder, replace with actual parameter binding logic
  END_FUNCTION

  FUNCTION EXECUTE_STATEMENT(statement: sqlite3.Statement)
    -- Implementation depends on the SQLite library being used.
    -- This should execute the prepared statement.
    -- Example: return statement.all();
    RETURN statement.all() -- Placeholder, replace with actual statement execution logic
  END_FUNCTION

  FUNCTION PROCESS_RESULT(result: any)
    -- Implementation depends on the SQLite library being used and the query executed
    -- This should process the result from the executed statement.
    -- Example: return result.rows;
    RETURN result.rows -- Placeholder, replace with actual result processing logic
  END_FUNCTION

  FUNCTION FINALIZE_STATEMENT(statement: sqlite3.Statement)
    -- Implementation depends on the SQLite library being used.
    -- This should finalize the prepared statement, releasing resources.
    -- Example: statement.finalize();
    statement.finalize() -- Placeholder, replace with actual statement finalization logic
  END_FUNCTION

  FUNCTION SET_GENERIC_TIMER(callback: function, delayMs: integer)
    -- Implementation depends on the environment (e.g., Node.js, browser).
    -- This should set up a timer that calls the callback function after delayMs milliseconds.
    -- Example: return setTimeout(callback, delayMs);
    RETURN setTimeout(callback, delayMs) -- Placeholder, replace with actual timer setup
  END_FUNCTION

  FUNCTION CLEAR_GENERIC_TIMER(timerId: any)
    -- Implementation depends on the environment (e.g., Node.js, browser).
    -- This should clear the timer with the given ID.
    -- Example: clearTimeout(timerId);
    clearTimeout(timerId) -- Placeholder, replace with actual timer clearing logic
  END_FUNCTION

  FUNCTION ABORT_QUERY(db: sqlite3.Database, statement: sqlite3.Statement)
    -- Implementation depends on the SQLite library being used.
    -- This should abort the currently executing query.
    -- It might involve interrupting the database connection or the statement.
    -- Example: statement.interrupt();
    statement.interrupt() -- Placeholder, replace with actual query abort logic
  END_FUNCTION

  FUNCTION CALCULATE_BACKOFF_TIME(retries: integer, intervalMs: integer)
    -- Implements an exponential backoff strategy.
    -- time = intervalMs * (2 ** retries)
    RETURN intervalMs * (2 ** retries)
  END_FUNCTION

  -- REMOVE IS_SQL_SAFE FUNCTION
  -- This function is not safe and misleading. It should be removed.

  -- NOTE: The database connection should be closed when the SQLiteAdapter instance
  -- is no longer needed. This is not handled within the query method.
END_CLASS