# Pseudocode: `YoutubeService.getPlaylistMetadata`

**Function:** `getPlaylistMetadata(playlistId)`

**Description:** Retrieves metadata for a given YouTube playlist ID by wrapping the `yt-dlp-wrap` library.

---

### **Inputs:**
- `playlistId`: `string` -- The unique identifier for the YouTube playlist.

### **Outputs:**
- `Promise<PlaylistMetadata>`: A promise that resolves with a `PlaylistMetadata` object on success or rejects with an appropriate error on failure.

### **Data Models:**
- `PlaylistMetadata`:
  - `title`: `string` -- The title of the playlist.
  - `description`: `string` -- The description of the playlist.
  - `videoCount`: `integer` -- The total number of videos in the playlist.
  - `channelName`: `string` -- The name of the channel that owns the playlist.
  - `playlistId`: `string` -- The ID of the playlist.

### **Exceptions:**
- `ArgumentException`: Thrown if `playlistId` is invalid.
- `NotFoundException`: Thrown if the playlist cannot be found.
- `AccessDeniedException`: Thrown if the playlist is private or access is otherwise restricted.
- `ServiceUnavailableException`: Thrown for any other external API errors.

---

### **BEGIN PROMISE** `getPlaylistMetadata(playlistId)`

  **1. Input Validation**
  
     - `IF` `playlistId` is `NULL`, `UNDEFINED`, or a zero-length string `THEN`
       - `LOG` "Error-- Invalid input. playlistId cannot be empty."
       - `REJECT` `PROMISE` with `new ArgumentException("playlistId cannot be null or empty.")`
       - `RETURN`
     - `END IF`

  **2. External API Call**

     - `TRY`
       - `LOG` "Attempting to fetch metadata for playlist: " + `playlistId`

       **2.1. Initialize API Client**
         - `// Note: Assumes yt-dlp-wrap client is available or can be instantiated.`
         - `DECLARE` `ytDlpClient` = `new YtDlpWrapClient()`

       **2.2. Execute API Request**
         - `LOG` "Calling external service (yt-dlp-wrap) to get playlist metadata."
         - `// Configure options to fetch only playlist metadata, not individual video details.`
         - `DECLARE` `requestOptions` = {
             `dumpSingleJson`: `true`,
             `flatPlaylist`: `true` 
           }
         - `DECLARE` `rawJsonResponse` = `AWAIT` `ytDlpClient.getPlaylistInfo(playlistId, requestOptions)`

       **2.3. Data Mapping**
         - `LOG` "Mapping raw JSON response to the local PlaylistMetadata data model."
         - `DECLARE` `metadata` = `new PlaylistMetadata()`
         - `metadata.title` = `rawJsonResponse.title`
         - `metadata.description` = `rawJsonResponse.description`
         - `metadata.videoCount` = `rawJsonResponse.entries.length` `// The length of the entries array represents the video count.`
         - `metadata.channelName` = `rawJsonResponse.uploader` `// The 'uploader' field typically holds the channel name.`
         - `metadata.playlistId` = `rawJsonResponse.id`

       **2.4. Resolve Promise**
         - `LOG` "Successfully fetched and mapped metadata for playlist: " + `playlistId`
         - `RESOLVE` `PROMISE` with `metadata`

     - `CATCH` `error`
       - `LOG` "Error-- An exception occurred while fetching metadata for playlist " + `playlistId` + ". Details: " + `error.message`

       **2.5. Specific Error Handling**
         - `// Analyze the error message to provide a more specific exception type.`
         - `IF` `error.message` contains "not found" or "does not exist" `THEN`
           - `REJECT` `PROMISE` with `new NotFoundException("The playlist with ID '" + playlistId + "' could not be found.")`
         - `ELSE IF` `error.message` contains "private" or "access denied" `THEN`
           - `REJECT` `PROMISE` with `new AccessDeniedException("Access to the playlist with ID '" + playlistId + "' is denied. It may be private.")`
         - `ELSE`
           - `// For all other errors, wrap in a generic service exception.`
           - `REJECT` `PROMISE` with `new ServiceUnavailableException("An external service error occurred while fetching playlist metadata.")`
         - `END IF`
     - `END TRY...CATCH`

### **END PROMISE**