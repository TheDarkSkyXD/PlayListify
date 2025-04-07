# FFmpeg Tests

This folder contains test scripts for verifying FFmpeg functionality in the application.

## Available Tests

### 1. Unit Tests

This is a Jest test file that verifies the FFmpeg integration with the application. It uses mocks to avoid actual downloads and external dependencies.

```bash
npm test -- tests/ffmpeg/ffmpeg.test.ts
```

### 2. Verify FFmpeg Installation

This script checks if FFmpeg is properly installed and working with yt-dlp.

```bash
npx ts-node tests/ffmpeg/verify-ffmpeg.ts
```

### 3. Test Video Download

This script tests downloading a small video using yt-dlp and FFmpeg.

```bash
npx ts-node tests/ffmpeg/test-download.ts
```

### 4. Test FFmpeg Installation

This script tests the FFmpeg installation process by removing any existing FFmpeg installation and then triggering the automatic installation process. This is useful for verifying that the FFmpeg download and installation works correctly in the development environment.

```bash
npx ts-node tests/ffmpeg/test-ffmpeg-install.ts
```

## What These Tests Verify

1. **FFmpeg Installation**: Checks if FFmpeg is installed either in the system PATH or in the bundled location.
2. **yt-dlp Installation**: Verifies that yt-dlp is installed and accessible.
3. **Integration**: Tests that FFmpeg and yt-dlp work together correctly.
4. **Download Functionality**: Verifies that videos can be downloaded with the correct quality.

## Troubleshooting

If the tests fail, check the following:

1. **FFmpeg Not Found**: The application will try to download FFmpeg automatically when needed. You can also run `npm run install:ffmpeg` to install it manually.
2. **yt-dlp Not Found**: Run `npm run install:ytdlp` to install yt-dlp.
3. **Integration Issues**: If FFmpeg and yt-dlp are installed but not working together, it might be a path issue. Check the logs for details.
4. **Download Failures**: If downloads fail, check your internet connection and make sure the video URL is valid.

## Cleaning Up

The test scripts automatically clean up any temporary files they create. If you need to manually uninstall FFmpeg, you can run:

```bash
npm run uninstall:ffmpeg
```
