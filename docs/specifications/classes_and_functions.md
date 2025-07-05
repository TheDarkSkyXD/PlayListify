# Classes and Functions

This document defines all classes and functions in the Playlistify application, including their properties, parameters, return types, and descriptions.

## Backend

### 1. Database Layer

#### a. Class: SQLiteAdapter

### Description
The `SQLiteAdapter` class provides an abstraction layer for interacting with an SQLite database. It handles database connections, schema application, and query execution.

### Properties

| Property          | Type                | Description                                                                                             |
| ----------------- | ------------------- | ------------------------------------------------------------------------------------------------------- |
| db                | sqlite3.Database    | The SQLite database connection object.                                                                  |
| dbPath            | string              | The path to the SQLite database file.                                                                   |
| isConnected       | boolean             | Flag indicating if the database is connected.                                                            |
| schemaPath        | string              | Path to the database schema file.                                                                        |
| maxRetries        | integer             | Maximum number of retries for database connection.                                                        |
| retryIntervalMs   | integer             | Retry interval in milliseconds.                                                                        |

### Constructor

#### Description
The constructor initializes a new `SQLiteAdapter` instance, connects to the database, and applies the schema.

#### Parameters
*   `dbPath` (string): The path to the SQLite database file.
*   `schemaPath` (string, optional): The path to the database schema file. Defaults to "schema/database_schema.sql".
*   `maxRetries` (integer, optional): The maximum number of retries for database connection. Defaults to 5.
*   `retryIntervalMs` (integer, optional): The retry interval in milliseconds. Defaults to 1000.
*   `connectionCheckIntervalMs` (integer, optional): The interval in milliseconds for checking the database connection. Defaults to 5000.

#### Throws
*   `ArgumentException`: If `dbPath` is null or empty or if `dbPath` is not a valid path.
*   `DatabaseConnectionError`: If the connection fails after `maxRetries` attempts.
*   `SchemaExecutionError`: If the schema execution fails.

### Methods

#### query(sql: string, params: any[]): Promise<any[]>

##### Description
Executes an SQL query with optional parameters.

##### Parameters
*   `sql` (string): The SQL query to execute.
*   `params` (any[]): An array of parameters to bind to the SQL query.

##### Returns
*   `Promise<any[]>`: A Promise that resolves with an array of objects representing the rows returned by the query.

##### Throws
*   `Promise.reject`: If `sql` is null or empty.
*   `Promise.reject`: If the query execution fails.

### CHECK_DATABASE_CONNECTION(): void

#### Description
Checks if the database connection is active and attempts to reconnect if necessary.

#### Parameters
*   None

#### Returns
*   void

#### Throws
*   `DatabaseConnectionError`: If the reconnection fails.

### Helper Functions

### IS_VALID_PATH(path: string): boolean

#### Description
Checks if a given path is valid. The implementation is OS-specific. This function encapsulates the OS-specific path validation logic, making the `SQLiteAdapter` more portable and testable.

#### Parameters
*   `path` (string): The path to validate.

#### Returns
*   `boolean`: True if the path is valid, false otherwise.

### CONNECT_TO_DATABASE(dbPath: string): sqlite3.Database

#### Description
Connects to the SQLite database at the specified path. This function encapsulates the direct interaction with the `sqlite3` library, allowing for easier mocking and testing. It also provides a single point of change if the underlying database library is replaced.

#### Parameters
*   `dbPath` (string): The path to the SQLite database file.

#### Returns
*   `sqlite3.Database`: The SQLite database connection object.

### READ_FILE(filePath: string): string

#### Description
Reads the contents of a file at the specified path. This function encapsulates the file reading operation, allowing for easier mocking and testing.

#### Parameters
*   `filePath` (string): The path to the file.

#### Returns
*   `string`: The contents of the file.

### EXECUTE_SQL(db: sqlite3.Database, sql: string): void

#### Description
Executes an SQL statement against the database. This function encapsulates the execution of raw SQL commands, providing a single point for error handling and logging.

#### Parameters
*   `db` (sqlite3.Database): The SQLite database connection object.
*   `sql` (string): The SQL statement to execute.

#### Returns
*   `void`


### MANAGE_TRANSACTION(db: sqlite3.Database, action: string): void

#### Description
Manages database transactions (begin, commit, rollback). This function encapsulates the transaction management, providing a consistent way to handle transactions.

#### Parameters
*   `db` (sqlite3.Database): The SQLite database connection object.
*   `action` (string): The transaction action ("begin", "commit", "rollback").

#### Returns
*   `void`
### IS_TRANSACTION_ACTIVE(db: sqlite3.Database): boolean

#### Description
Checks if a transaction is currently active. This function encapsulates the logic for checking the transaction status.

#### Parameters
*   `db` (sqlite3.Database): The SQLite database connection object.

#### Returns
*   `boolean`: True if a transaction is active, false otherwise.

### IS_DATABASE_CONNECTED(db: sqlite3.Database): boolean

#### Description
Checks if the database connection is currently active. This function encapsulates the logic for checking the database connection status.

#### Parameters
*   `db` (sqlite3.Database): The SQLite database connection object.

