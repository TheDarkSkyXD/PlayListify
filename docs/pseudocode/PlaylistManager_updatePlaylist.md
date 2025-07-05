# Pseudocode for PlaylistManager.updatePlaylist

**Method--** `updatePlaylist(playlistId, title, description)`

**Description--** Updates an existing playlist by delegating the operation to the playlist repository. This method acts as a pass-through, relying on the repository layer for the core logic and validation.

**Parameters--**
- `playlistId`-- `integer` -- The unique identifier for the playlist to be updated.
- `title`-- `string` -- The new title for the playlist.
- `description`-- `string` -- The new description for the playlist.

**Returns--** `Promise<Playlist>` -- A promise that resolves with the updated `Playlist` object if the operation is successful, or rejects with an error if it fails.

**Class Properties--**
- `playlistRepository`-- `PlaylistRepository` -- An instance of the repository responsible for direct database interactions concerning playlists.

---

### **BEGIN PROMISE** `(playlistId, title, description)`

  **TRY**
    1.  // Log the start of the operation for traceability.
    2.  **LOG** "Attempting to update playlist with ID--" + `playlistId`.

    3.  // Delegate the update operation to the repository layer.
    4.  // AWAIT the asynchronous call to ensure the operation completes before proceeding.
    5.  **DECLARE** `updatedPlaylist` = **AWAIT** `this.playlistRepository.updatePlaylist(playlistId, title, description)`.

    6.  // Log the successful completion of the operation.
    7.  **LOG** "Successfully updated playlist with ID--" + `playlistId`.

    8.  // Resolve the promise with the result from the repository.
    9.  **RESOLVE**(`updatedPlaylist`).

  **CATCH** `error`
    1.  // Log the error that was caught and propagated from the repository layer.
    2.  **LOG** "Error updating playlist with ID--" + `playlistId` + ". Error--" + `error.message`.

    3.  // Reject the promise, passing the error to the caller.
    4.  **REJECT** `error`.
  **END TRY-CATCH**

### **END PROMISE**