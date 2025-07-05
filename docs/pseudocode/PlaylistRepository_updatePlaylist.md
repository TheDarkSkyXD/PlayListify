# Pseudocode-- PlaylistRepository.updatePlaylist

This document outlines the pseudocode for the `updatePlaylist` method in the `PlaylistRepository` class.

## Method Definition

```plaintext
CLASS PlaylistRepository
    PROPERTY db: SQLiteAdapter

    METHOD updatePlaylist(id: INTEGER, title: STRING, description: STRING) RETURNS PROMISE<Playlist>
```

## Logic

The method returns a new Promise that encapsulates the asynchronous update operation.

```plaintext
RETURN NEW PROMISE((RESOLVE, REJECT) => {

    // --- 1. Input Validation ---
    // Validate ID
    IF id IS NOT a valid positive INTEGER OR id <= 0
        REJECT(NEW ArgumentException("Invalid ID-- must be a positive integer."))
        RETURN
    END IF

    // Validate Title
    IF title IS NULL OR title.length < 1 OR title.length > 255
        REJECT(NEW ArgumentException("Invalid title-- must be a string between 1 and 255 characters."))
        RETURN
    END IF

    // Validate Description
    IF description IS NULL OR description.length > 1000
        REJECT(NEW ArgumentException("Invalid description-- must be a string no more than 1000 characters."))
        RETURN
    END IF

    // --- 2. Database Operation ---
    TRY {
        // --- 2a. Check for Playlist Existence ---
        // Before updating, ensure the playlist exists to provide a clear error message.
        CONSTANT existingPlaylist = AWAIT this.getPlaylist(id)

        IF existingPlaylist IS NULL
            REJECT(NEW NotFoundException("Playlist with the specified ID does not exist."))
            RETURN
        END IF

        // --- 2b. Prepare and Execute Update Query ---
        CONSTANT sql = "UPDATE playlists SET title = ?, description = ?, updatedAt = ? WHERE id = ?"
        CONSTANT currentTime = GET_CURRENT_TIMESTAMP_ISO8601()
        CONSTANT params = [title, description, currentTime, id]

        // Execute the update query; we don't need the direct result from this call.
        AWAIT this.db.query(sql, params)

        // --- 2c. Fetch and Return Updated Playlist ---
        // After a successful update, fetch the complete object to return it.
        // This ensures the returned data is consistent with the database state.
        CONSTANT updatedPlaylist = AWAIT this.getPlaylist(id)

        RESOLVE(updatedPlaylist)

    } CATCH (databaseError) {
        // --- 3. Error Handling ---
        // Log the internal error for debugging purposes.
        LOG_ERROR("Failed to update playlist in database-- Error-- " + databaseError.message)

        // Reject the promise with the caught error to be handled by the caller.
        REJECT(databaseError)
    }

})
```

## Supporting Method Calls

*   **`this.getPlaylist(id)`**: A method within the same class that retrieves a single playlist by its ID. It is expected to return `NULL` if the playlist is not found.
*   **`this.db.query(sql, params)`**: The method from the `SQLiteAdapter` used to execute a SQL query against the database.
*   **`GET_CURRENT_TIMESTAMP_ISO8601()`**: A function that returns the current system time as an ISO 8601 formatted string.

## Exceptions

*   **`ArgumentException`**: Thrown if input parameters (`id`, `title`, `description`) fail validation checks.
*   **`NotFoundException`**: Thrown if no playlist with the given `id` exists in the database.