# Arc 2: Key Questions for Robust Video Downloading and Conversion

This research arc addresses the core functionality of the application: reliably downloading video content from YouTube and handling various media formats.

1.  **Downloader Integration (`yt-dlp-wrap`):**
    *   What are the most effective command-line arguments for `yt-dlp` to ensure reliable downloading, including handling private/unlisted videos (where authenticated), and maximizing download speed?
    *   How can `yt-dlp-wrap` be used to get detailed progress updates (e.g., percentage, speed, ETA) and stream them to the frontend via IPC for a responsive user experience?
    *   What are the best error handling strategies when using `yt-dlp`? How should the application differentiate between recoverable errors (e.g., network timeout) and non-recoverable errors (e.g., video unavailable)?
    *   What is the best way to manage the `yt-dlp` binary itself? How to handle updates to `yt-dlp` to get the latest fixes without breaking the application?

2.  **Download & Queue Management (`p-queue`):**
    *   What is the optimal concurrency level for a download queue to balance performance and resource usage (CPU, network) without getting rate-limited by YouTube?
    *   How should a queuing system built with `p-queue` handle priorities? For example, should a user-initiated single video download take precedence over a background playlist sync?
    *   What is a robust mechanism for pausing, resuming, and canceling downloads, especially multi-part downloads that `yt-dlp` might perform?
    *   How can the application ensure the download queue state is persistent across application restarts?

3.  **Format Conversion and Quality (`ffmpeg`):**
    *   What are the most efficient `ffmpeg` commands for converting downloaded video and audio streams into standard formats like MP4 and MP3?
    *   How can the application reliably embed metadata (e.g., title, artist, album) and thumbnails into the final media files using `ffmpeg`?
    *   What is the best strategy for implementing adaptive quality selection? How to parse `yt-dlp` format codes to find the best available MP4 stream that matches the user's preference (e.g., "up to 1080p")?
    *   How should the application handle cases where separate video and audio streams are downloaded and need to be merged by `ffmpeg`? How to ensure this process is reliable and efficient?