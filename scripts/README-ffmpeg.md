# FFmpeg Installation and Uninstallation

This document explains how FFmpeg is installed and uninstalled in the application across different platforms.

## Overview

FFmpeg is bundled with the application similar to yt-dlp. It is automatically installed during the application installation process and removed during uninstallation.

## Windows

### Installation
- FFmpeg is downloaded from `https://github.com/GyanD/codexffmpeg/releases/download/6.0/ffmpeg-6.0-essentials_build.zip`
- The zip file is extracted and the FFmpeg executable is placed in `%APPDATA%\playlistify\resources\ffmpeg\`
- The installation is handled by `scripts\windows-installer\install-events.js`
- You can manually install FFmpeg by running `npm run install:deps`

### Uninstallation
- FFmpeg is removed from `%APPDATA%\playlistify\resources\ffmpeg\`
- The uninstallation is handled by `scripts\windows-installer\uninstall-events.js`
- You can manually uninstall FFmpeg by running `npm run uninstall:deps`

## macOS

### Installation
- FFmpeg is downloaded from `https://evermeet.cx/ffmpeg/getrelease/ffmpeg/zip`
- The zip file is extracted and the FFmpeg executable is placed in `/Applications/playlistify.app/Contents/Resources/ffmpeg/`
- The installation is handled by `scripts\macos-installer\postinstall.sh`
- You can manually install FFmpeg by running `npm run install:deps:mac`

### Uninstallation
- FFmpeg is removed from `/Applications/playlistify.app/Contents/Resources/ffmpeg/`
- The uninstallation is handled by `scripts\macos-installer\preuninstall.sh`
- You can manually uninstall FFmpeg by running `npm run uninstall:deps:mac`

## Linux

### Installation
- FFmpeg is downloaded from `https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz`
- The tar.xz file is extracted and the FFmpeg executable is placed in `/opt/playlistify/resources/ffmpeg/`
- The installation is handled by `scripts\linux-installer\postinst.sh`
- You can manually install FFmpeg by running `npm run install:deps:linux`

### Uninstallation
- FFmpeg is removed from `/opt/playlistify/resources/ffmpeg/`
- The uninstallation is handled by `scripts\linux-installer\prerm.sh`
- You can manually uninstall FFmpeg by running `npm run uninstall:deps:linux`

## Testing

To test the FFmpeg installation and uninstallation process:

1. Run the application installer for your platform
2. Verify that FFmpeg is installed in the correct location
3. Run the application and try to download a video
4. Uninstall the application
5. Verify that FFmpeg is removed from the system

Alternatively, you can manually test the installation and uninstallation scripts:

### Windows
```bash
npm run install:deps   # Install FFmpeg
npm run uninstall:deps # Uninstall FFmpeg
```

### macOS
```bash
npm run install:deps:mac   # Install FFmpeg
npm run uninstall:deps:mac # Uninstall FFmpeg
```

### Linux
```bash
npm run install:deps:linux   # Install FFmpeg
npm run uninstall:deps:linux # Uninstall FFmpeg
```

## Troubleshooting

If FFmpeg is not installed correctly:

1. Check the installation logs for errors
2. Verify that the download URLs are still valid
3. Try manually downloading and installing FFmpeg
4. Check file permissions in the installation directory

If FFmpeg is not uninstalled correctly:

1. Check the uninstallation logs for errors
2. Manually remove the FFmpeg directory if necessary
