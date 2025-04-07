#!/bin/bash
# Post-installation script for deb packages

set -e

APP_NAME="playlistify"
RESOURCES_DIR="/opt/${APP_NAME}/resources"
YTDLP_DIR="${RESOURCES_DIR}/ytdlp"
YTDLP_BIN="${YTDLP_DIR}/yt-dlp"
FFMPEG_DIR="${RESOURCES_DIR}/ffmpeg"
FFMPEG_BIN="${FFMPEG_DIR}/ffmpeg"

# Create ytdlp directory if it doesn't exist
mkdir -p "${YTDLP_DIR}"

# Download the latest yt-dlp binary
echo "Downloading yt-dlp..."
curl -L "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp" -o "${YTDLP_BIN}"

# Make the binary executable
chmod +x "${YTDLP_BIN}"

echo "yt-dlp has been installed successfully"

# Create FFmpeg directory if it doesn't exist
mkdir -p "${FFMPEG_DIR}"

# Download FFmpeg for Linux
echo "Downloading FFmpeg for Linux..."
TEMP_TAR="${FFMPEG_DIR}/ffmpeg-temp.tar.xz"

# Download the latest static build of FFmpeg for Linux
curl -L "https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz" -o "${TEMP_TAR}"

# Create a temporary directory for extraction
TEMP_DIR="${FFMPEG_DIR}/temp"
mkdir -p "${TEMP_DIR}"

# Extract the tar.xz file
echo "Extracting FFmpeg..."
tar -xf "${TEMP_TAR}" -C "${TEMP_DIR}"

# Find the ffmpeg binary in the extracted directory
FIND_FFMPEG=$(find "${TEMP_DIR}" -name "ffmpeg" -type f)

# Copy the ffmpeg binary to the final location
cp "${FIND_FFMPEG}" "${FFMPEG_BIN}"

# Make the binary executable
chmod +x "${FFMPEG_BIN}"

# Clean up the temporary files
rm -f "${TEMP_TAR}"
rm -rf "${TEMP_DIR}"

echo "FFmpeg has been installed successfully"

# Exit with success
exit 0