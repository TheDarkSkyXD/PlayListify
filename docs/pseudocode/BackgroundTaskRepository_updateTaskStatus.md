# Pseudocode-- `BackgroundTaskRepository.updateTaskStatus`

**Objective--** To update the status of a specific background task in the database, handle related side effects, and return the updated task object.

---

### **CLASS** `BackgroundTaskRepository`

---

### **METHOD** `updateTaskStatus(id, status)`

**Description--** Updates the status of a background task identified by its ID. It also handles setting completion timestamps and notifying other parts of the system.

**Parameters--**
*   `id` (Integer)-- The unique identifier for the task to be updated.
*   `status` (String)-- The new status for the task. Must be one of "QUEUED", "IN_PROGRESS", "COMPLETED", "FAILED", "CANCELLED".

**Returns--**
*   `Promise<BackgroundTask>`-- A promise that resolves with the fully updated `BackgroundTask` object, or rejects with an error (`ArgumentException`, `NotFoundException`, or a database error).

---

### **LOGIC**

`BEGIN PROMISE`

  `// 1. Input Validation`
  `DEFINE` `allowedStatuses` as `["QUEUED", "IN_PROGRESS", "COMPLETED", "FAILED", "CANCELLED"]`
  `IF` `id` is not a positive integer `OR` `status` is not a string `OR` `status` is empty `OR` `allowedStatuses` does not include `status`
    `REJECT` `Promise` with a new `ArgumentException("Invalid id or status provided.")`
    `RETURN`
  `END IF`

  `// 2. Database Operation`
  `TRY`
    `// 2a. Verify Task Existence and get original state`
    `AWAIT` `originalTask` = `this.getTask(id)`
    `IF` `originalTask` is `NULL`
      `REJECT` `Promise` with a new `NotFoundException("Task with id " + id + " not found.")`
      `RETURN`
    `END IF`

    `// 2b. Prepare the SQL Query`
    `DEFINE` `currentTime` = `CURRENT_SYSTEM_TIMESTAMP()`
    `DEFINE` `sqlQuery`
    `DEFINE` `queryParams`

    `IF` `status` is "COMPLETED" `OR` `status` is "FAILED"
      `sqlQuery` = `
        UPDATE background_tasks
        SET status = ?, updatedAt = ?, completedAt = ?
        WHERE id = ?
      `
      `queryParams` = `[status, currentTime, currentTime, id]`
    `ELSE`
      `sqlQuery` = `
        UPDATE background_tasks
        SET status = ?, updatedAt = ?
        WHERE id = ?
      `
      `queryParams` = `[status, currentTime, id]`
    `END IF`

    `// 2c. Execute Update`
    `AWAIT` `this.db.query(sqlQuery, queryParams)`

    `// 2d. Fetch the updated task to get all current fields`
    `AWAIT` `updatedTask` = `this.getTask(id)`

    `// 2e. Emit event for real-time updates (e.g., to the frontend)`
    `this.emitTaskUpdate(updatedTask)`

    `// 2f. Handle Parent Task Logic if a child task completes`
    `IF` `originalTask.parentId` is not `NULL` `AND` `status` is "COMPLETED"
      `AWAIT` `this.handleChildTaskCompletion(id)`
    `END IF`

    `// 2g. Resolve with the final updated task object`
    `RESOLVE` `Promise` with `updatedTask`

  `CATCH` `databaseError`
    `// 3. Error Handling`
    `LOG` "Database error in updateTaskStatus-- " + `databaseError.message`
    `REJECT` `Promise` with `databaseError`
  `END TRY`

`END PROMISE`

---
### **Helper Methods Called**

*   **`this.getTask(id)`**: Retrieves a single task by its ID.
*   **`this.db.query(sql, params)`**: Executes a SQL query against the database.
*   **`this.emitTaskUpdate(task)`**: Emits an event to notify listeners of a task update.
*   **`this.handleChildTaskCompletion(childId)`**: Handles logic when a child task is completed, potentially updating its parent.