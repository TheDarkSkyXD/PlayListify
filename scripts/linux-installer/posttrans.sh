#!/bin/bash
# Post-transaction script for RPM packages

set -e

APP_NAME="playlistify"
RESOURCES_DIR="/opt/${APP_NAME}/resources"
YTDLP_DIR="${RESOURCES_DIR}/ytdlp"
YTDLP_BIN="${YTDLP_DIR}/yt-dlp"

# Create ytdlp directory if it doesn't exist
mkdir -p "${YTDLP_DIR}"

# Download the latest yt-dlp binary
echo "Downloading yt-dlp..."
curl -L "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp" -o "${YTDLP_BIN}"

# Make the binary executable
chmod +x "${YTDLP_BIN}"

echo "yt-dlp has been installed successfully"

# Exit with success
exit 0 