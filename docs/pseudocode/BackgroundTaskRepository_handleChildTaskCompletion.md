# Pseudocode-- `BackgroundTaskRepository.handleChildTaskCompletion`

## Description

Handles the completion of a child task within a database transaction to prevent race conditions. It updates the parent task's progress and sets a nuanced final status for the parent if all children are complete. This method ensures that parent task state accurately reflects the aggregate outcome of its children, distinguishing between successful completion, partial completion, and completion with errors.

## Parameters

-   `childTaskId`-- `integer` -- The unique identifier for the child task that has just completed.

## Return

-   `Promise<void>` -- A promise that resolves when the parent task has been successfully updated, or rejects with an error if the operation fails.

## Exceptions

-   `ArgumentException` -- Thrown if `childTaskId` is not a positive integer.
-   `TransactionException` -- Thrown if the database transaction fails.

## Structure

```plaintext
FUNCTION handleChildTaskCompletion(childTaskId)
  PROMISE((RESOLVE, REJECT) => {
    // --- Input Validation ---
    IF childTaskId IS NOT a positive integer THEN
      REJECT(new ArgumentException("Invalid childTaskId-- must be a positive integer."))
      RETURN
    END IF

    // --- Begin Atomic Transaction ---
    // Wrap the entire operation in a transaction to ensure atomicity and prevent race conditions.
    this.db.transaction(async (trx) => {
      TRY
        // --- Fetch Child Task & Parent ID (within transaction) ---
        // Use the provided transaction object 'trx' for all database operations.
        childTask = AWAIT trx.getTask(childTaskId)

        IF childTask IS NULL OR childTask.parentId IS NULL THEN
          LOG_WARNING("Child task with ID " + childTaskId + " not found or has no parent.")
          // No need to rollback, just exit gracefully.
          RETURN
        END IF

        parentId = childTask.parentId

        // --- Fetch & Lock All Sibling Tasks ---
        // Get all tasks sharing the same parent and lock them for the duration of the transaction
        // to prevent other updates from causing inconsistent progress calculation.
        // NOTE-- 'FOR UPDATE' is a standard SQL feature but syntax may vary between DB systems.
        siblingTasksQuery = "SELECT id, status FROM background_tasks WHERE parentId = ? FOR UPDATE"
        allSiblingTasks = AWAIT trx.query(siblingTasksQuery, [parentId])

        IF allSiblingTasks IS NULL OR allSiblingTasks.length IS 0 THEN
          LOG_WARNING("No sibling tasks found for parent ID: " + parentId)
          RETURN
        END IF

        // --- Calculate Progress ---
        totalSiblings = allSiblingTasks.length
        finishedCount = 0
        FOR EACH task IN allSiblingTasks
          IF task.status IS "COMPLETED" OR task.status IS "FAILED" OR task.status IS "CANCELLED" THEN
            finishedCount = finishedCount + 1
          END IF
        END FOR
        newProgress = (finishedCount / totalSiblings) * 100

        // --- Update Parent Task Progress (within transaction) ---
        AWAIT trx.updateTaskProgress(parentId, newProgress)

        // --- Check for Overall Completion ---
        IF finishedCount EQUALS totalSiblings THEN
          // --- Determine Final Status with Nuanced Logic ---
          completedCount = 0
          failedCount = 0
          cancelledCount = 0

          FOR EACH task IN allSiblingTasks
            SWITCH task.status
              CASE "COMPLETED":
                completedCount = completedCount + 1
                BREAK
              CASE "FAILED":
                failedCount = failedCount + 1
                BREAK
              CASE "CANCELLED":
                cancelledCount = cancelledCount + 1
                BREAK
            END SWITCH
          END FOR

          finalStatus = "COMPLETED" // Default status

          IF failedCount > 0 THEN
            finalStatus = "COMPLETED_WITH_ERRORS"
          ELSE IF cancelledCount > 0 THEN
            finalStatus = "COMPLETED_PARTIALLY" // New status for cancelled children
          END IF

          // --- Update Parent Task Final Status (within transaction) ---
          AWAIT trx.updateTaskStatus(parentId, finalStatus)
        END IF
        
      CATCH error
        // --- Transaction Error Handling ---
        // If any part of the transaction fails, it will be automatically rolled back.
        LOG_ERROR("Failed to handle child task completion for child ID " + childTaskId + "-- " + error.message)
        // Re-throw the error to ensure the transaction handler rejects the promise.
        THROW error 
      END TRY
    }).then(() => {
      // --- Resolve Promise on Successful Commit ---
      RESOLVE()
    }).catch((error) => {
      // --- Reject Promise on Transaction Failure ---
      REJECT(error)
    })
  })
END FUNCTION