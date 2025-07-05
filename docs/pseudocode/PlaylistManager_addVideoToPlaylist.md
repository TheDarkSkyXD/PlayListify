# Pseudocode for `PlaylistManager.addVideoToPlaylist` (Revised)

**Objective:** Add a reference to a video to a specific playlist, ensuring atomicity and handling potential duplicate entries gracefully. This revised logic relies on a database-level `UNIQUE` constraint on `(playlist_id, video_id)` to prevent duplicates atomically.

**File:** `PlaylistManager_addVideoToPlaylist.md`

**Depends on:**
- `PlaylistRepository.getPlaylist`
- `VideoRepository.getVideo`
- A database adapter with `query` and `run` methods.
- Custom Error Types-- `InvalidArgumentException`, `NotFoundException`, `ConflictException`, `DatabaseError`.

---

### **Method-- `addVideoToPlaylist(playlistId, videoId)`**

#### **Inputs:**
- `playlistId` (String)-- The unique identifier for the playlist.
- `videoId` (String)-- The unique identifier for the video to be added.

#### **Outputs:**
- **On Success:** `Promise<void>` that resolves when the video has been successfully added.
- **On Failure:** `Promise<void>` that rejects with an appropriate error (`InvalidArgumentException`, `NotFoundException`, `ConflictException`, `DatabaseError`).

---

#### **Core Logic:**

1.  **`RETURN NEW PROMISE`** `(RESOLVE, REJECT)` that encapsulates the entire asynchronous operation.

2.  **`BEGIN TRY`** (for the entire operation)

3.  **Input Validation:**
    - `IF` `playlistId` is null, undefined, or an empty string, `THROW` `InvalidArgumentException("playlistId cannot be empty")`.
    - `IF` `videoId` is null, undefined, or an empty string, `THROW` `InvalidArgumentException("videoId cannot be empty")`.

4.  **Entity Existence Check:**
    - `// The following calls will throw a NotFoundException if the entity does not exist,`
    - `// which will be caught by the main CATCH block.`
    - `AWAIT` `this.playlistRepository.getPlaylist(playlistId)`.
    - `AWAIT` `this.videoRepository.getVideo(videoId)`.

5.  **Determine Insert Order:**
    - `// This operation should ideally be part of a transaction with the INSERT for perfect atomicity.`
    - `// For this pseudocode, we accept the minor race condition possibility.`
    - `orderResult = AWAIT` `this.db.query("SELECT COUNT(*) as videoCount FROM playlist_videos WHERE playlist_id = ?", playlistId)`.
    - `newOrder = orderResult[0].videoCount`.

6.  **Prepare and Execute `INSERT` query:**
    - `// The "order" column is quoted to avoid conflicts with SQL reserved keywords.`
    - `sql = "INSERT INTO playlist_videos (playlist_id, video_id, \"order\") VALUES (?, ?, ?)"`.
    - `params = [playlistId, videoId, newOrder]`.
    - `AWAIT` `this.db.run(sql, params)`.

7.  **Success:**
    - `LOG` "Successfully added video `{videoId}` to playlist `{playlistId}`".
    - `RESOLVE()` the promise.

8.  **`END TRY`**

9.  **`BEGIN CATCH (error)`**
    - `SWITCH (error.type)`:
        - `CASE UniqueConstraintViolation`:
            - `REJECT` with `ConflictException("Video with ID '{videoId}' is already in playlist '{playlistId}'.")`.
            - `BREAK`.
        - `CASE InvalidArgumentException`:
        - `CASE NotFoundException`:
            - `// Re-throw the original, specific error.`
            - `REJECT(error)`.
            - `BREAK`.
        - `DEFAULT`:
            - `// Catches any other database or unexpected errors.`
            - `LOG_ERROR` "Failed to add video to playlist due to an unexpected error: " + `error.message`.
            - `REJECT` with `DatabaseError("An unexpected database error occurred while adding the video.")`.
            - `BREAK`.
    - `END SWITCH`
10. **`END CATCH`**

11. **`END PROMISE`**