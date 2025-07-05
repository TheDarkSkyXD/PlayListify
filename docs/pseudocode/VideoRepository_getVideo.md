# Pseudocode: `VideoRepository.getVideo(id)`

## Description

This method retrieves a single video record from the `videos` table in the database, identified by its unique ID. It handles cases where the video is not found and manages potential database errors.

---

## Parameters

-   `id` (string): The unique identifier for the video to retrieve.

---

## Returns

-   `Promise<Video -- null>`: A promise that resolves with the `Video` object if found, or `null` if no video with the given ID exists. It rejects with an error if the input is invalid or a database error occurs.

---

## Pseudocode

```pseudocode
CLASS VideoRepository

  METHOD getVideo(id: string)
    PROMISE(RESOLVE, REJECT)
      -- Input Validation
      IF id IS NOT a string OR id IS empty THEN
        REJECT(new ArgumentException("Invalid or missing 'id' parameter."))
        RETURN
      END IF

      -- Database Operation
      TRY
        -- Define the SQL query to select a video by its ID.
        -- The '?' is a placeholder for the id parameter to prevent SQL injection.
        sql = "SELECT id, title, channelName, duration, viewCount, uploadDate, thumbnailURL, availabilityStatus, downloadedQuality, downloadPath, createdAt, updatedAt FROM videos WHERE id = ?"
        
        -- Execute the query using the database adapter.
        -- AWAIT the asynchronous database call to complete.
        result = AWAIT this.db.query(sql, [id])

        -- Check the query result.
        IF result IS empty OR result.length IS 0 THEN
          -- If no video was found, resolve the promise with null.
          RESOLVE(NULL)
        ELSE
          -- If a video was found, resolve the promise with the first record.
          -- The result from the query is expected to be an array of objects.
          videoObject = result[0]
          RESOLVE(videoObject)
        END IF

      CATCH (databaseError)
        -- Log the error for debugging purposes.
        LOG("Error retrieving video from database: " + databaseError.message)
        
        -- Reject the promise with the caught database error.
        REJECT(databaseError)
      END TRY
    END PROMISE
  END METHOD

END CLASS