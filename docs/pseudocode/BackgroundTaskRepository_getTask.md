# Pseudocode for `BackgroundTaskRepository.getTask`

## Method: `getTask(id)`

**Description:** Retrieves a background task from the database by its unique ID.

**Parameters:**
- `id`: `integer` - The unique identifier for the task.

**Returns:** `Promise<BackgroundTask | null>` - A promise that resolves with the `BackgroundTask` object if found, otherwise `null`.

**Exceptions:**
- `ArgumentException`: Thrown if the `id` is not a positive integer.
- `DatabaseError`: Thrown if there is an error during the database query.

---

### **Pseudocode**

```plaintext
BEGIN_PROMISE(resolve, reject)

    -- 1. Input Validation
    -- Check if the provided 'id' is a valid positive integer.
    IF id IS NOT an integer OR id <= 0 THEN
        REJECT(new ArgumentException("Task ID must be a positive integer."))
        RETURN
    END_IF

    -- 2. Define Database Query
    -- Prepare the SQL statement to select the task by its ID.
    sql_query = "SELECT * FROM background_tasks WHERE id = ?;"
    query_params = [id]

    -- 3. Execute Database Operation in a Try...Catch block
    TRY
        -- Await the result from the database adapter's query method.
        result_array = AWAIT this.db.query(sql_query, query_params)

        -- 4. Process Query Result
        -- Check if any rows were returned.
        IF result_array IS EMPTY OR result_array.length == 0 THEN
            -- 4a. Task Not Found: Resolve the promise with null.
            RESOLVE(null)
        ELSE
            -- 4b. Task Found: Extract the first row (the task object).
            background_task = result_array[0]
            -- Resolve the promise with the found task object.
            RESOLVE(background_task)
        END_IF

    CATCH (database_error)
        -- 5. Handle Database Errors
        -- Log the error for debugging purposes.
        LOG "Error retrieving task from database in getTask: " + database_error.message
        -- Reject the promise with the original database error.
        REJECT(database_error)
    END_TRY

END_PROMISE