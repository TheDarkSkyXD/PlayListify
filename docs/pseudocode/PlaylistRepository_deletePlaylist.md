# Pseudocode: `PlaylistRepository.deletePlaylist(id)`

This document provides the detailed pseudocode for the `deletePlaylist` method.

## Method Definition

```plaintext
CLASS PlaylistRepository
  METHOD deletePlaylist(id: integer) -- Returns PROMISE<void>
```

## Logic

```plaintext
PROMISE(RESOLVE, REJECT)
  -- --- Input Validation ---
  IF id IS NOT a positive integer THEN
    REJECT(NEW ArgumentException("Playlist ID must be a positive integer."))
    RETURN
  END IF

  -- --- Database Operation ---
  TRY
    -- 1. Check if the playlist exists before attempting to delete
    DEFINE existingPlaylist = AWAIT this.getPlaylist(id)
    IF existingPlaylist IS NULL THEN
      -- Use REJECT for consistency in promise-based flow
      REJECT(NEW NotFoundException(`Playlist with ID ${id} not found.`))
      RETURN
    END IF

    -- 2. Execute deletion within a transaction for atomicity
    AWAIT this.db.transaction(ASYNC () => {
      -- 2a. Define SQL queries for deletion
      DEFINE sqlDeleteLinks = "DELETE FROM playlist_videos WHERE playlist_id = ?"
      DEFINE sqlDeletePlaylist = "DELETE FROM playlists WHERE id = ?"

      -- 2b. Execute deletion from the join table first
      AWAIT this.db.query(sqlDeleteLinks, [id])

      -- 2c. Execute deletion from the main playlists table
      AWAIT this.db.query(sqlDeletePlaylist, [id])
    }) -- The transaction method automatically commits on success or rolls back on error.

    -- 3. On success, resolve the promise
    RESOLVE()

  CATCH (error)
    -- --- Error Handling ---
    -- This catches errors from getPlaylist or the transaction itself.
    LOG "Error in deletePlaylist-- " + error.message
    REJECT(error)
  END TRY
END PROMISE
```

## Notes

*   **Transactionality**: The two `DELETE` operations are wrapped in a `this.db.transaction()` call. This is crucial for data integrity. The `transaction` method ensures that both deletions succeed as a single, atomic unit. If any operation within the transaction block fails, all previous operations within that block are automatically rolled back.
*   **Dependencies**: This method relies on `this.getPlaylist(id)` to verify existence before deletion, preventing unnecessary database operations and providing clearer error feedback (`NotFoundException`).
*   **Error Types**:
    *   `ArgumentException`: Thrown for invalid input (`id`).
    *   `NotFoundException`: Thrown if the playlist to be deleted does not exist.
    *   Generic `Error`: Any other error, typically from the database adapter during the transaction, is caught and rejected.