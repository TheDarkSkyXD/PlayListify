# Pseudocode: `VideoRepository.createVideo`

## META

**File--** `docs/pseudocode/VideoRepository_createVideo.md`
**Description--** Pseudocode for the `createVideo` method, which adds a new video record to the database.

## OVERVIEW

This document outlines the logic for creating a new video entry in the database. It includes comprehensive input validation and the database insertion process. A key assumption is made that a unique `videoId` is provided as an input, which will serve as the primary key for the new record. This is based on the requirement to call `getVideo(id)` after creation.

---

## `createVideo` Method Pseudocode

**METHOD** `createVideo(videoId: string, title: string, channelName: string, duration: string, viewCount: integer, uploadDate: date, thumbnailURL: string, availabilityStatus: string, downloadedQuality: string, downloadPath: string)`
**RETURNS** `PROMISE<Video>`

**BEGIN PROMISE** (`RESOLVE`, `REJECT`)

  **-- Input Validation**
  **-- This section ensures all provided data conforms to the required format and constraints.**

  **IF** `videoId` is `NULL` or `EMPTY`
    `REJECT` with `NEW ArgumentException("Video ID cannot be null or empty.")`
    **RETURN**
  **END IF**

  **IF** `title` is `NULL` or `title.length` < 1 or `title.length` > 255
    `REJECT` with `NEW ArgumentException("Title must be between 1 and 255 characters.")`
    **RETURN**
  **END IF**

  **IF** `channelName` is `NULL` or `channelName.length` < 1 or `channelName.length` > 255
    `REJECT` with `NEW ArgumentException("Channel name must be between 1 and 255 characters.")`
    **RETURN**
  **END IF**

  **DEFINE** `durationRegex` as a regular expression to validate duration format (e.g., `^\d+--\d{2}$`)
  **IF** `duration` is `NULL` or `NOT durationRegex.test(duration)`
    `REJECT` with `NEW ArgumentException("Duration must be in a valid format (e.g., '1--23').")`
    **RETURN**
  **END IF**

  **IF** `viewCount` is `NULL` or `IS_NOT_INTEGER(viewCount)` or `viewCount` < 0
    `REJECT` with `NEW ArgumentException("View count must be a non-negative integer.")`
    **RETURN**
  **END IF**

  **IF** `uploadDate` is `NULL` or `IS_NOT_VALID_DATE(uploadDate)`
    `REJECT` with `NEW ArgumentException("Upload date must be a valid date.")`
    **RETURN**
  **END IF**

  **IF** `thumbnailURL` is `NULL` or `IS_NOT_VALID_URL(thumbnailURL)`
    `REJECT` with `NEW ArgumentException("Thumbnail URL must be a valid URL.")`
    **RETURN**
  **END IF**

  **DEFINE** `allowedStatus` as `['AVAILABLE', 'UNAVAILABLE', 'PRIVATE']`
  **IF** `availabilityStatus` is `NULL` or `NOT allowedStatus.includes(availabilityStatus)`
    `REJECT` with `NEW ArgumentException("Availability status is invalid.")`
    **RETURN**
  **END IF**

  **-- Note-- Validation for downloadedQuality and downloadPath are omitted as per spec, but would be included in a real implementation.**

  **-- Database Interaction**
  **BEGIN TRY**

    **DEFINE** `currentTime` as `GET_CURRENT_TIMESTAMP()`
    **DEFINE** `sql` as `
      INSERT INTO videos (
        id, title, channelName, duration, viewCount, uploadDate,
        thumbnailURL, availabilityStatus, downloadedQuality, downloadPath,
        createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`

    **DEFINE** `params` as `[
      videoId, title, channelName, duration, viewCount, uploadDate,
      thumbnailURL, availabilityStatus, downloadedQuality, downloadPath,
      currentTime, currentTime
    ]`

    **-- Execute the insert query. We don't need the result of this query directly,**
    **-- as we will fetch the newly created video using the provided videoId.**
    `AWAIT this.db.query(sql, params)`

    **-- Fetch the complete video object to confirm creation and return it.**
    **DEFINE** `newVideo` as `AWAIT this.getVideo(videoId)`

    **RESOLVE**(`newVideo`)

  **END TRY**
  **BEGIN CATCH** (`dbError`)
    `LOG("Database error in createVideo-- ", dbError)`
    `REJECT(dbError)`
  **END CATCH**

**END PROMISE**

**END METHOD**