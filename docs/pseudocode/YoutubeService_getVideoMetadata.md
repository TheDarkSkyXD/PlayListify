# Pseudocode: YoutubeService.getVideoMetadata

## Description

This document outlines the pseudocode for the `getVideoMetadata` method in the `YoutubeService` class. This method retrieves metadata for a specific YouTube video using the `yt-dlp-wrap` library.

## Parameters

-   `videoId` (string) -- The unique identifier for the YouTube video.

## Returns

-   `Promise<VideoMetadata>` -- A promise that, upon success, resolves with a `VideoMetadata` object containing the video's details. On failure, it rejects with an appropriate error (`ArgumentException`, `NotFoundException`, `AccessDeniedException`, or `ServiceUnavailableException`).

## Data Models Involved

-   **VideoMetadata**:
    -   `title` (string)
    -   `channelName` (string)
    -   `duration` (number) -- Duration in seconds.
    -   `viewCount` (number)
    -   `uploadDate` (Date)
    -   `thumbnailURL` (string)
    -   `availabilityStatus` (string) -- e.g., 'Public', 'Private', 'Unlisted'

## Pseudocode

```
FUNCTION getVideoMetadata(videoId)
  PROMISE((resolve, reject) => {
    // --- Input Validation ---
    IF videoId IS NULL OR videoId IS NOT a STRING OR videoId is EMPTY
      LOG "Error: Invalid videoId provided."
      REJECT(NEW ArgumentException("videoId must be a non-empty string."))
      RETURN
    END IF

    // --- External API Call ---
    TRY
      LOG `Fetching metadata for videoId: ${videoId}`

      // 1. Instantiate the wrapper for the yt-dlp library
      ytDlpClient = NEW YtDlpWrapClient()

      // 2. Call the library to get video information
      // The actual method might be named differently, e.g., getVideoInfo, getMetadata
      rawMetadataJSON = AWAIT ytDlpClient.getVideoInfo(`https://www.youtube.com/watch?v=${videoId}`)

      // 3. Map the raw response to the structured VideoMetadata object
      videoMetadata = NEW VideoMetadata()
      videoMetadata.title = rawMetadataJSON.title
      videoMetadata.channelName = rawMetadataJSON.channel
      videoMetadata.duration = rawMetadataJSON.duration // Assuming duration is in seconds
      videoMetadata.viewCount = rawMetadataJSON.view_count
      videoMetadata.uploadDate = PARSE_DATE(rawMetadataJSON.upload_date) // e.g., from 'YYYYMMDD' to a Date object
      videoMetadata.thumbnailURL = rawMetadataJSON.thumbnail
      
      // Infer availability based on available fields or error codes from the library
      // This is a simplification; actual implementation may be more complex
      IF rawMetadataJSON.is_private
          videoMetadata.availabilityStatus = 'Private'
      ELSE IF rawMetadataJSON.availability IS 'unlisted'
          videoMetadata.availabilityStatus = 'Unlisted'
      ELSE
          videoMetadata.availabilityStatus = 'Public'
      END IF
      
      LOG `Successfully fetched metadata for videoId: ${videoId}`
      // 4. Resolve the promise with the mapped data
      RESOLVE(videoMetadata)

    CATCH (error)
      LOG `Error fetching metadata for videoId: ${videoId}. Error: ${error.message}`

      // --- Error Handling ---
      // Check for specific, identifiable errors from the yt-dlp library
      IF error.message CONTAINS "Video unavailable" OR error.statusCode == 404
        REJECT(NEW NotFoundException(`Video with ID '${videoId}' not found or is unavailable.`))
      ELSE IF error.message CONTAINS "This video is private"
        REJECT(NEW AccessDeniedException(`Access denied to private video with ID '${videoId}'.`))
      ELSE
        // For generic network errors, library failures, or unexpected issues
        REJECT(NEW ServiceUnavailableException(`Failed to fetch video metadata due to an external service error.`))
      END IF
    END TRY
  })
END FUNCTION