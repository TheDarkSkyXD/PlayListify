#!/bin/bash
# Pre-uninstallation script for macOS packages

set -e

APP_NAME="playlistify"
# macOS applications are located in /Applications
APP_PATH="/Applications/${APP_NAME}.app"
RESOURCES_DIR="${APP_PATH}/Contents/Resources"
YTDLP_DIR="${RESOURCES_DIR}/ytdlp"
YTDLP_BIN="${YTDLP_DIR}/yt-dlp"
FFMPEG_DIR="${RESOURCES_DIR}/ffmpeg"
FFMPEG_BIN="${FFMPEG_DIR}/ffmpeg"

# Check if yt-dlp binary exists and remove it
if [ -f "${YTDLP_BIN}" ]; then
    echo "Removing yt-dlp binary..."
    rm -f "${YTDLP_BIN}"
fi

# Check if yt-dlp directory exists and remove it
if [ -d "${YTDLP_DIR}" ]; then
    echo "Removing yt-dlp directory..."
    rm -rf "${YTDLP_DIR}"
fi

echo "yt-dlp has been removed successfully from macOS"

# Check if FFmpeg binary exists and remove it
if [ -f "${FFMPEG_BIN}" ]; then
    echo "Removing FFmpeg binary..."
    rm -f "${FFMPEG_BIN}"
fi

# Check if FFmpeg directory exists and remove it
if [ -d "${FFMPEG_DIR}" ]; then
    echo "Removing FFmpeg directory..."
    rm -rf "${FFMPEG_DIR}"
fi

echo "FFmpeg has been removed successfully from macOS"

# Exit with success
exit 0