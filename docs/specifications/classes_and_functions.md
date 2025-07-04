# Classes and Functions

This document defines all classes and functions in the Playlistify application, including their properties, parameters, return types, and descriptions.

## Backend

### 1. Database Layer

#### a. Class: SQLiteAdapter

*   **Description:** Provides an abstraction layer for interacting with the SQLite database. This class is responsible for managing the database connection and executing SQL queries.
*   **Data Models:** None
*   **Class Description:** This class abstracts the underlying SQLite database, providing a consistent interface for executing queries and managing connections. It ensures that all database interactions are handled in a safe and efficient manner.
*   **Properties:**
    *   `db`: `sqlite3.Database` - The SQLite database connection object.
*   **Methods:**
    *   `constructor(dbPath: string)`
        *   **Description:** Initializes a new SQLiteAdapter instance and connects to the database.
        *   **Parameters:**
            *   `dbPath`: `string` - The path to the SQLite database file.
        *   **Return Type:** `void`
    *   `query(sql: string, params: any[]): Promise<any[]>`
        *   **Description:** Executes a SQL query with optional parameters.
        *   **Parameters:**
            *   `sql`: `string` - The SQL query to execute.
            *   `params`: `any[]` - An array of parameters to bind to the query.
        *   **Return Type:** `Promise<any[]>` - A promise that resolves to an array of rows returned by the query. The structure of the returned rows depends on the query executed.
        *   **Data Models:** Varies depending on the query.

#### b. Class: PlaylistRepository
*   **Description:** Provides methods for accessing and manipulating playlist data in the database. This class is responsible for creating, retrieving, updating, and deleting playlists.
*   **Data Models:** `Playlist`, `User`
*   **Class Description:** This repository handles all database interactions related to playlists. It provides methods to create, read, update, and delete playlist records, ensuring data consistency and integrity.
*   **Data Models:** `Playlist`, `User`
*   **Properties:**
    *   `db`: `SQLiteAdapter` - An instance of the SQLiteAdapter for database interaction.
*   **Methods:**
    *   `constructor(db: SQLiteAdapter)`
        *   **Description:** Initializes a new PlaylistRepository instance.
        *   **Parameters:**
            *   `db`: `SQLiteAdapter` - An instance of the SQLiteAdapter.
        *   **Return Type:** `void`
    *   `getPlaylist(id: integer): Promise<Playlist>`
        *   **Description:** Retrieves a playlist from the database by its ID.
        *   **Parameters:**
            *   `id`: `integer` - The ID of the playlist to retrieve.
        *   **Return Type:** `Promise<Playlist>` - A promise that resolves to a Playlist object, or null if not found.
    *   `createPlaylist(userId: integer, title: string, description: string, type: string): Promise<Playlist>`
    *   **Description:** Creates a new playlist in the database.
    *   **Parameters:**
        *   `userId`: `integer` - The ID of the user who owns the playlist.
        *   `title`: `string` - The title of the playlist.
        *   `description`: `string` - The description of the playlist.
        *   `type`: `string` - The type of playlist (e.g., "YOUTUBE", "CUSTOM").
    *   **Return Type:** `Promise<Playlist>` - A promise that resolves to the newly created Playlist object.
    *   **Data Models:** `Playlist`, `User`
    *   `updatePlaylist(id: integer, title: string, description: string): Promise<Playlist>`
        *   **Description:** Updates an existing playlist in the database.
        *   **Parameters:**
            *   `id`: `integer` - The ID of the playlist to update.
            *   `title`: `string` - The new title of the playlist.
            *   `description`: `string` - The new description of the playlist.
        *   **Return Type:** `Promise<Playlist>` - A promise that resolves to the updated Playlist object.
        *   **Data Models:** `Playlist`
    *   `deletePlaylist(id: integer): Promise<void>`
        *   **Description:** Deletes a playlist from the database.
        *   **Parameters:**
            *   `id`: `integer` - The ID of the playlist to delete.
        *   **Return Type:** `Promise<void>` - A promise that resolves when the playlist is deleted.
        *   **Data Models:** `Playlist`
    *   `getPlaylistsForUser(userId: integer): Promise<Playlist[]>`
        *   **Description:** Retrieves all playlists for a given user from the database.
        *   **Parameters:**
            *   `userId`: `integer` - The ID of the user.
        *   **Return Type:** `Promise<Playlist[]>` - A promise that resolves to an array of Playlist objects.
        *   **Data Models:** `Playlist`

#### c. Class: VideoRepository

*   **Description:** Provides methods for accessing and manipulating video data in the database. This class is responsible for creating, retrieving, updating, and deleting videos.
*   **Data Models:** `Video`
*   **Class Description:** This repository manages all database operations related to video entities. It provides an interface for creating, retrieving, updating, and deleting video records within the database.
*   **Properties:**
    *   `db`: `SQLiteAdapter` - An instance of the SQLiteAdapter for database interaction.
