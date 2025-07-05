# Arc 1: Primary Findings - File System and Directory Structure

## Finding 5: Hybrid Directory Structure for Scalability and Usability

**Source(s):** Stack Overflow, TechTarget, Zapier

**Key Insight:** For managing a large number of media files, a hybrid approach that combines a user-friendly organizational structure with a performance-oriented storage strategy is optimal. Storing thousands of files in a single directory can lead to significant file system performance degradation.

**Paraphrased Summary:**
The application should separate the logical, user-facing organization of playlists from the physical storage of media files.

1.  **Logical (User-Facing) Structure:** The application's main download directory, as configured by the user, should contain folders with human-readable names corresponding to the playlists.
    *   Example: `D:/Music/Playlistify/My Workout Mix/`
    *   This provides a user-friendly structure that allows users to easily browse and manage their downloaded content directly through their operating system's file explorer.

2.  **Physical (Internal) Storage Structure:** To avoid performance issues, the actual video and audio files should **not** be stored directly in these human-readable folders. Instead, they should be stored in a nested, hashed directory structure within a dedicated internal `media` or `data` folder. This structure is derived from the video's unique ID.
    *   **Strategy:** Take the unique ID of a video (e.g., `dQw4w9WgXcQ`) and use its first few characters to create subdirectories.
    *   **Example:** A video with ID `dQw4w9WgXcQ` would be stored at: `.../internal_data/dQ/w4/dQw4w9WgXcQ.mp4`.
    *   **Benefit:** This approach distributes the files across many directories, keeping the number of entries in any single directory low, which maintains high performance for file system operations. The database acts as the source of truth, mapping the playlist and video metadata to this internal file path.

---

## Finding 6: Consistent and Sanitized Naming Conventions

**Source(s):** TechTarget, SuiteFiles

**Key Insight:** A consistent and robust file naming convention is crucial for avoiding errors and ensuring cross-platform compatibility.

**Paraphrased Summary:**
While the internal storage will use unique IDs, any user-facing files or folders (like the playlist directories) must have their names sanitized.

*   **Sanitization:** Before creating a directory from a playlist's title (e.g., "80's Rock!! (Awesome Mix)"), the name must be processed to remove or replace characters that are invalid in file systems (`/`, `\`, `:`, `*`, `?`, `"`, `<`, `>`, `|`).
*   **Convention:** The application should enforce a consistent naming convention. For Playlistify, the convention will be that the directory name directly reflects the sanitized playlist title. The database will store the original, unsanitized title for display within the application. This ensures that the file system remains stable while the user experience is preserved.