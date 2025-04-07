# FFmpeg Test Script

This script tests the FFmpeg download, extraction, and functionality to ensure it's working correctly within the application.

## Usage

Run the script directly using Node.js:

```bash
node scripts/ffmpeg-test.js
```

## What the Test Does

1. **Checks FFmpeg Installation**: Verifies if FFmpeg is already installed either in the system PATH or in the bundled location.
2. **Downloads FFmpeg**: If FFmpeg is not installed, it downloads it from a reliable source.
3. **Creates Test Video**: Generates a simple test video using FFmpeg.
4. **Tests FFmpeg Functionality**: Converts the test video to verify FFmpeg is working correctly.
5. **Tests yt-dlp Integration**: Verifies that FFmpeg works correctly with yt-dlp.
6. **Cleanup**: Removes test files after completion.

## Expected Output

If all tests pass, you should see:

```
✅ TEST RESULTS
==================================================
All tests passed successfully!
FFmpeg is correctly installed and working with yt-dlp.
```

## Troubleshooting

If any test fails, the script will provide detailed error messages to help diagnose the issue.

Common issues:
- Network connectivity problems during download
- Insufficient permissions to write to the FFmpeg directory
- Corrupted download files
- Incompatible FFmpeg version

## Manual Testing

To manually test FFmpeg integration with yt-dlp, you can run:

```bash
# Windows
ytdlp\yt-dlp.exe --ffmpeg-location ffmpeg\ffmpeg.exe --list-formats "https://www.youtube.com/watch?v=jNQXAC9IVRw"

# macOS/Linux
./ytdlp/yt-dlp --ffmpeg-location ./ffmpeg/ffmpeg --list-formats "https://www.youtube.com/watch?v=jNQXAC9IVRw"
```

This should display the available formats for the video without downloading it, confirming that yt-dlp can successfully use FFmpeg.