*   **Methods:**
    *   `constructor(db: SQLiteAdapter)`
        *   **Description:** Initializes a new VideoRepository instance.
        *   **Parameters:**
            *   `db`: `SQLiteAdapter` - An instance of the SQLiteAdapter.
        *   **Return Type:** `void`
    *   `getVideo(id: string): Promise<Video>`
        *   **Description:** Retrieves a video from the database by its ID.
        *   **Parameters:**
            *   `id`: `string` - The ID of the video to retrieve.
        *   **Return Type:** `Promise<Video>` - A promise that resolves to a Video object, or null if not found.
        *   **Data Models:** `Video`
    *   `createVideo(title: string, channelName: string, duration: string, viewCount: integer, uploadDate: date, thumbnailURL: string, availabilityStatus: string, downloadedQuality: string, downloadPath: string): Promise<Video>`
        *   **Description:** Creates a new video in the database.
        *   **Parameters:**
   *   `title`: `string` - Title of the video.
   *   `channelName`: `string` - Name of the YouTube channel that published the video.
   *   `duration`: `string` - Duration of the video.
   *   `viewCount`: `integer` - Number of views the video has.
   *   `uploadDate`: `date` - Date when the video was uploaded.
   *   `thumbnailURL`: `string` - URL of the video's thumbnail image.
   *   `availabilityStatus`: `string` - Status of the video's availability on YouTube (e.g., "LIVE", "DELETED", "PRIVATE").
   *   `downloadedQuality`: `string` - The actual video quality that was downloaded (e.g., "1080p", "720p").
   *   `downloadPath`: `string` - Path to the downloaded video file (if downloaded).
        *   **Return Type:** `Promise<Video>` - A promise that resolves to the newly created Video object.
        *   **Data Models:** `Video`
    *   `updateVideo(id: string, title: string, channelName: string, duration: string, viewCount: integer, uploadDate: date, thumbnailURL: string, availabilityStatus: string, downloadedQuality: string, downloadPath: string): Promise<Video>`
        *   **Description:** Updates an existing video in the database.
        *   **Parameters:**
   *   `id`: `string` - Unique identifier for the video (e.g., YouTube video ID).
   *   `title`: `string` - Title of the video.
   *   `channelName`: `string` - Name of the YouTube channel that published the video.
   *   `duration`: `string` - Duration of the video.
   *   `viewCount`: `integer` - Number of views the video has.
   *   `uploadDate`: `date` - Date when the video was uploaded.
   *   `thumbnailURL`: `string` - URL of the video's thumbnail image.
   *   `availabilityStatus`: `string` - Status of the video's availability on YouTube (e.g., "LIVE", "DELETED", "PRIVATE").
   *   `downloadedQuality`: `string` - The actual video quality that was downloaded (e.g., "1080p", "720p").
   *   `downloadPath`: `string` - Path to the downloaded video file (if downloaded).
        *   **Return Type:** `Promise<Video>` - A promise that resolves to the updated Video object.
        *   **Data Models:** `Video`
    *   `deleteVideo(id: string): Promise<void>`
        *   **Description:** Deletes a video from the database.
        *   **Parameters:**
            *   `id`: `string` - The ID of the video to delete.
        *   **Return Type:** `Promise<void>` - A promise that resolves when the video is deleted.
        *   **Data Models:** `Video`
    *   `getVideosForPlaylist(playlistId: integer): Promise<Video[]>`
        *   **Description:** Retrieves all videos for a given playlist from the database.
        *   **Parameters:**
            *   `playlistId`: `integer` - The ID of the playlist.
        *   **Return Type:** `Promise<Video[]>` - A promise that resolves to an array of Video objects.
        *   **Data Models:** `Video`

#### d. Class: BackgroundTaskRepository

*   **Description:** Provides methods for accessing and manipulating background task data in the database. This class is responsible for creating, retrieving, updating, and canceling background tasks.
*   **Data Models:** `BackgroundTask`
*   **Class Description:** This repository is responsible for managing background tasks in the database, including creating, updating, retrieving, and canceling tasks. It also handles task updates and emits events to the frontend.
*   **Properties:**
    *   `db`: `SQLiteAdapter` - An instance of the SQLiteAdapter for database interaction.
    *   `appEmitter`: `EventEmitter` - An instance of the EventEmitter class for sending task updates.
	*   `taskQueue`: `PQueue` - An instance of the PQueue class for managing the task queue.
