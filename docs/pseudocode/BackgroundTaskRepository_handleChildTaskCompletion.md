# Pseudocode-- `BackgroundTaskRepository.handleChildTaskCompletion`

## Description

Handles the completion of a child task, updates the parent task's progress, and sets the final status of the parent task if all children are complete. This method ensures that the parent task accurately reflects the aggregate state of its children, marking it as "COMPLETED" or "COMPLETED_WITH_ERRORS" based on their outcomes.

## Parameters

-   `childTaskId`-- `integer` -- The unique identifier for the child task that has just completed.

## Return

-   `Promise<void>` -- A promise that resolves when the parent task has been successfully updated, or rejects with an error if the operation fails.

## Exceptions

-   `ArgumentException` -- Thrown if `childTaskId` is not a positive integer.

## Structure

```plaintext
FUNCTION handleChildTaskCompletion(childTaskId)
  PROMISE((RESOLVE, REJECT) => {
    // --- Input Validation ---
    // Ensure the provided childTaskId is a valid positive integer before proceeding.
    IF childTaskId IS NOT a positive integer THEN
      REJECT(new ArgumentException("Invalid childTaskId-- must be a positive integer."))
      RETURN
    END IF

    TRY
      // --- Fetch Child Task & Parent ID ---
      // Retrieve the details of the completed child task to find its parent.
      childTask = AWAIT this.getTask(childTaskId)

      // If the child task doesn't exist or isn't associated with a parent,
      // there's nothing to update. Log a warning and exit gracefully.
      IF childTask IS NULL OR childTask.parentId IS NULL THEN
        LOG_WARNING("Child task with ID " + childTaskId + " not found or has no parent.")
        RESOLVE()
        RETURN
      END IF

      parentId = childTask.parentId

      // --- Fetch All Sibling Tasks ---
      // Get all tasks that share the same parent to calculate overall progress.
      siblingTasksQuery = "SELECT id, status FROM background_tasks WHERE parentId = ?"
      allSiblingTasks = AWAIT this.db.query(siblingTasksQuery, [parentId])

      IF allSiblingTasks IS NULL OR allSiblingTasks.length IS 0 THEN
        LOG_WARNING("No sibling tasks found for parent ID: " + parentId)
        RESOLVE()
        RETURN
      END IF

      // --- Calculate Progress ---
      // Determine the percentage of completed tasks.
      totalSiblings = allSiblingTasks.length
      completedCount = 0
      FOR EACH task IN allSiblingTasks
        IF task.status IS "COMPLETED" THEN
          completedCount = completedCount + 1
        END IF
      END FOR
      newProgress = (completedCount / totalSiblings) * 100

      // --- Update Parent Task Progress ---
      AWAIT this.updateTaskProgress(parentId, newProgress)

      // --- Check for Overall Completion ---
      // If all siblings are finished, determine the final status of the parent task.
      IF completedCount EQUALS totalSiblings THEN
        finalStatus = "COMPLETED" // Assume success initially

        // Check if any sibling failed or was cancelled.
        FOR EACH task IN allSiblingTasks
          IF task.status IS "FAILED" OR task.status IS "CANCELLED" THEN
            finalStatus = "COMPLETED_WITH_ERRORS"
            BREAK // Found a non-successful task, no need to check further.
          END IF
        END FOR

        // --- Update Parent Task Final Status ---
        AWAIT this.updateTaskStatus(parentId, finalStatus)
      END IF

      // --- Resolve Promise ---
      // Indicate that the operation completed successfully.
      RESOLVE()

    CATCH error
      // --- Error Handling ---
      // Log any unexpected errors and reject the promise.
      LOG_ERROR("Failed to handle child task completion for child ID " + childTaskId + "-- " + error.message)
      REJECT(error)
    END TRY
  })
END FUNCTION