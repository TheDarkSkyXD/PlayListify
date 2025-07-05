# Pseudocode-- HealthCheckService.checkPlaylistHealth

**Method:** `checkPlaylistHealth(playlistId: integer): Promise<void>`

This method checks the availability of all videos in a specified playlist, updating their status in the database if changes are detected. It processes videos in a low-concurrency queue to avoid rate-limiting and excessive load.

---

### **Dependencies**

-   `this.videoRepository`-- An instance of `VideoRepository` to interact with the video data store.
-   `this.youtubeService`-- An instance of `YoutubeService` to fetch live video metadata.
-   `PromisePool`-- A conceptual class or library for managing concurrent asynchronous operations.
-   `ArgumentException`-- Custom exception for invalid arguments.
-   `NotFoundException`-- Custom exception for when a resource is not found.
-   `AccessDeniedException`-- Custom exception for permission-related errors.

---

### **Pseudocode**

`METHOD checkPlaylistHealth(playlistId)`

  `RETURN NEW PROMISE((resolve, reject) => {`

    `// 1. Input Validation`
    `IF playlistId IS NOT a positive integer THEN`
      `REJECT(NEW ArgumentException("Invalid playlistId. Must be a positive integer."))`
      `RETURN`
    `END IF`

    `TRY {`
      `// 2. Fetch all videos for the given playlist`
      `LOG "Fetching videos for playlist ID: ${playlistId}"`
      `videosToCheck = AWAIT this.videoRepository.getVideosForPlaylist(playlistId)`

      `// 3. Handle Empty Playlist`
      `IF videosToCheck IS EMPTY THEN`
        `LOG "No videos found for playlist ${playlistId}. Nothing to check."`
        `RESOLVE()`
        `RETURN`
      `END IF`

      `LOG "Found ${videosToCheck.length} videos to check. Starting health check."`

      `// 4. Low-Concurrency Processing`
      `// Use a conceptual promise pool or queue to limit concurrency to a small number (e.g., 2)`
      `CONCURRENCY_LIMIT = 2`
      `promisePool = NEW PromisePool(CONCURRENCY_LIMIT)`

      `// Create a task for each video check`
      `FOR EACH video IN videosToCheck`
        `promisePool.addTask(ASYNC () => {`
          `// 5. Individual Video Health Check`
          `TRY {`
            `// 5a. Get fresh metadata from the external service`
            `newMetadata = AWAIT this.youtubeService.getVideoMetadata(video.id)`
            `newStatus = newMetadata.availabilityStatus`

            `// 5b. Compare with stored status and update if necessary`
            `IF newStatus IS NOT EQUAL TO video.availabilityStatus THEN`
              `LOG "Status changed for video ${video.id}: from '${video.availabilityStatus}' to '${newStatus}'"`
              `AWAIT this.videoRepository.updateVideo({`
                `id: video.id,`
                `availabilityStatus: newStatus`
              `})`
            `ELSE`
              `LOG "Status for video ${video.id} remains '${newStatus}'."`
            `END IF`

          `} CATCH (videoError) {`
            `// 5c. Handle errors with nuance`
            `LOG_ERROR "Error checking video ${video.id}: ${videoError.message}"`

            `failureStatus = NULL`

            `IF videoError INSTANCEOF NotFoundException THEN`
              `// This is a permanent error.`
              `failureStatus = "UNAVAILABLE"`
            `ELSE IF videoError INSTANCEOF AccessDeniedException THEN`
              `// This is a permanent error.`
              `failureStatus = "PRIVATE"`
            `ELSE`
              `// This is likely a transient error (e.g., network timeout, API rate limit).`
              `// Log the error for debugging, but do not update the video's status.`
              `// The video will be re-checked during the next scheduled health check.`
              `LOG "Skipping status update for video ${video.id} due to a transient error."`
              `// End this specific task, allowing the promise pool to continue with the next video.`
              `RETURN`
            `END IF`

            `// 5d. Update database only for permanent failures if the status has changed.`
            `IF failureStatus IS NOT NULL AND video.availabilityStatus IS NOT EQUAL TO failureStatus THEN`
              `AWAIT this.videoRepository.updateVideo({`
                `id: video.id,`
                `availabilityStatus: failureStatus`
              `})`
              `LOG "Updated video ${video.id} status to '${failureStatus}' due to a permanent error."`
            `END IF`
          `}`
        `})`
      `END FOR`

      `// 6. Wait for all tasks in the pool to complete`
      `AWAIT promisePool.start()`
      
      `LOG "Health check completed for all videos in playlist ${playlistId}."`
      `RESOLVE()`

    `} CATCH (error) {`
      `// 7. Handle errors from the main process (e.g., initial database fetch)`
      `LOG_ERROR "A critical error occurred during the playlist health check: ${error.message}"`
      `REJECT(error)`
    `}`
  `})`

`END METHOD`