*   **Methods:**
    *   `constructor(taskRepository: SQLiteAdapter, appEmitter: EventEmitter, taskQueue: PQueue)`
        *   **Description:** Initializes a new BackgroundTaskRepository instance.
        *   **Parameters:**
            *   `db`: `SQLiteAdapter` - An instance of the SQLiteAdapter.
 		        *  `appEmitter`: `EventEmitter` - An instance of the EventEmitter class for sending task updates.
		        * `taskQueue`: `PQueue` - An instance of the PQueue class for managing the task queue.
            *   **Return Type:** `void`
        *   `createTask(type: string, targetId: string, parentId: integer | null, details: any): Promise<BackgroundTask>`
            *   **Description:** Creates a new background task.
            *   **Parameters:**
                *   `type`: `string` - The type of task.
                *   `targetId`: `string` - The ID of the target entity.
                *   `parentId`: `integer | null` - The ID of the parent task or null if it doesn't have a parent.
                *   `details`: `any` - Additional details about the task.
            *   **Return Type:** `Promise<BackgroundTask>` - A promise that resolves to the newly created BackgroundTask object.
        *   **Data Models:** `BackgroundTask`
        *   `updateTaskStatus(id: integer, status: string): Promise<BackgroundTask>`
            *   **Description:** Updates the status of a background task.
            *   **Parameters:**
                *   `id`: `integer` - The ID of the task to update.
                *   `status`: `string` - The new status of the task.
            *   **Return Type:** `Promise<BackgroundTask>` - A promise that resolves to the updated BackgroundTask object.
        *   **Data Models:** `BackgroundTask`
        *   `updateTaskProgress(id: integer, progress: integer): Promise<BackgroundTask>`
            *   **Description:** Updates the progress of a background task.
            *   **Parameters:**
                *   `id`: `integer` - The ID of the task to update.
                *   `progress`: `integer` - The progress of the task (0-100).
            *   **Return Type:** `Promise<BackgroundTask>` - A promise that resolves to the updated BackgroundTask object.
        *   **Data Models:** `BackgroundTask`
		*   `handleChildTaskCompletion(childTaskId: integer): Promise<void>`
		          *   **Description:** Handles completion of a child task and updates parent task progress.
		          *   **Parameters:**
		              *   `childTaskId`: `integer` - The ID of the completed child task.
		          *   **Return Type:** `Promise<void>` - A promise that resolves when the operation is complete.
		      *   **Data Models:** `BackgroundTask`
        *   `getTask(id: integer): Promise<BackgroundTask | null>`
            *   **Description:** Retrieves a task by ID.
            *   **Parameters:**
                *   `id`: `integer` - The ID of the task to retrieve.
            *   **Return Type:** `Promise<BackgroundTask | null>` - A promise that resolves to the BackgroundTask object or null if not found.
        *   **Data Models:** `BackgroundTask`
		*   `cancelTask(id: integer): Promise<void>`
		    *   **Description:** Cancels a task, removing it from the queue.
		    *   **Parameters:**
		        *   `id`: `integer` - The ID of the task to cancel.
		    *   **Return Type:** `Promise<void>` - A promise that resolves when the task has been cancelled (or removed from queue).
		      *   **Data Models:** `BackgroundTask`
		*   `emitTaskUpdate(): void`
			*   **Description:** Emits the task update event to the frontend.
			*   **Parameters:** None
			*   **Return Type:** `void`
		      *   **Data Models:** `BackgroundTask`

### 2. Business Logic Layer

#### a. Class: UserManager

*   **Description:** Manages user authentication, registration, and profile management.
*   **Data Models:** `User`
*   **Class Description:** This class centralizes user management functionalities, including registration, login, and profile updates. It leverages the UserRepository for data access and the AuthenticationService for secure password handling.
*   **Properties:**
    *   `userRepository`: `UserRepository` - An instance of the UserRepository for database interaction.
    *   `authenticationService`: `AuthenticationService` - An instance of the AuthenticationService for handling authentication logic.
*   **Methods:**
    *   `constructor(userRepository: UserRepository, authenticationService: AuthenticationService)`
        *   **Description:** Initializes a new UserManager instance.
        *   **Parameters:**
            *   `userRepository`: `UserRepository` - An instance of the UserRepository.
            *   `authenticationService`: `AuthenticationService` - An instance of the AuthenticationService.
        *   **Return Type:** `void`
    *   `registerUser(username: string, password: string, email: string): Promise<User>`
        *   **Description:** Registers a new user.
        *   **Parameters:**
            *   `username`: `string` - The username of the new user.
            *   `password`: `string` - The password of the new user.
            *   `email`: `string` - The email address of the new user.
        *   **Return Type:** `Promise<User>` - A promise that resolves to the newly created User object.
        *   **Data Models:** `User`
    *   `loginUser(username: string, password: string): Promise<User>`
        *   **Description:** Logs in an existing user.
        *   **Parameters:**
            *   `username`: `string` - The username of the user.
            *   `password`: `string` - The password of the user.
        *   **Return Type:** `Promise<User>` - A promise that resolves to the User object if login is successful, or null otherwise.
        *   **Data Models:** `User`
    *   `updateUserProfile(userId: integer, newUsername: string, newEmail: string): Promise<User>`
        *   **Description:** Updates the profile of an existing user.
        *   **Parameters:**
            *   `userId`: `integer` - The ID of the user to update.
            *   `newUsername`: `string` - The new username for the user.
            *   `newEmail`: `string` - The new email address of the user.
        *   **Return Type:** `Promise<User>` - A promise that resolves to the updated User object.
        *   **Data Models:** `User`

