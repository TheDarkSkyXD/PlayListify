### **API Reference**

### **External APIs Consumed**

The application does not directly consume a traditional REST/HTTP API for YouTube. Instead, it interacts with YouTube's services through a command-line wrapper.

#### **yt-dlp-wrap**

* **Purpose:** To fetch all playlist/video metadata, list available download formats, and retrieve media streams from YouTube without requiring a direct API key. This wrapper will be invoked by our `backend/lib/` wrappers.
* **Authentication:** Not applicable (uses public-facing data).
* **Key "Endpoints" (Commands):**
    * `yt-dlp --dump-json [URL]`: Used by the Playlist Service to get all available metadata for a given playlist or video URL.
    * `yt-dlp --list-formats [URL]`: Used by the Download Service to get all available video/audio quality formats before starting a download.
    * `yt-dlp --get-status [URL]`: Used by the Health Check service to verify video availability (`Live`, `Deleted`, `Private`).
    * `yt-dlp -f [format] -o [output_path] [URL]`: Used by the Download Service to download the actual video/audio stream to the user's filesystem.

### **Internal APIs Provided**

This is the contract for the Inter-Process Communication (IPC) between our `frontend` and `backend`. The frontend sends a message on a specific channel, and the backend listens and responds.

#### **Playlistify IPC API**

* **Purpose:** To allow the sandboxed `frontend` to securely request data and trigger actions on the `backend`.
* **Authentication/Authorization:** Not applicable. The security model is the Electron process sandbox.
* **Endpoints (IPC Channels):**
    * **Request/Response Channels (Frontend invokes, Backend responds):**
        * `playlist:get-preview` (Args: `url: string`): Fetches preview metadata for a given YouTube URL.
        * `playlist:import` (Args: `url: string`): Starts the background task to import a full public playlist.
        * `playlist:create-custom` (Args: `{title: string, description: string}`): Creates a new custom playlist.
        * `download:get-quality-options` (Args: `url: string`): Gets available download quality options for a video.
        * `download:start` (Args: `DownloadOptions`): Initiates a download task for a single video or a full playlist.
        * `task:cancel` (Args: `taskId: string`): Requests cancellation of an active background task.
        * `healthcheck:start-manual` (Args: `playlistId: string`): Manually triggers a health check for a specific playlist.
    * **Push Channels (Backend sends, Frontend listens):**
        * `task:update` (Data: `Task[]`): The backend will periodically push the full list of active tasks to the frontend to update the Activity Center UI in real-time.