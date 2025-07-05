# Pseudocode: `VideoRepository.deleteVideo(id)`

This document provides the detailed pseudocode for the `deleteVideo` method in the `VideoRepository` class.

## Method Signature

`deleteVideo(id: string): Promise<void>`

## Description

Deletes a video record from the database by its ID. The operation is performed within a single atomic transaction. It first removes any associations in the `playlist_videos` join table and then deletes the video from the `videos` table. If no video with the specified ID is found, the operation fails and a `NotFoundException` is thrown.

## Parameters

*   **id** (`string`): The unique identifier of the video to be deleted.

## Returns

*   **Promise<void>**: A promise that resolves with no value upon successful deletion or rejects with an error if the operation fails.

## Exceptions

*   **ArgumentException**: Thrown if the `id` parameter is not a non-empty string.
*   **NotFoundException**: Thrown if no video with the specified `id` exists in the database.
*   **DatabaseError**: Thrown if any database query fails during the transaction.

---

## Pseudocode

```plaintext
CLASS VideoRepository

  METHOD deleteVideo(id)
    PROMISE(resolve, reject)
      -- 1. Input Validation
      IF id IS NOT a String OR id IS empty THEN
        REJECT(new ArgumentException("id must be a non-empty string."))
        RETURN
      END IF

      -- 2. Database Deletion Logic within a Transaction
      TRY
        AWAIT this.db.transaction(ASYNC () => {
          -- 2a. Define SQL queries
          DEFINE sql_delete_associations = "DELETE FROM playlist_videos WHERE video_id = ?"
          DEFINE sql_delete_video = "DELETE FROM videos WHERE id = ?"

          -- 2b. Execute deletion from the join table first to maintain referential integrity.
          -- This step does not need to check for affected rows, as it's okay if there are no associations.
          AWAIT this.db.query(sql_delete_associations, [id])

          -- 2c. Execute deletion from the main videos table and get the result.
          DEFINE result = AWAIT this.db.query(sql_delete_video, [id])

          -- 2d. Check if the video was actually deleted.
          -- The database driver should return a result object with a `changes` or `affectedRows` property.
          IF result.changes == 0 THEN
            -- If no rows were changed, the video did not exist.
            -- Throwing an error here will cause the transaction to roll back automatically.
            THROW new NotFoundException("Video not found.")
          END IF
        }) -- The transaction method automatically commits on success or rolls back on error.

        -- 2.3. If the transaction is successful, resolve the promise.
        RESOLVE()

      CATCH error
        -- 3. Error Handling
        LOG "Error in deleteVideo-- " + error.message

        -- 3.1. Check if the error is the one we threw for a non-existent video.
        IF error IS INSTANCEOF NotFoundException THEN
            REJECT(new NotFoundException("Video with id '" + id + "' not found."))
        ELSE
            -- 3.2. For all other errors (e.g., database connection issues), wrap in a generic database error.
            REJECT(new DatabaseError("Failed to delete video. Reason-- " + error.message))
        END IF
      END TRY

    END PROMISE
  END METHOD

END CLASS