#### b. Class: PlaylistManager

*   **Description:** Manages playlist creation, modification, and deletion. This class is responsible for orchestrating actions related to playlists, such as adding and removing videos, and updating playlist metadata.
*   **Data Models:** `Playlist`, `Video`
*   **Class Description:** This class orchestrates playlist management, providing methods to create, update, delete playlists, and manage the videos within them. It ensures data consistency and handles interactions between the PlaylistRepository and VideoRepository.
*   **Properties:**
    *   `playlistRepository`: `PlaylistRepository` - An instance of the PlaylistRepository for database interaction.
    *   `videoRepository`: `VideoRepository` - An instance of the VideoRepository for database interaction.
*   **Methods:**
    *   `constructor(playlistRepository: PlaylistRepository, videoRepository: VideoRepository)`
        *   **Description:** Initializes a new PlaylistManager instance.
        *   **Parameters:**
            *   `playlistRepository`: `PlaylistRepository` - An instance of the PlaylistRepository.
            *   `videoRepository`: `VideoRepository` - An instance of the VideoRepository.
        *   **Return Type:** `void`
    *   `createPlaylist(userId: integer, title: string, description: string, type: string): Promise<Playlist>`
        *   **Description:** Creates a new playlist.
        *   **Parameters:**
            *   `userId`: `integer` - The ID of the user who owns the playlist.
            *   `title`: `string` - The title of the playlist.
            *   `description`: `string` - The description of the playlist.
            *   `type`: `string` - The type of playlist (e.g., "YOUTUBE", "CUSTOM").
        *   **Return Type:** `Promise<Playlist>` - A promise that resolves to the newly created Playlist object.
        *   **Data Models:** `Playlist`, `User`
    *   `addVideoToPlaylist(playlistId: integer, videoId: string): Promise<void>`
        *   **Description:** Adds a video to a playlist.
        *   **Parameters:**
            *   `playlistId`: `integer` - The ID of the playlist.
            *   `videoId`: `string` - The ID of the video to add.
        *   **Return Type:** `Promise<void>` - A promise that resolves when the video is added to the playlist.
        *   **Data Models:** `Playlist`, `Video`
    *   `removeVideoFromPlaylist(playlistId: integer, videoId: string): Promise<void>`
        *   **Description:** Removes a video from a playlist.
        *   **Parameters:**
            *   `playlistId`: `integer` - The ID of the playlist.
            *   `videoId`: `string` - The ID of the video to remove.
        *   **Return Type:** `Promise<void>` - A promise that resolves when the video is removed from the playlist.
        *   **Data Models:** `Playlist`, `Video`
    *   `updatePlaylist(playlistId: integer, title: string, description: string): Promise<Playlist>`
        *   **Description:** Updates an existing playlist.
        *   **Parameters:**
            *   `playlistId`: `integer` - The ID of the playlist to update.
            *   `title`: `string` - The new title of the playlist.
            *   `description`: `string` - The new description of the playlist.
        *   **Return Type:** `Promise<Playlist>` - A promise that resolves to the updated Playlist object.
        *   **Data Models:** `Playlist`
    *   `deletePlaylist(playlistId: integer): Promise<void>`
        *   **Description:** Deletes a playlist.
        *   **Parameters:**
            *   `playlistId`: `integer` - The ID of the playlist to delete.
        *   **Return Type:** `Promise<void>` - A promise that resolves when the playlist is deleted.
        *   **Data Models:** `Playlist`

#### c. Class: VideoDownloader

*   **Description:** Manages the downloading of videos from YouTube. This class orchestrates the process of downloading videos, interacting with the YouTube API, and managing background tasks.
*   **Data Models:** `Video`, `BackgroundTask`
*   **Class Description:** This class manages the video downloading process, interacting with the YouTube API and managing background tasks. It coordinates the retrieval of video metadata, the creation of download tasks, and the updating of video information in the database.
*   **Properties:**
    *   `videoRepository`: `VideoRepository` - An instance of the VideoRepository for database interaction.
    *   `backgroundTaskRepository`: `BackgroundTaskRepository` - An instance of the BackgroundTaskRepository for managing background tasks.
    *   `youtubeService`: `YoutubeService` - An instance of the YoutubeService for interacting with the YouTube API.
*   **Methods:**
    *   `constructor(videoRepository: VideoRepository, backgroundTaskRepository: BackgroundTaskRepository, youtubeService: YoutubeService)`
        *   **Description:** Initializes a new VideoDownloader instance.
        *   **Parameters:**
            *   `videoRepository`: `VideoRepository` - An instance of the VideoRepository.
            *   `backgroundTaskRepository`: `BackgroundTaskRepository` - An instance of the BackgroundTaskRepository.
            *   `youtubeService`: `YoutubeService` - An instance of the YoutubeService.
        *   **Return Type:** `void`
    *   `downloadVideo(videoId: string, quality: string, format: string, includeSubtitles: boolean, downloadLocation: string): Promise<void>`
        *   **Description:** Downloads a video from YouTube.
        *   **Parameters:**
            *   `videoId`: `string` - The ID of the video to download.
            *   `quality`: `string` - The quality of the video to download.
            *   `format`: `string` - The format of the video to download.
            *   `includeSubtitles`: `boolean` - Whether to include subtitles.
            *   `downloadLocation`: `string` - The location to download the video to.
        *   **Return Type:** `Promise<void>` - A promise that resolves when the video is downloaded.
        *   **Data Models:** `Video`, `BackgroundTask`

