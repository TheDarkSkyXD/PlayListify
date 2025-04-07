#!/bin/bash
# Post-installation script for macOS packages

set -e

APP_NAME="playlistify"
# macOS applications are located in /Applications
APP_PATH="/Applications/${APP_NAME}.app"
RESOURCES_DIR="${APP_PATH}/Contents/Resources"
YTDLP_DIR="${RESOURCES_DIR}/ytdlp"
YTDLP_BIN="${YTDLP_DIR}/yt-dlp"
FFMPEG_DIR="${RESOURCES_DIR}/ffmpeg"
FFMPEG_BIN="${FFMPEG_DIR}/ffmpeg"

# Create ytdlp directory if it doesn't exist
mkdir -p "${YTDLP_DIR}"

# Download the latest yt-dlp binary for macOS
echo "Downloading yt-dlp for macOS..."
curl -L "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos" -o "${YTDLP_BIN}"

# Make the binary executable
chmod +x "${YTDLP_BIN}"

echo "yt-dlp has been installed successfully on macOS"

# Create FFmpeg directory if it doesn't exist
mkdir -p "${FFMPEG_DIR}"

# Download FFmpeg for macOS
echo "Downloading FFmpeg for macOS..."
TEMP_ZIP="${FFMPEG_DIR}/ffmpeg-temp.zip"

# Download the latest static build of FFmpeg for macOS
curl -L "https://evermeet.cx/ffmpeg/getrelease/ffmpeg/zip" -o "${TEMP_ZIP}"

# Extract the zip file
echo "Extracting FFmpeg..."
unzip -o "${TEMP_ZIP}" -d "${FFMPEG_DIR}"

# Make the binary executable
chmod +x "${FFMPEG_BIN}"

# Clean up the temporary zip file
rm -f "${TEMP_ZIP}"

echo "FFmpeg has been installed successfully on macOS"

# Exit with success
exit 0