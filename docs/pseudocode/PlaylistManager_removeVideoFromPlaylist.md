# Pseudocode: `PlaylistManager.removeVideoFromPlaylist`

This document provides detailed, language-agnostic pseudocode for the `removeVideoFromPlaylist` method of the `PlaylistManager` class.

## Method Signature

`removeVideoFromPlaylist(playlistId: integer, videoId: string): Promise<void>`

## Description

Removes a specific video from a specific playlist by deleting the corresponding entry in the `playlist_videos` join table.

## Dependencies

- **`this.playlistRepository`**: An instance of `PlaylistRepository` used to interact with the database.
- **Exceptions**: `ArgumentException`, `NotFoundException`.

## Pseudocode

```plaintext
FUNCTION removeVideoFromPlaylist(playlistId, videoId)
  RETURN NEW PROMISE((resolve, reject) => {

    // --- 1. Input Validation ---
    // Ensure playlistId is a positive integer.
    IF NOT IS_INTEGER(playlistId) OR playlistId <= 0
      REJECT(NEW ArgumentException("playlistId must be a positive integer."))
      RETURN
    END IF

    // Ensure videoId is a non-empty string.
    IF NOT IS_STRING(videoId) OR videoId IS EMPTY
      REJECT(NEW ArgumentException("videoId must be a non-empty string."))
      RETURN
    END IF


    // --- 2. Business Logic & Database Interaction ---
    TRY
      // Define the SQL query to delete the link between a playlist and a video.
      // This operation targets the playlist_videos join table.
      sql_delete_video = "DELETE FROM playlist_videos WHERE playlist_id = ? AND video_id = ?"

      // Execute the query using the repository's database adapter.
      // The `query` method returns a result object which includes the number of
      // rows affected by the operation (e.g., `changes` or `affectedRows`).
      AWAIT result = this.playlistRepository.db.query(sql_delete_video, [playlistId, videoId])

      // --- 3. Result Handling ---
      // Check if any rows were actually deleted. If `result.changes` is 0,
      // it means no row matched the WHERE clause, implying the video was not
      // in the specified playlist to begin with.
      IF result.changes == 0
        // If no record was found and deleted, inform the caller.
        REJECT(NEW NotFoundException("Video not found in this playlist."))
      ELSE
        // The deletion was successful.
        RESOLVE()
      END IF

    CATCH database_error
      // --- 4. Error Handling ---
      // Log the internal error for debugging purposes.
      LOG_ERROR("Failed to remove video from playlist in database.", {
        playlistId: playlistId,
        videoId: videoId,
        error: database_error
      })

      // Reject the promise with the original error to notify the caller.
      REJECT(database_error)
    END TRY

  }) // END PROMISE
END FUNCTION
```

## Logic Breakdown

1.  **Promise Wrapper**: The entire function is wrapped in a `PROMISE` to handle the asynchronous nature of the database operation.
2.  **Input Validation**: It first checks if `playlistId` is a positive integer and `videoId` is a non-empty string. If either check fails, it immediately rejects the promise with an `ArgumentException`, preventing invalid data from reaching the database layer.
3.  **TRY/CATCH Block**: The core logic is enclosed in a `TRY...CATCH` block to gracefully handle potential errors during the database query.
4.  **SQL Definition**: A `DELETE` statement is defined to remove a record from the `playlist_videos` table where both the `playlist_id` and `video_id` match the provided parameters.
5.  **Database Query**: The `playlistRepository` is used to execute the `DELETE` query. The operation is `AWAIT`ed.
6.  **Result Analysis**: After the query executes, the code inspects the result. If the number of affected rows (`result.changes`) is zero, it means the video-playlist link did not exist. In this case, it rejects the promise with a `NotFoundException`.
7.  **Success**: If one or more rows were affected, the operation is considered successful, and the promise is resolved with no value.
8.  **Error Handling**: If any error occurs during the `TRY` block (e.g., database connection issue, SQL syntax error), the `CATCH` block is executed. It logs the detailed error for diagnostics and rejects the promise, passing the error to the calling function.