#### d. Class: YoutubeService

*   **Description:** Handles communication with the YouTube API. This class is responsible for retrieving video and playlist metadata from YouTube.
*   **Data Models:** `VideoMetadata`, `PlaylistMetadata`, `PlaylistItem`
*   **Class Description:** This service class handles communication with the YouTube API, providing methods to retrieve video and playlist metadata. It encapsulates the API key and handles the complexities of interacting with the YouTube API.
*   **Properties:**
    *   `apiKey`: `string` - The YouTube API key.
*   **Methods:**
    *   `constructor(apiKey: string)`
        *   **Description:** Initializes a new YoutubeService instance.
        *   **Parameters:**
            *   `apiKey`: `string` - The YouTube API key.
        *   **Return Type:** `void`
    *   `getVideoMetadata(videoId: string): Promise<VideoMetadata>`
        *   **Description:** Retrieves metadata for a video from YouTube.
        *   **Parameters:**
            *   `videoId`: `string` - The ID of the video.
        *   **Return Type:** `Promise<VideoMetadata>` - A promise that resolves to a VideoMetadata object.
        *   **Data Models:** `VideoMetadata`
    *   `getPlaylistMetadata(playlistId: string): Promise<PlaylistMetadata>`
        *   **Description:** Retrieves metadata for a playlist from YouTube.
        *   **Parameters:**
            *   `playlistId`: `string` - The ID of the playlist.
        *   **Return Type:** `Promise<PlaylistMetadata>` - A promise that resolves to a PlaylistMetadata object.
        *   **Data Models:** `PlaylistMetadata`
    *   `getPlaylistItems(playlistId: string): Promise<PlaylistItem[]>`
        *   **Description:** Retrieves items from a playlist from YouTube.
        *   **Parameters:**
            *   `playlistId`: `string` - The ID of the playlist.
        *   **Return Type:** `Promise<PlaylistItem[]>` - A promise that resolves to an array of PlaylistItem objects.
        *   **Data Models:** `PlaylistItem`

#### e. Class: UserRepository

*   **Description:** Provides methods for accessing and manipulating user data in the database. This class is responsible for creating, retrieving, updating, and deleting users.
*   **Data Models:** `User`
*   **Class Description:** This repository manages user data in the database, providing methods to create, retrieve, update, and delete user records. It ensures data consistency and provides an abstraction layer for database interactions related to users.
*   **Properties:**
    *   `db`: `SQLiteAdapter` - An instance of the SQLiteAdapter for database interaction.
*   **Methods:**
    *   `constructor(db: SQLiteAdapter)`
        *   **Description:** Initializes a new UserRepository instance.
        *   **Parameters:**
            *   `db`: `SQLiteAdapter` - An instance of the SQLiteAdapter.
        *   **Return Type:** `void`
    *   `getUser(id: integer): Promise<User>`
        *   **Description:** Retrieves a user from the database by its ID.
        *   **Parameters:**
            *   `id`: `integer` - The ID of the user to retrieve.
        *   **Return Type:** `Promise<User>` - A promise that resolves to a User object, or null if not found.
        *   **Data Models:** `User`
    *   `getUserByUsername(username: string): Promise<User>`
        *   **Description:** Retrieves a user from the database by its username.
        *   **Parameters:**
            *   `username`: `string` - The username of the user to retrieve.
        *   **Return Type:** `Promise<User>` - A promise that resolves to a User object, or null if not found.
        *   **Data Models:** `User`
    *   `createUser(username: string, passwordHash: string, email: string): Promise<User>`
        *   **Description:** Creates a new user in the database.
        *   **Parameters:**
            *   `username`: `string` - The username of the new user.
            *   `passwordHash`: `string` - The password hash of the new user.
            *   `email`: `string` - The email address of the new user.
        *   **Return Type:** `Promise<User>` - A promise that resolves to the newly created User object.
        *   **Data Models:** `User`
    *   `updateUser(id: integer, username: string, email: string): Promise<User>`
        *   **Description:** Updates an existing user in the database.
        *   **Parameters:**
            *   `id`: `integer` - The ID of the user to update.
            *   `username`: `string` - The new username of the user.
            *   `email`: `string` - The new email address of the user.
        *   **Return Type:** `Promise<User>` - A promise that resolves to the updated User object.
        *   **Data Models:** `User`
    *   `deleteUser(id: integer): Promise<void>`
        *   **Description:** Deletes a user from the database.
        *   **Parameters:**
            *   `id`: `integer` - The ID of the user to delete.
        *   **Return Type:** `Promise<void>` - A promise that resolves when the user is deleted.
        *   **Data Models:** `User`

