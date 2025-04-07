# Manual Quality Tests

These tests help verify that the video quality selection functionality is working correctly.

## Available Tests

1. **quality-test.ts** - Tests downloading a single video at 1080p quality
2. **playlist-quality-test.ts** - Tests downloading a video from a playlist at 1080p quality
3. **quality-comparison-test.ts** - Tests downloading a high-quality video at different quality settings (1080p, 2160p, 4320p, and best)

## Running the Tests

These are manual tests that can be run using ts-node:

```bash
# Test downloading a single video at 1080p quality
npx ts-node tests/manual/quality-test.ts

# Test downloading a video from a playlist at 1080p quality
npx ts-node tests/manual/playlist-quality-test.ts

# Test downloading a video at different quality settings
npx ts-node tests/manual/quality-comparison-test.ts
```

## Automated Tests

We also have automated unit tests for the quality selection functionality that can be run with Jest:

```bash
npm test -- tests/backend/services/ytDlp/quality-selection.test.ts
```

## What These Tests Verify

These tests verify that:

1. Videos can be downloaded successfully with the specified quality settings
2. The download process completes without errors
3. The downloaded files exist and have a non-zero size

## Test Output

The test output will show:

1. The requested quality
2. The download progress and completion status
3. The file size
4. Whether the test passed or failed (based on whether any errors occurred)

## Requirements

- ffprobe must be installed and available in your PATH to analyze video resolutions
- Internet connection to download videos from YouTube
- Sufficient disk space for downloaded videos

## Notes

- These tests download actual videos from YouTube, so they may take some time to complete depending on your internet connection
- The downloaded videos are saved to temporary directories so you can inspect them manually if needed
- The tests do not automatically clean up the downloaded videos, so you may want to delete them manually after inspection
