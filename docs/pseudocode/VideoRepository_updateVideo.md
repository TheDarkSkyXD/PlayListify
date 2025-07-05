# Pseudocode: `VideoRepository.updateVideo`

## Description

Updates an existing video record in the database. It first validates all input data, checks if the video with the given ID exists, performs the SQL `UPDATE` operation, and then returns the complete, newly updated video object.

---

## Class: `VideoRepository`

### Method: `updateVideo(id, title, channelName, duration, viewCount, uploadDate, thumbnailURL, availabilityStatus, downloadedQuality, downloadPath)`

**Returns:** `PROMISE<Video>`

---

### Method Logic

`BEGIN PROMISE`

  `-- Input Validation`
  `IF id IS NULL or id IS an empty STRING`
    `REJECT with new ArgumentException("Video ID cannot be null or empty.")`
  `END IF`

  `IF title IS NOT a STRING or title length is NOT between 1 and 255`
    `REJECT with new ArgumentException("Video title must be a string between 1 and 255 characters.")`
  `END IF`

  `IF channelName IS NOT a STRING or channelName length is NOT between 1 and 255`
    `REJECT with new ArgumentException("Channel name must be a string between 1 and 255 characters.")`
  `END IF`

  `IF duration IS NOT a valid duration format STRING`
    `REJECT with new ArgumentException("Invalid duration format.")`
  `END IF`

  `IF viewCount IS NOT an INTEGER or viewCount < 0`
    `REJECT with new ArgumentException("View count must be a non-negative integer.")`
  `END IF`

  `IF thumbnailURL IS NOT a valid URL STRING`
    `REJECT with new ArgumentException("Invalid thumbnail URL format.")`
  `END IF`

  `DEFINE validStatuses = ['AVAILABLE', 'UNAVAILABLE', 'PRIVATE']`
  `IF availabilityStatus IS NOT IN validStatuses`
    `REJECT with new ArgumentException("Invalid availability status. Must be one of 'AVAILABLE', 'UNAVAILABLE', 'PRIVATE'.")`
  `END IF`

  `-- All other parameters (downloadedQuality, downloadPath) are assumed to be validated if necessary, or accept flexible types.`

  `-- Database Operation`
  `BEGIN TRY`
    `-- Step 1: Check if the video exists before attempting an update`
    `AWAIT existingVideo = this.getVideo(id)`
    `IF existingVideo IS NULL`
      `REJECT with new NotFoundException("Video with ID '" + id + "' not found.")`
    `END IF`

    `-- Step 2: Define the SQL UPDATE statement`
    `DEFINE SQL_UPDATE = "UPDATE videos SET title = ?, channelName = ?, duration = ?, viewCount = ?, uploadDate = ?, thumbnailURL = ?, availabilityStatus = ?, downloadedQuality = ?, downloadPath = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?"`
    
    `-- Step 3: Define parameters for the prepared statement`
    `DEFINE params = [title, channelName, duration, viewCount, uploadDate, thumbnailURL, availabilityStatus, downloadedQuality, downloadPath, id]`

    `-- Step 4: Execute the update query`
    `AWAIT this.db.query(SQL_UPDATE, params)`

    `-- Step 5: Fetch the complete, updated video record to return it`
    `AWAIT updatedVideo = this.getVideo(id)`

    `-- Step 6: Resolve the promise with the updated video object`
    `RESOLVE updatedVideo`

  `CATCH databaseError`
    `LOG "Database error in VideoRepository.updateVideo: " + databaseError.message`
    `REJECT databaseError`
  `END TRY`

`END PROMISE`