#### f. Class: AuthenticationService

*   **Description:** Provides methods for handling user authentication. This class is responsible for hashing and comparing passwords.
*   **Data Models:** None
*   **Class Description:** This service class provides methods for securely handling user authentication, including password hashing and comparison. It uses bcrypt to ensure password security and provides a consistent interface for authentication-related tasks.
*   **Properties:**
    *   `saltRounds`: `integer` - The number of salt rounds to use for password hashing.
*   **Methods:**
    *   `constructor(saltRounds: integer)`
        *   **Description:** Initializes a new AuthenticationService instance.
        *   **Parameters:**
            *   `saltRounds`: `integer` - The number of salt rounds to use for password hashing.
        *   **Return Type:** `void`
    *   `hashPassword(password: string): Promise<string>`
        *   **Description:** Hashes a password using bcrypt.
        *   **Parameters:**
            *   `password`: `string` - The password to hash.
        *   **Return Type:** `Promise<string>` - A promise that resolves to the hashed password.
        *   **Data Models:** None
    *   `comparePassword(password: string, hash: string): Promise<boolean>`
        *   **Description:** Compares a password to a hash using bcrypt.
        *   **Parameters:**
            *   `password`: `string` - The password to compare.
            *   `hash`: `string` - The hash to compare against.
        *   **Return Type:** `Promise<boolean>` - A promise that resolves to true if the password matches the hash, or false otherwise.
        *   **Data Models:** None

### 3. Utils Layer

### 3. Utils Layer

#### a. Function: sanitizeFilename(filename: string): string
    *   **Description:** Sanitizes a filename by removing invalid characters.
    *   **Parameters:**
        *   `filename`: `string` - The filename to sanitize.
    *   **Return Type:** `string` - The sanitized filename.
    *   **Data Models:** None

#### b. Function: formatDuration(duration: number): string
    *   **Description:** Formats a duration in seconds into a human-readable string (e.g., "1:23").
    *   **Parameters:**
        *   `duration`: `number` - The duration in seconds.
    *   **Return Type:** `string` - The formatted duration string.
    *   **Data Models:** None

#### c. Function: truncate(str: string, num: number): string
    *   **Description:** Truncates a string to a specified length and adds an ellipsis if it exceeds the limit.
    *   **Parameters:**
        *   `str`: `string` - The string to truncate.
        *   `num`: `number` - The maximum length of the string.
    *   **Return Type:** `string` - The truncated string.
    *   **Data Models:** None
    *   **Return Type:** `string` - The truncated string.

## Frontend

### 1. Components

#### a. Class: VideoPlayer

*   **Description:** A React component for playing videos. This component is responsible for rendering the video player and handling playback controls.
*   **Data Models:** `Video`, `Playlist`
*   **Class Description:** This React component renders a video player with playback controls, displaying a single video or a video from a playlist. It handles user interactions such as play/pause, volume control, and seeking, and provides callbacks for navigating between videos in a playlist.
*   **Properties:**
    *   `videoId`: `string` - The ID of the video to play.
    *   `playlistId`: `string` - The ID of the playlist the video belongs to.
    *   `videoUrl`: `string` - The URL of the video.
    *   `title`: `string` - The title of the video.
    *   `onNext`: `() => void` - Callback function for playing the next video.
    *   `onPrevious`: `() => void` - Callback function for playing the previous video.
    *   `hasNext`: `boolean` - Whether there is a next video.
    *   `hasPrevious`: `boolean` - Whether there is a previous video.
*   **State:**
    *   `playing`: `boolean` - Whether the video is currently playing.
    *   `volume`: `number` - The volume level (0-1).
    *   `muted`: `boolean` - Whether the video is muted.
    *   `played`: `number` - The current playback progress (0-1).
    *   `duration`: `number` - The total duration of the video.
    *   `videoPath`: `string | null` - The path to the video file.
    *   `loading`: `boolean` - Whether the video is loading.
    *   `error`: `string | null` - Any error message.
*   **Refs:**
    *   `playerRef`: `React.RefObject<ReactPlayer>` - A reference to the ReactPlayer component.
