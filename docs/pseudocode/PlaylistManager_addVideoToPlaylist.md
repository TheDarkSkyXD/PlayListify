# Pseudocode: `PlaylistManager.addVideoToPlaylist`

**Method:** `addVideoToPlaylist(playlistId: integer, videoId: string): Promise<void>`

**Description:** Adds a specified video to a specified playlist. It handles validation, ensures the playlist and video exist, and prevents duplicate entries.

---

### **Parameters**

-   `playlistId` (integer) -- The unique identifier for the target playlist. Must be a positive integer.
-   `videoId` (string) -- The unique identifier for the video to be added. Must be a non-empty string.

### **Return Value**

-   `Promise<void>` -- A promise that resolves when the video has been successfully added to the playlist. It rejects if any validation fails or an error occurs during the process.

### **Exceptions**

-   `ArgumentException` -- Thrown if `playlistId` is not a positive integer or if `videoId` is an empty string.
-   `NotFoundException` -- Thrown if the specified `playlistId` or `videoId` does not correspond to an existing record in the database.
-   `ConflictException` -- Thrown if the video already exists in the target playlist, preventing duplicates.
-   `Error` -- Catches and re-throws any other unexpected errors that occur during database interaction.

---

### **Logic**

`BEGIN PROMISE(RESOLVE, REJECT)`

    `// 1. Input Validation`
    `IF playlistId IS NOT a positive integer OR videoId IS NULL OR videoId is an empty string THEN`
        `REJECT(new ArgumentException("Invalid input: playlistId must be a positive integer and videoId must be a non-empty string."))`
        `RETURN`
    `END IF`

    `BEGIN TRY`
        `// 2. Verify Playlist Existence`
        `// Use the repository to fetch the playlist to confirm it's valid.`
        `playlist = AWAIT this.playlistRepository.getPlaylist(playlistId)`
        `IF playlist IS NULL THEN`
            `REJECT(new NotFoundException("Playlist not found for the given playlistId."))`
            `RETURN`
        `END IF`

        `// 3. Verify Video Existence`
        `// Use the repository to fetch the video to confirm it's valid.`
        `video = AWAIT this.videoRepository.getVideo(videoId)`
        `IF video IS NULL THEN`
            `REJECT(new NotFoundException("Video not found for the given videoId."))`
            `RETURN`
        `END IF`

        `// 4. Check for Duplicate Video in Playlist`
        `// Fetch all videos associated with the playlist to check for duplicates.`
        `currentVideos = AWAIT this.videoRepository.getVideosForPlaylist(playlistId)`
        `videoExists = currentVideos.some(v => v.id === videoId)`
        `IF videoExists IS TRUE THEN`
            `REJECT(new ConflictException("Video already exists in this playlist."))`
            `RETURN`
        `END IF`

        `// 5. Determine the Order for the New Video`
        `// The new video will be placed at the end of the playlist.`
        `newOrder = currentVideos.length + 1`

        `// 6. Prepare and Execute the Database INSERT Operation`
        `sql = "INSERT INTO playlist_videos (playlist_id, video_id, video_order) VALUES (?, ?, ?)"`
        `params = [playlistId, videoId, newOrder]`
        `AWAIT this.playlistRepository.db.query(sql, params)`

        `// 7. Operation Successful`
        `// If the query executes without throwing an error, the operation is successful.`
        `RESOLVE()`

    `CATCH error`
        `// 8. Generic Error Handling`
        `// Log the error for debugging purposes and reject the promise.`
        `LOG "Failed to add video to playlist: " + error.message`
        `REJECT(error)`
    `END TRY`

`END PROMISE`