# Pseudocode: `HealthCheckService.constructor`

## Description
Initializes a new instance of the `HealthCheckService`, setting up its dependencies.

---

## CONSTRUCTOR `constructor(vRepo: VideoRepository, ytService: YoutubeService)`

### Parameters
- **`vRepo`**: `VideoRepository` -- An instance of the VideoRepository for database interactions related to videos.
- **`ytService`**: `YoutubeService` -- An instance of the YoutubeService for interacting with the YouTube API.

### Pre-conditions
- `vRepo` must be a valid, initialized `VideoRepository` instance.
- `ytService` must be a valid, initialized `YoutubeService` instance.

### Post-conditions
- A new `HealthCheckService` instance is created.
- `this.videoRepository` is set to the provided `vRepo` instance.
- `this.youtubeService` is set to the provided `ytService` instance.

### Logic

1.  **BEGIN**
2.      **-- Dependency Validation --**
3.      `IF` `vRepo` is `NULL` or `UNDEFINED`
4.          `THROW` new `ArgumentException` with message "VideoRepository cannot be null."
5.      `END IF`
6.  
7.      `IF` `ytService` is `NULL` or `UNDEFINED`
8.          `THROW` new `ArgumentException` with message "YoutubeService cannot be null."
9.      `END IF`
10. 
11.     **-- Property Assignment --**
12.     `SET` `this.videoRepository` to `vRepo`
13.     `SET` `this.youtubeService` to `ytService`
14. 
15. **END CONSTRUCTOR**