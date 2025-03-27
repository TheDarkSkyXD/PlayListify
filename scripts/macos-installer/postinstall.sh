#!/bin/bash
# Post-installation script for macOS packages

set -e

APP_NAME="playlistify"
# macOS applications are located in /Applications
APP_PATH="/Applications/${APP_NAME}.app"
RESOURCES_DIR="${APP_PATH}/Contents/Resources"
YTDLP_DIR="${RESOURCES_DIR}/ytdlp"
YTDLP_BIN="${YTDLP_DIR}/yt-dlp"

# Create ytdlp directory if it doesn't exist
mkdir -p "${YTDLP_DIR}"

# Download the latest yt-dlp binary for macOS
echo "Downloading yt-dlp for macOS..."
curl -L "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos" -o "${YTDLP_BIN}"

# Make the binary executable
chmod +x "${YTDLP_BIN}"

echo "yt-dlp has been installed successfully on macOS"

# Exit with success
exit 0 