*   **Methods:**
    *   `constructor(props: VideoPlayerProps)`
        *   **Description:** Initializes a new VideoPlayer instance.
        *   **Parameters:**
            *   `props`: `VideoPlayerProps` - The properties of the component.
        *   **Return Type:** `void`
    *   `useEffect(() => { ... }, [videoId, playlistId, videoUrl])`: `void`
        *   **Description:** React hook that checks if the video file exists and get its path.
        *   **Parameters:** None
        *   **Return Type:** `void`
    *   `handlePlayPause(): void`
        *   **Description:** Toggles the playback state of the video.
        *   **Parameters:** None
        *   **Return Type:** `void`
    *   `handleVolumeChange(e: React.ChangeEvent<HTMLInputElement>): void`
        *   **Description:** Handles changes to the volume slider.
        *   **Parameters:**
            *   `e`: `React.ChangeEvent<HTMLInputElement>` - The event object.
        *   **Return Type:** `void`
    *   `handleToggleMute(): void`
        *   **Description:** Toggles the mute state of the video.
        *   **Parameters:** None
        *   **Return Type:** `void`
    *   `handleProgress(state: any): void`
        *   **Description:** Handles progress updates from the ReactPlayer component.
        *   **Parameters:**
            *   `state`: `any` - The progress state object.
        *   **Return Type:** `void`
    *   `handleDuration(duration: number): void`
        *   **Description:** Handles the duration of the video.
        *   **Parameters:**
            *   `duration`: `number` - The duration of the video.
        *   **Return Type:** `void`
    *   `handleSeekChange(values: number[]): void`
        *   **Description:** Handles seeking the video.
        *   **Parameters:**
            *   `values`: `number[]` - The seek value.
        *   **Return Type:** `void`
    *   `handleSeekMouseUp(values: number[]): void`
        *   **Description:** Handles mouse up event after seeking.
        *   **Parameters:**
            *   `values`: `number[]` - The seek value.
        *   **Return Type:** `void`
    *   `handleSeekMouseDown(values: number[]): void`
        *   **Description:** Handles mouse down event for seeking.
        *   **Parameters:**
            *   `values`: `number[]` - The seek value.
        *   **Return Type:** `void`
	*    `handleNext(): void`
	        *   **Description:** Handles playing the next video in the playlist.
	        *   **Parameters:** None
	        *   **Return Type:** `void`
	*   `handlePrevious(): void`
	        *   **Description:** Handles playing the previous video in the playlist.
	        *   **Parameters:** None
	        *   **Return Type:** `void`

#### c. Class: PlaylistDetailsView

*   **Description:** A React component for viewing the details of a playlist.
*   **Class Description:** This React component displays the details of a playlist, including its videos, and allows users to search, add, remove, and edit videos in the playlist.
*   **Properties:**
	   *   `playlistId`: `string` - The ID of the playlist to view.
*   **State:**
	   *   `playlist`: `Playlist` - The playlist object.
	   *   `videos`: `Video[]` - An array of videos in the playlist.
	   *   `searchQuery`: `string` - The current search query.
*   **Methods:**
	   *   `constructor(props: PlaylistDetailsViewProps)`
	       *   **Description:** Initializes a new PlaylistDetailsView instance.
	       *   **Parameters:**
	           *   `props`: `PlaylistDetailsViewProps` - The properties of the component.
	       *   **Return Type:** `void`
	   *   `useEffect(() => { ... }, [playlistId])`: `void`
	       *   **Description:** React hook that fetches the playlist details when the component mounts or the playlistId changes.
	       *   **Parameters:** None
	       *   **Return Type:** `void`
	   *   `handleSearchChange(e: React.ChangeEvent<HTMLInputElement>): void`
	       *   **Description:** Handles changes to the search input.
	       *   **Parameters:**
	           *   `e`: `React.ChangeEvent<HTMLInputElement>` - The event object.
	       *   **Return Type:** `void`
	   *   `handleAddToPlaylist(videoId: string): void`
	       *   **Description:** Handles adding a video to the playlist.
	       *   **Parameters:**
	           *   `videoId`: `string` - The ID of the video to add.
	       *   **Return Type:** `void`
	   *   `handleRemoveFromPlaylist(videoId: string): void`
	       *   **Description:** Handles removing a video from the playlist.
	       *   **Parameters:**
	           *   `videoId`: `string` - The ID of the video to remove.
	       *   **Return Type:** `void`
	   *   `handleEditPlaylistDetails(): void`
	       *   **Description:** Handles editing the playlist details.
	       *   **Parameters:** None
	       *   **Return Type:** `void`
	   *   `handleDeletePlaylist(): void`
	       *   **Description:** Handles deleting the playlist.
	       *   **Parameters:** None
	       *   **Return Type:** `void`
	*   `handleRefreshStatus(): void`
	    *   **Description:** Handles refreshing the status of the playlist.
	    *   **Parameters:** None
	    *   **Return Type:** `void`

#### d. Class: AddNewPlaylistDialog

*   **Description:** A React component for adding playlists, either custom or from YouTube.
*   **Class Description:** This React component provides a dialog for adding new playlists, allowing users to create custom playlists or import them from YouTube. It manages the state of the dialog and handles the creation or import process.
*   **Properties:**
    *   `open`: `boolean` - Whether the dialog is open.
    *   `onOpenChange`: `(open: boolean) => void` - Callback function for when the dialog is opened or closed.
