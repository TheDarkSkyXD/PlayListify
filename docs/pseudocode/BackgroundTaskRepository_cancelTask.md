# Pseudocode-- `BackgroundTaskRepository.cancelTask`

## Description

Cancels a task by its ID, removing it from the active processing queue and updating its status to "CANCELLED" in the database.

## Signature

`cancelTask(id: integer): Promise<void>`

## Parameters

-   `id` (integer)-- The unique identifier for the task to be cancelled.

## Returns

-   `Promise<void>`-- A promise that resolves if the cancellation is successful or rejects with an error.

## Exceptions

-   `ArgumentException`-- Thrown if the `id` is not a positive integer.
-   `NotFoundException`-- Thrown if no task with the given `id` exists.

## Logic

`PROMISE(resolve, reject)`
    `-- Input Validation --`
    `IF id IS NOT a positive integer THEN`
        `REJECT(new ArgumentException("Task ID must be a positive integer."))`
        `RETURN`
    `END IF`

    `TRY`
        `-- 1. Fetch Task and Verify Existence --`
        `CONSTANT task = AWAIT this.getTask(id)`
        `IF task IS NULL THEN`
            `REJECT(new NotFoundException("Task with ID " + id + " not found."))`
            `RETURN`
        `END IF`

        `-- 2. Check if Task is Already in a Terminal State --`
        `CONSTANT terminalStatuses = ["COMPLETED", "FAILED", "CANCELLED"]`
        `IF terminalStatuses.includes(task.status) THEN`
            `LOG_WARNING("Attempted to cancel task " + id + " which is already in a terminal state: " + task.status)`
            `RESOLVE()`
            `RETURN`
        `END IF`

        `-- 3. Cancel from In-Memory Queue --`
        `LOG_INFO("Cancelling task " + id + " from the processing queue.")`
        `this.taskQueue.cancelById(id) -- Conceptual method to remove from p-queue`

        `-- 4. Update Database Status --`
        `LOG_INFO("Updating status of task " + id + " to CANCELLED in the database.")`
        `AWAIT this.updateTaskStatus(id, "CANCELLED")`

        `-- 5. Resolve Promise --`
        `RESOLVE()`

    `CATCH error`
        `-- 6. Error Handling --`
        `LOG_ERROR("Failed to cancel task " + id + ": " + error.message)`
        `REJECT(error)`
    `END TRY`
`END PROMISE`