#### Returns
*   `boolean`: True if the database connection is active, false otherwise.

### SET_INTERVAL(callback: function, intervalMs: integer): any

#### Description
Sets up a timer that calls the callback function every intervalMs milliseconds. This function provides a consistent interface for setting intervals, abstracting away the underlying implementation.

#### Parameters
*   `callback` (function): The function to call.
*   `intervalMs` (integer): The interval in milliseconds.

#### Returns
*   `any`: A timer ID.


### LOG(message: string, level: string): void

#### Description
Logs a message to a suitable output (e.g., console, file). This function provides a centralized logging mechanism, allowing for easy modification of the logging behavior.

#### Parameters
*   `message` (string): The message to log.
*   `level` (string): The logging level ("info", "error").

#### Returns
*   `void`
### CALCULATE_BACKOFF_TIME(retries: integer, intervalMs: integer): integer

#### Description
Implements an exponential backoff strategy. This function encapsulates the backoff calculation logic, making it easier to adjust the backoff strategy.

#### Parameters
*   `retries` (integer): The number of retries.
*   `intervalMs` (integer): The base interval in milliseconds.

#### Returns
*   `integer`: The calculated backoff time in milliseconds.

### PREPARE_STATEMENT(db: sqlite3.Database, sql: string): sqlite3.Statement

#### Description
Prepares the SQL statement for execution. This function encapsulates the statement preparation process, handling potential errors and ensuring proper resource management.

#### Parameters
*   `db` (sqlite3.Database): The SQLite database connection object.
*   `sql` (string): The SQL query to prepare.

#### Returns
*   `sqlite3.Statement`: The prepared statement.

### BIND_PARAMETERS(statement: sqlite3.Statement, params: any[]): void

#### Description
Binds the parameters to the prepared statement. This function encapsulates the parameter binding process, ensuring proper escaping and preventing SQL injection.

#### Parameters
*   `statement` (sqlite3.Statement): The prepared statement.
*   `params` (any[]): An array of parameters to bind to the statement.

#### Returns
*   `void`

### EXECUTE_STATEMENT(statement: sqlite3.Statement): any

#### Description
Executes the prepared statement. This function encapsulates the execution of the prepared statement, handling potential errors and providing a consistent interface for query execution.

#### Parameters
*   `statement` (sqlite3.Statement): The prepared statement.

#### Returns
*   `any`: The result of the query execution.

### PROCESS_RESULT(result: any): any[]

#### Description
Processes the result from the executed statement. This function standardizes the result format, transforming the raw database output into a consistent array of objects.

#### Parameters
*   `result` (any): The result from the executed statement.

#### Returns
*   `any[]`: An array of objects representing the rows returned by the query.

### FINALIZE_STATEMENT(statement: sqlite3.Statement): void

#### Description
Finalizes the prepared statement, releasing resources. This function ensures that resources are properly released after query execution, preventing memory leaks.

#### Parameters
*   `statement` (sqlite3.Statement): The prepared statement.

#### Returns
*   `void`


### MANAGE_TIMER(timerId: any, action: string, callback: function, delayMs: integer): any

#### Description
Sets up or clears a timer. This function encapsulates the timer management, providing a consistent interface for setting timeouts.

#### Parameters
*   `timerId` (any): The timer ID (null if setting a new timer).
*   `action` (string): The timer action ("set", "clear").
*   `callback` (function): The function to call (only if action is "set").
*   `delayMs` (integer): The delay in milliseconds (only if action is "set").

#### Returns
*   `any`: A timer ID (only if action is "set").
*   `void`: (only if action is "clear").
### ABORT_QUERY(db: sqlite3.Database, statement: sqlite3.Statement): void

#### Description
Aborts the currently executing query. This function provides a mechanism for cancelling long-running queries, preventing them from blocking the application.

#### Parameters
*   `db` (sqlite3.Database): The SQLite database connection object.
*   `statement` (sqlite3.Statement): The prepared statement.

#### Returns
*   `void`
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
    *   `appEmitter`: `EventEmitter` - An instance of the EventEmitter class for sending task updates. This emitter sends task updates to the frontend for display.
	*   `taskQueue`: `PQueue` - An instance of the PQueue class for managing the task queue. It ensures tasks are processed in an orderly fashion, respecting concurrency limits. `appEmitter` and `taskQueue` work together to manage the task queue. `taskQueue` is used to enqueue and process tasks, while `appEmitter` is used to notify the frontend about task status changes.
*   **Methods:**
    *   `constructor(db: SQLiteAdapter, appEmitter: EventEmitter, taskQueue: PQueue)`
        *   **Description:** Initializes a new BackgroundTaskRepository instance.
        *   **Parameters:**
            *   `db`: `SQLiteAdapter` - An instance of the SQLiteAdapter.
       *   `appEmitter`: `EventEmitter` - An instance of the EventEmitter class for sending task updates.
      *   `taskQueue`: `PQueue` - An instance of the PQueue class for managing the task queue.
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
			*   **Description:** Emits a task update event to the frontend to notify clients of changes in task status or progress.
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
*   **Class Description:** This repository manages user data in the database, providing methods to create, retrieve, update, and