# Arc 2: Primary Findings - `yt-dlp` Command-Line Strategy

## Finding 1: Recommended Baseline Command for Data Extraction and Downloading

**Source(s):** arapidseedbox.com, ostechnix.com, GitHub (yt-dlp), Reddit (r/DataHoarder)

**Key Insight:** A standard set of command-line arguments for `yt-dlp` can reliably download a video, save its metadata to external files, and embed critical information directly into the final media file.

**Paraphrased Summary:**
For the Playlistify application, two distinct `yt-dlp` operations will be required: one for fetching metadata only, and one for the actual download process.

**1. Metadata-Only Fetch (`--dump-json`):**
To quickly retrieve all available information about a video or playlist without downloading it, the following command is optimal:

```bash
yt-dlp --dump-json --no-warnings "VIDEO_URL_HERE"
```

*   `--dump-json`: This command tells `yt-dlp` to parse the page and output all extracted information as a single JSON object to standard output. It does not download the video. This is extremely efficient for populating the application's database before a download is initiated.
*   `--no-warnings`: Suppresses warnings that are not critical to the operation's success.

**2. Download and Embed Command:**
When a user initiates a download, a more comprehensive command is required to download the video, embed relevant metadata, and ensure maximum compatibility.

```bash
yt-dlp \
  -f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best" \
  --merge-output-format mp4 \
  --write-thumbnail --embed-thumbnail \
  --embed-metadata \
  --no-warnings \
  -o "OUTPUT_PATH_TEMPLATE" \
  "VIDEO_URL_HERE"
```

*   `-f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best"`: This is a robust format selector. It tells `yt-dlp` to:
    1.  **Try first:** Get the best quality video-only MP4 stream and the best quality audio-only M4A stream and merge them.
    2.  **If that fails, try:** Get the best quality pre-merged file that is already in MP4 format.
    3.  **As a last resort:** Get the best quality file available in any format.
*   `--merge-output-format mp4`: Ensures that if a merge happens, the final container is an MP4 file.
*   `--write-thumbnail`: Saves the thumbnail image to a separate file on disk. This is useful for displaying in the UI before the download is complete.
*   `--embed-thumbnail`: Embeds the downloaded thumbnail into the final video file. This makes the file more portable. **Note:** This requires `mutagen` or `AtomicParsley` to be available in the application's environment.
*   `--embed-metadata`: Embeds a wide range of metadata (title, author, date, description, etc.) into the video file.
*   `-o "OUTPUT_PATH_TEMPLATE"`: Defines the output filename and location. The application will use its hashed directory structure here (e.g., `-o "data/d7/f5/d7f5ae9b7c5a.mp4"`).

This command structure provides a reliable and feature-rich foundation for the application's download functionality.