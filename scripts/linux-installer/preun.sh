#!/bin/bash
# Pre-uninstall script for RPM packages

set -e

APP_NAME="playlistify"
RESOURCES_DIR="/opt/${APP_NAME}/resources"
YTDLP_DIR="${RESOURCES_DIR}/ytdlp"
YTDLP_BIN="${YTDLP_DIR}/yt-dlp"

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

echo "yt-dlp has been removed successfully"

# Exit with success
exit 0 