*   **State:**
    *   `selectedTab`: `string` - The currently selected tab ("custom" or "youtube").
    *   `customPlaylistTitle`: `string` - The title of the custom playlist.
    *   `customPlaylistDescription`: `string` - The description of the custom playlist.
    *   `youtubePlaylistURL`: `string` - The URL of the YouTube playlist.
	*   `youtubePlaylistMetadata`: `object | null` - Metadata about the YouTube playlist
*   **Methods:**
    *   `constructor(props: DialogProps)`
        *   **Description:** Initializes a new AddNewPlaylistDialog instance.
        *   **Parameters:**
            *   `props`: `DialogProps` - The properties of the component.
        *   **Return Type:** `void`
    *   `handleCreateCustomPlaylist(): void`
        *   **Description:** Creates a new custom playlist.
        *   **Parameters:** None
        *   **Return Type:** `void`
    *   `handleImportYouTubePlaylist(): void`
        *   **Description:** Imports a playlist from YouTube.
        *   **Parameters:** None
        *   **Return Type:** `void`
    *   `handleTitleChange(e: React.ChangeEvent<HTMLInputElement>): void`
        *   **Description:** Handles changes to the custom playlist title input.
        *   **Parameters:**
            *   `e`: `React.ChangeEvent<HTMLInputElement>` - The event object.
        *   **Return Type:** `void`
    *   `handleDescriptionChange(e: React.ChangeEvent<HTMLTextAreaElement>): void`
        *   **Description:** Handles changes to the custom playlist description input.
        *   **Parameters:**
            *   `e`: `React.ChangeEvent<HTMLTextAreaElement>` - The event object.
        *   **Return Type:** `void`
     *  `handleYouTubeURLChange(e: React.ChangeEvent<HTMLInputElement>): void`
          *   **Description:** Handles changes to the YouTube playlist URL input.
          *   **Parameters:**
              *   `e`: `React.ChangeEvent<HTMLInputElement>` - The event object.
          *   **Return Type:** `void`
    *   `handleClearYouTubeURL(): void`
         *   **Description:** Clears the YouTube playlist URL input.
         *   **Parameters:** None
         *   **Return Type:** `void`

#### e. Class: UserProfileView

*   **Description:** A React component for viewing and editing the user profile.
*   **Class Description:** This React component displays the user profile and allows users to edit their information. It fetches the user data and handles the editing process.
*   **Properties:**
    *   `userId`: `string` - The ID of the user to view.
*   **State:**
    *   `user`: `User` - The user object.
*   **Methods:**
    *   `constructor(props: UserProfileViewProps)`
        *   **Description:** Initializes a new UserProfileView instance.
        *   **Parameters:**
            *   `props`: `UserProfileViewProps` - The properties of the component.
        *   **Return Type:** `void`
    *   `useEffect(() => { ... }, [userId])`: `void`
        *   **Description:** React hook that fetches the user profile when the component mounts or the userId changes.
        *   **Parameters:** None
        *   **Return Type:** `void`
    *   `handleEditProfile(): void`
        *   **Description:** Handles editing the user profile.
        *   **Parameters:** None
        *   **Return Type:** `void`

#### f. Class: ActivityCenter

*   **Description:** A React component that displays a list of active and completed background tasks.
*   **Class Description:** This React component displays a list of active and completed background tasks, providing a way for users to monitor the progress of background processes.
*   **Properties:**
     * `tasks` : `BackgroundTask[]` - The list of background tasks to display
     * `isMinimized` : `boolean` - A flag to determine if the activity center is minimized
*   **State:**
    *   `tasks`: `BackgroundTask[]` - An array of background tasks.
    *   `isMinimized`: `boolean` - Whether the activity center is minimized.
*   **Methods:**
    *   `constructor(props: ActivityCenterProps)`
        *   **Description:** Initializes a new ActivityCenter instance.
        *   **Parameters:**
            *   `props`: `ActivityCenterProps` - The properties of the component.
        *   **Return Type:** `void`
    *   `handleMinimize(): void`
        *   **Description:** Minimizes/maximizes the activity center.
        *   **Parameters:** None
        *   **Return Type:** `void`
    *   `handleClearAll(): void`
        *   **Description:** Clears all completed tasks from the activity center.
        *   **Parameters:** None
        *   **Return Type:** `void`
 *   `componentDidMount(): void`
     *   **Description:** React lifecycle method that is called after the component mounts.
     *   **Parameters:** None
     *   **Return Type:** `void`
 *   `componentWillUnmount(): void`
     *   **Description:** React lifecycle method that is called when the component will unmount.
     *   **Parameters:** None
     *   **Return Type:** `void`
 *   `handleTaskUpdate(task: BackgroundTask): void`
     *   **Description:** Handles task updates from the backend.
     *   **Parameters:**
         *   `task`: `BackgroundTask` - The updated background task.
     *   **Return Type:** `void`
 *   `renderTask(task: BackgroundTask): React.ReactNode`
     *   **Description:** Renders a single task item.
     *   **Parameters:**
         *   `task`: `BackgroundTask` - The background task to render.
     *   **Return Type:** `React.ReactNode` - The rendered task item.