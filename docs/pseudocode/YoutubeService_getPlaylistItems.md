# Pseudocode: `YoutubeService.getPlaylistItems`

This document outlines the pseudocode for the `getPlaylistItems` method of the `YoutubeService` class. This method is responsible for fetching all video items from a given YouTube playlist.

## Method: `getPlaylistItems`

**Signature:** `getPlaylistItems(playlistId: string): Promise<PlaylistItem[]>`

**Description:** Retrieves all items from a specified YouTube playlist using the `yt-dlp-wrap` library. It handles fetching the complete list of items, which may involve pagination handled by the underlying library.

---

### Pseudocode Logic

```plaintext
PROMISE getPlaylistItems(playlistId)
  -- Input Validation
  IF playlistId is not a string OR playlistId is an empty string THEN
    REJECT with new ArgumentException("playlistId must be a non-empty string.")
  END IF

  -- Main Execution Block
  TRY
    LOG "Attempting to fetch all items for playlist --" + playlistId

    -- 1. Initialization
    DEFINE ytdlp as a new instance of the YtDlpWrap client.
    DEFINE allItems as an empty Array of PlaylistItem objects.

    -- 2. API Call to fetch playlist data
    -- The yt-dlp command to dump the entire playlist's metadata as JSON
    -- will retrieve all entries without needing manual pagination.
    -- The '--dump-json' flag gets metadata for each video in the playlist.
    -- The '--flat-playlist' flag might be used, but we need individual video info.
    -- We assume the call returns a JSON object with an 'entries' array.
    AWAIT response = ytdlp.exec([
      "https://www.youtube.com/playlist?list=" + playlistId,
      "--dump-json"
      -- other flags to ensure all items are fetched if necessary
    ])

    -- 3. Data Mapping
    IF response AND response.entries AND response.entries is an Array THEN
      FOR EACH entry in response.entries
        -- Create a new PlaylistItem object
        DEFINE newItem as a new PlaylistItem

        -- Map fields from the YouTube response to our data model
        SET newItem.videoId to entry.id
        SET newItem.title to entry.title
        -- Map other relevant fields like duration, thumbnail, etc. if available
        -- SET newItem.duration to entry.duration
        -- SET newItem.thumbnailUrl to entry.thumbnail

        -- Add the new item to our list
        ADD newItem to allItems
      END FOR
    ELSE
      -- Handle cases where the playlist is empty or the response is malformed
      LOG "Playlist is empty or response format is unexpected for playlist --" + playlistId
    END IF

    -- 4. Resolution
    LOG "Successfully fetched " + allItems.length + " items for playlist --" + playlistId
    RESOLVE allItems

  CATCH error
    LOG_ERROR "Failed to fetch playlist items for playlist --" + playlistId + ". Error -- " + error.message

    -- Handle specific, identifiable errors from yt-dlp
    IF error.message contains "playlist does not exist" OR error.message contains "404 Not Found" THEN
      REJECT with new NotFoundException("Playlist with ID '" + playlistId + "' not found.")
    ELSE IF error.message contains "This playlist is private" THEN
      REJECT with new AccessDeniedException("Playlist with ID '" + playlistId + "' is private.")
    ELSE
      -- Generic catch-all for other errors (network issues, library failures)
      REJECT with new ServiceUnavailableException("The YouTube service is currently unavailable.")
    END IF
  END TRY
END PROMISE
```

### Supporting Data Structures

**PlaylistItem**
- `videoId`: `string` - The unique identifier for the YouTube video.
- `title`: `string` - The title of the video.
- (Other potential fields-- `duration`, `thumbnailUrl`, etc.)

### Exception Types
- `ArgumentException`: Thrown for invalid input parameters.
- `NotFoundException`: Thrown when the requested playlist cannot be found.
- `AccessDeniedException`: Thrown for private or inaccessible playlists.
- `ServiceUnavailableException`: Thrown for underlying service failures or network errors.