# Pseudocode: VideoDownloader.downloadVideo

This document outlines the detailed, language-agnostic pseudocode for the `downloadVideo` method and its private helper `_performDownload`.

## Method: `downloadVideo`

### Signature
`METHOD downloadVideo(videoId: STRING, quality: STRING, format: STRING, includeSubtitles: BOOLEAN, downloadLocation: STRING) RETURNS PROMISE<VOID>`

### Dependencies
- `this.youtubeService`: Service for fetching video metadata.
- `this.backgroundTaskRepository`: Repository for creating and managing background tasks.
- `this.videoRepository`: Repository for updating video data in the database.
- `ArgumentException`: Custom error for invalid arguments.
- `DiskSpaceError`: Custom error for insufficient disk space.

### Logic
`RETURN NEW PROMISE((RESOLVE, REJECT) => {`
  `TRY {`
    `// -- Input Validation`
    `IF IS_NULL_OR_EMPTY(videoId) OR IS_NULL_OR_EMPTY(quality) OR IS_NULL_OR_EMPTY(format) OR IS_NULL_OR_EMPTY(downloadLocation) THEN`
      `REJECT(NEW ArgumentException("Invalid arguments provided. All parameters must be non-empty strings."))`
      `RETURN`
    `END IF`

    `// -- 1. Get Video Metadata`
    `// This call is crucial to get the estimated size for the disk space check.`
    `videoMetadata = AWAIT this.youtubeService.getVideoMetadata(videoId)`
    `IF videoMetadata IS NULL THEN`
        `REJECT(NEW Error("Failed to retrieve video metadata."))`
        `RETURN`
    `END IF`
    `estimatedSize = videoMetadata.estimatedFileSize`

    `// -- 2. Check for Sufficient Disk Space (FR.3.2.7)`
    `hasSufficientSpace = AWAIT CHECK_DISK_SPACE(downloadLocation, estimatedSize)`
    `IF hasSufficientSpace IS FALSE THEN`
      `REJECT(NEW DiskSpaceError("Insufficient disk space at the specified location."))`
      `RETURN`
    `END IF`

    `// -- 3. Create a Task in the Activity Center (FR.3.2.8)`
    `taskDetails = { quality, format, includeSubtitles, downloadLocation }`
    `newTask = AWAIT this.backgroundTaskRepository.createTask("DOWNLOAD_VIDEO", videoId, NULL, taskDetails)`

    `// -- 4. Add Download Operation to the Queue`
    `// The actual download is performed by a separate function added to a queue.`
    `// This allows the UI to remain responsive.`
    `this.backgroundTaskRepository.taskQueue.add(() => _performDownload(newTask, videoMetadata))`

    `// -- 5. Resolve Immediately`
    `// The promise resolves as soon as the task is queued, not when it's finished.`
    `RESOLVE()`

  `} CATCH (error) {`
    `LOG_ERROR("Failed to queue video download: " + error.message)`
    `REJECT(error)`
  `}`
`})`

---

## Private Helper Method: `_performDownload`

### Signature
`PRIVATE METHOD _performDownload(task: Task, videoMetadata: VideoMetadata) RETURNS PROMISE<VOID>`

### Logic
`TRY {`
  `// -- 1. Update Task Status to In Progress`
  `AWAIT this.backgroundTaskRepository.updateTaskStatus(task.id, "IN_PROGRESS")`

  `// -- 2. Determine Download Quality with Fallback Logic (Constraint)`
  `availableQualities = videoMetadata.availableQualities`
  `requestedQuality = task.details.quality`
  `chosenQuality = NULL`

  `IF requestedQuality IS IN availableQualities THEN`
    `chosenQuality = requestedQuality`
  `ELSE`
    `LOG_WARNING("Requested quality '" + requestedQuality + "' not available. Falling back to best available quality.")`
    `// Sort qualities numerically descending (e.g., 1080, 720, 480). Assumes 'p' suffix.`
    `sortedQualities = SORT(availableQualities, 'numeric-desc')`
    `chosenQuality = sortedQualities[0]`
    `LOG_INFO("Fallback quality selected: '" + chosenQuality + "'")`
  `END IF`

  `// -- 3. Perform Download`
  `// This section represents the interaction with an external download library (e.g., yt-dlp-wrap)`

  `// -- Sanitize filename to prevent path issues (FR.3.2.5)`
  `sanitizedTitle = SANITIZE_FILENAME(videoMetadata.title)`
  `finalFilePath = GENERATE_PATH(task.details.downloadLocation, sanitizedTitle, task.details.format)`

  `// -- Throttled progress updater to avoid overwhelming the system with updates`
  `throttledProgressUpdater = THROTTLE((progress) => {`
    `AWAIT this.backgroundTaskRepository.updateTaskProgress(task.id, progress.percent)`
  `}, 500) // Execute at most once every 500ms`

  `downloadOptions = {`
    `quality: chosenQuality, // -- Use the determined quality`
    `format: task.details.format,`
    `output: finalFilePath,`
    `includeSubtitles: task.details.includeSubtitles,`
    `progressCallback: throttledProgressUpdater`
  `}`

  `// -- Await the completion of the external download process`
  `AWAIT EXTERNAL_DOWNLOAD_LIBRARY(videoMetadata.id, downloadOptions)`

  `// -- 4. Embed Thumbnail into the downloaded file (FR.3.2.6)`
  `IF videoMetadata.thumbnailUrl IS NOT NULL THEN`
    `AWAIT EMBED_THUMBNAIL(finalFilePath, videoMetadata.thumbnailUrl)`
  `END IF`

  `// -- 5. Update Video Record in Database`
  `// The video entry is updated with the final path, downloaded status, and actual quality.`
  `updatePayload = {`
    `status: "DOWNLOADED",`
    `filePath: finalFilePath,`
    `downloadedAt: CURRENT_TIMESTAMP(),`
    `downloadedQuality: chosenQuality // -- Reflect the actual downloaded quality`
  `}`
  `AWAIT this.videoRepository.updateVideo(videoMetadata.id, updatePayload)`

  `// -- 6. Final Status Update on Success`
  `AWAIT this.backgroundTaskRepository.updateTaskStatus(task.id, "COMPLETED")`

`} CATCH (downloadError) {`
  `// -- On failure, update the task status to FAILED and log the error`
  `AWAIT this.backgroundTaskRepository.updateTaskStatus(task.id, "FAILED", downloadError.message)`
  `LOG_ERROR("Download failed for task ID " + task.id + ": " + downloadError.message)`
`}`
`// -- A FINALLY block is not strictly necessary here because both the TRY and CATCH blocks`
`// -- handle the final state transitions (COMPLETED or FAILED).`