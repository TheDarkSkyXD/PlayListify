# Pseudocode for `PlaylistRepository.createPlaylist`

This document outlines the detailed, language-agnostic pseudocode for the `createPlaylist` method.

## Method-- `createPlaylist`

Creates a new playlist record in the database after validating the provided inputs.

**Signature**

`createPlaylist(title: string, description: string, type: string): Promise<Playlist>`

**Parameters**

-   `title`: `string` -- The title for the new playlist.
-   `description`: `string` -- A description for the new playlist.
-   `type`: `string` -- The type of the playlist (e.g., "YOUTUBE", "CUSTOM").

**Returns**

-   `Promise<Playlist>` -- A promise that, upon successful creation, resolves with the newly created `Playlist` object. If validation or database operations fail, the promise is rejected with an appropriate error.

**Exceptions**

-   `ArgumentException`: Thrown if any of the input parameters fail validation checks.
-   `DatabaseError`: Thrown if the database query fails for any reason.

---

### **Pseudocode Logic**

```plaintext
METHOD createPlaylist(title, description, type)
  -- Return a new Promise to handle the asynchronous operation.
  RETURN NEW PROMISE((RESOLVE, REJECT) => {

    -- 1. Input Validation
    -- -------------------

    -- Validate 'title'
    IF title IS NULL OR title IS EMPTY OR title.length > 255 THEN
      REJECT(NEW ArgumentException("Title must be a string between 1 and 255 characters."))
      RETURN
    END IF

    -- Validate 'description'
    IF description IS NULL OR description.length > 1000 THEN
      REJECT(NEW ArgumentException("Description must be a string no longer than 1000 characters."))
      RETURN
    END IF

    -- Validate 'type'
    DEFINE allowedTypes AS ["YOUTUBE", "CUSTOM"]
    IF type IS NULL OR NOT allowedTypes.includes(type) THEN
      REJECT(NEW ArgumentException("Type is invalid or not provided."))
      RETURN
    END IF


    -- 2. Database Operation
    -- ---------------------

    -- Use a TRY...CATCH block to handle potential database errors.
    TRY
      -- Define the SQL query for inserting a new playlist.
      -- Use placeholders (e.g., ?) to prevent SQL injection.
      DEFINE sql AS "INSERT INTO playlists (title, description, type, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)"

      -- Get the current timestamp to be used for both createdAt and updatedAt fields.
      DEFINE currentTime AS GET_CURRENT_TIMESTAMP()

      -- Prepare the parameters for the SQL query.
      DEFINE params AS [title, description, type, currentTime, currentTime]

      -- Asynchronously execute the query using the database adapter.
      -- The result of a successful INSERT query should include the ID of the new row.
      AWAIT result = this.db.query(sql, params)

      -- Extract the ID of the newly created playlist.
      DEFINE newPlaylistId = result.lastID

      -- Fetch the complete playlist object using the new ID to ensure data consistency.
      -- This re-uses existing logic and confirms the record was written correctly.
      AWAIT newPlaylist = this.getPlaylist(newPlaylistId)

      -- If the operation was successful, resolve the promise with the new playlist object.
      RESOLVE(newPlaylist)

    CATCH (error)
      -- If an error occurs during the database operation:
      -- Log the error for debugging purposes.
      LOG_ERROR("Database error in createPlaylist-- " + error.message)

      -- Reject the promise with the captured database error.
      REJECT(error)
    END TRY

  }) -- END PROMISE
END METHOD