# Pseudocode: `BackgroundTaskRepository.createTask`

This document outlines the pseudocode for the `createTask` method, which is responsible for creating a new background task record in the database.

## Method Signature

```
FUNCTION createTask(type: string, targetId: string, parentId: integer OR null, details: object) RETURNS Promise<BackgroundTask>
```

## Class Properties

-   `db: SQLiteAdapter` -- An instance of the database adapter for executing queries.
-   `appEmitter: EventEmitter` -- An instance used to emit events to the frontend.

## Logic

```plaintext
BEGIN PROMISE

    -- 1. Input Validation
    -- -------------------
    DEFINE allowedTypes = ["IMPORT_PLAYLIST", "DOWNLOAD_VIDEO", "REFRESH_PLAYLIST"]

    IF type IS NOT a string OR type IS empty OR allowedTypes DOES NOT contain type
        REJECT Promise with new ArgumentException("Invalid or missing 'type'. Must be one of: " + allowedTypes.join(", "))
        RETURN
    END IF

    IF targetId IS NOT a string OR targetId IS empty
        REJECT Promise with new ArgumentException("Invalid or missing 'targetId'. Must be a non-empty string.")
        RETURN
    END IF

    IF parentId IS NOT null AND (parentId IS NOT a positive integer)
        REJECT Promise with new ArgumentException("Invalid 'parentId'. Must be null or a positive integer.")
        RETURN
    END IF

    TRY
        JSON.stringify(details)
    CATCH (serializationError)
        REJECT Promise with new ArgumentException("Invalid 'details' object. Must be a valid JSON-serializable object.")
        RETURN
    END TRY

    -- 2. Database Insertion
    -- ---------------------
    TRY
        -- a. Prepare the SQL query and parameters
        CONSTANT sql = "INSERT INTO background_tasks (type, targetId, parentId, details, status, progress, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
        CONSTANT serializedDetails = JSON.stringify(details)
        CONSTANT currentTime = GET_CURRENT_SYSTEM_TIMESTAMP()

        CONSTANT params = [
            type,
            targetId,
            parentId,
            serializedDetails,
            "QUEUED",      -- Initial status
            0.0,           -- Initial progress
            currentTime,   -- createdAt
            currentTime    -- updatedAt
        ]

        -- b. Execute the query
        AWAIT insertResult = this.db.query(sql, params)
        CONSTANT newTaskId = insertResult.lastID

        -- c. Fetch the newly created task object to ensure consistency
        AWAIT newTask = this.getTask(newTaskId)

        -- d. Notify the frontend about the new task
        this.emitTaskUpdate(newTask)

        -- e. Resolve the promise with the complete task object
        RESOLVE Promise with newTask

    CATCH (databaseError)
        -- f. Handle any database errors
        LOG "Error creating background task in database: " + databaseError.message
        REJECT Promise with databaseError
    END TRY

END PROMISE