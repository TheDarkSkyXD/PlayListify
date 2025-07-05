# Pseudocode: `VideoRepository.deleteVideo(id)`

This document provides the detailed pseudocode for the `deleteVideo` method in the `VideoRepository` class.

## Method Signature

`deleteVideo(id: string): Promise<void>`

## Description

Deletes a video record from the database, ensuring all associated entries in the `playlist_videos` join table are also removed to maintain data integrity. The operation is performed within a transaction.

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

```
CLASS VideoRepository

  METHOD deleteVideo(id)
    PROMISE(resolve, reject)
      -- 1. Input Validation
      IF id IS NOT a String OR id IS empty THEN
        REJECT(new ArgumentException("id must be a non-empty string."))
        RETURN
      END IF

      -- 2. Database Deletion Logic
      TRY
        -- 2.1. Check for video existence before attempting deletion
        -- This leverages the existing getVideo method to ensure we're not trying to delete a non-existent record.
        AWAIT this.getVideo(id)
          -- If getVideo resolves, the video exists.
          -- If getVideo rejects with NotFoundException, the CATCH block below will handle it.

        -- 2.2. Begin a transaction to ensure atomicity
        -- Note: The underlying db adapter is assumed to handle the transaction logic.
        -- We represent it here conceptually.
        AWAIT this.db.beginTransaction()

        -- 2.3. Define SQL queries
        sql_delete_associations = "DELETE FROM playlist_videos WHERE video_id = ?"
        sql_delete_video = "DELETE FROM videos WHERE id = ?"

        -- 2.4. Execute deletion from the join table first to maintain referential integrity
        AWAIT this.db.query(sql_delete_associations, [id])

        -- 2.5. Execute deletion from the main videos table
        AWAIT this.db.query(sql_delete_video, [id])

        -- 2.6. Commit the transaction if all queries succeed
        AWAIT this.db.commitTransaction()

        -- 2.7. Resolve the promise indicating success
        RESOLVE()

      CATCH error
        -- 3. Error Handling
        -- 3.1. Rollback the transaction on any error
        AWAIT this.db.rollbackTransaction()

        -- 3.2. Log the specific error for debugging purposes
        LOG "Error in deleteVideo: " + error.message

        -- 3.3. Check if the error is a known NotFoundException from getVideo
        IF error IS INSTANCEOF NotFoundException THEN
            REJECT(new NotFoundException("Video with id '" + id + "' not found."))
        ELSE
            -- 3.4. For all other errors (e.g., database connection issues), reject with the original error.
            REJECT(error)
        END IF
      END TRY

    END PROMISE
  END METHOD

END CLASS