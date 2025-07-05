# VideoDownloader Constructor Pseudocode

## CONSTRUCTOR(vRepo, btRepo, ytService)

### Description
Initializes a new instance of the `VideoDownloader` class, setting up its dependencies.

### Parameters
-   `vRepo` (VideoRepository) -- An instance of the VideoRepository for database interactions related to videos.
-   `btRepo` (BackgroundTaskRepository) -- An instance of the BackgroundTaskRepository for managing background tasks.
-   `ytService` (YoutubeService) -- An instance of the YoutubeService for interacting with the YouTube API.

### Pre-conditions
-   None.

### Post-conditions
-   The `videoRepository` property is initialized with `vRepo`.
-   The `backgroundTaskRepository` property is initialized with `btRepo`.
-   The `youtubeService` property is initialized with `ytService`.
-   An `ArgumentException` is thrown if any of the dependencies are null.

### Returns
-   `void`

---

### Logic

1.  **`CONSTRUCTOR(vRepo, btRepo, ytService)`**
2.      `// Validate dependencies`
3.      `IF vRepo IS NULL THEN`
4.          `THROW new ArgumentException("VideoRepository cannot be null.")`
5.      `END IF`
6.  
7.      `IF btRepo IS NULL THEN`
8.          `THROW new ArgumentException("BackgroundTaskRepository cannot be null.")`
9.      `END IF`
10. 
11.     `IF ytService IS NULL THEN`
12.         `THROW new ArgumentException("YoutubeService cannot be null.")`
13.     `END IF`
14. 
15.     `// Assign dependencies to class properties`
16.     `SET this.videoRepository = vRepo`
17.     `SET this.backgroundTaskRepository = btRepo`
18.     `SET this.youtubeService = ytService`
19. `END CONSTRUCTOR`