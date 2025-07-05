# Pseudocode-- `BackgroundTaskRepository.updateTaskProgress`

## Description

This document outlines the pseudocode for the `updateTaskProgress` method. This method updates the progress percentage of a specific background task in the database, validates the input, and notifies the application of the change.

---

## Class-- BackgroundTaskRepository

### Method-- `updateTaskProgress(id, progress)`

**Purpose--** Updates the progress of an existing background task identified by its ID.

**Parameters--**
- `id`-- `INTEGER` -- The unique identifier for the task to be updated.
- `progress`-- `INTEGER` -- The new progress value for the task (must be between 0 and 100).

**Returns--**
- `PROMISE<BackgroundTask>` -- A promise that resolves with the fully updated `BackgroundTask` object upon success or rejects with an error.

---

### Pseudocode Logic

```pseudocode
FUNCTION updateTaskProgress(id, progress)
  RETURN NEW PROMISE((RESOLVE, REJECT) => {

    // 1. --- Input Validation ---
    IF id IS NOT a positive INTEGER OR id IS NULL
      REJECT(NEW ArgumentException("Invalid 'id' provided. Must be a positive integer."))
      RETURN
    END IF

    IF progress IS NOT a NUMBER OR progress < 0 OR progress > 100
      REJECT(NEW ArgumentException("Invalid 'progress' provided. Must be a number between 0 and 100."))
      RETURN
    END IF

    // 2. --- Database Operation ---
    TRY
      // 2.1 --- Verify Task Existence ---
      // AWAIT the result of checking if the task exists before proceeding.
      existingTask = AWAIT this.getTask(id)
      IF existingTask IS NULL
        REJECT(NEW NotFoundException(`Task with ID ${id} not found.`))
        RETURN
      END IF

      // 2.2 --- Prepare and Execute Update ---
      // Get the current time for the 'updatedAt' timestamp.
      currentTime = GET_CURRENT_ISO_TIMESTAMP()

      // Define the SQL query to update the task's progress.
      sql = "UPDATE background_tasks SET progress = ?, updatedAt = ? WHERE id = ?"
      params = [progress, currentTime, id]

      // AWAIT the database query to complete.
      AWAIT this.db.query(sql, params)

      // 2.3 --- Fetch Updated Task and Notify ---
      // Retrieve the full, updated task object from the database.
      updatedTask = AWAIT this.getTask(id)

      // Emit an event to notify other parts of the application (e.g., frontend).
      this.emitTaskUpdate(updatedTask)

      // 2.4 --- Resolve Promise ---
      // Fulfill the promise with the updated task data.
      RESOLVE(updatedTask)

    CATCH (error)
      // 3. --- Error Handling ---
      // Log the error for debugging purposes.
      LOG_ERROR("Failed to update task progress in database-- " + error.message)

      // Reject the promise with the database error.
      REJECT(error)
    END TRY
  })
END FUNCTION
```

### Supporting Methods

-   **`this.getTask(id)`**: A method (defined elsewhere) that retrieves a single task by its ID from the database.
-   **`this.db.query(sql, params)`**: A method on the `SQLiteAdapter` instance that executes a given SQL query with parameters.
-   **`this.emitTaskUpdate(task)`**: A method that uses the `appEmitter` to send an event (e.g., `'task-updated'`) with the task data as the payload.

### Error Handling

-   **`ArgumentException`**: Thrown if the `id` or `progress` parameters are invalid.
-   **`NotFoundException`**: Thrown if no task with the given `id` exists in the database.
-   **Database Errors**: Any errors from the `SQLiteAdapter` during the query execution will be caught and re-thrown, causing the promise to be rejected.