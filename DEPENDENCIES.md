# PlayListify Dependency Management

PlayListify requires two key dependencies to function correctly:

1. **yt-dlp**: Used for downloading YouTube videos and playlists
2. **FFmpeg**: Used for video processing and format conversion

## Local Project Dependencies

Unlike typical applications that require system-wide installation of these dependencies, PlayListify includes a dependency management system that **downloads and manages these tools locally within the project directory**. This provides several benefits:

- No need for users to install anything manually
- Consistent versions across all platforms
- No conflicts with existing system installations
- Dependencies are removed when the app is uninstalled

## Directory Structure

The dependencies are stored in dedicated directories within the project:

```
PlayListify/
├── ytdlp/
│   └── bin/
│       └── yt-dlp (or yt-dlp.exe on Windows)
│
├── ffmpeg/
│   └── bin/
│       ├── ffmpeg (or ffmpeg.exe on Windows)
│       ├── ffprobe (or ffprobe.exe on Windows)
│       └── ffplay (or ffplay.exe on Windows)
```

## Setup Scripts

The application includes platform-specific automated setup scripts that handle downloading and installing these dependencies:

### OS-Specific Scripts

Each platform has dedicated installation and uninstallation scripts:

```
scripts/
├── windows/
│   ├── install.js - Windows-specific installation 
│   └── uninstall.js - Windows-specific uninstallation
├── macos/
│   ├── install.js - macOS-specific installation
│   └── uninstall.js - macOS-specific uninstallation
└── linux/
    ├── install.js - Linux-specific installation
    └── uninstall.js - Linux-specific uninstallation
```

### For Developers

You can manually run these scripts during development:

```bash
# Install dependencies automatically for current platform
npm run setup:deps

# Platform-specific installation
npm run setup:windows  # Windows only
npm run setup:macos    # macOS only
npm run setup:linux    # Linux only

# Uninstall dependencies for current platform
npm run uninstall:deps

# Platform-specific uninstallation
npm run uninstall:windows  # Windows only
npm run uninstall:macos    # macOS only
npm run uninstall:linux    # Linux only
```

### For Users

Users don't need to run these scripts manually. When the application starts for the first time via `npm start` or when running the packaged application, the startup script will automatically check for and install the required dependencies.

## Platform Support

The dependency management system supports all major platforms and architectures:

- **Windows**: Downloads and installs x86/x64 binaries
- **macOS**: Downloads and installs x64/ARM64 binaries
- **Linux**: Downloads and installs x64/x86/ARM64/ARM binaries

## Uninstallation

When uninstalling the application, the uninstall script will remove all downloaded dependencies:

```bash
npm run uninstall:deps
```

This script will:
1. Detect your platform and run the appropriate uninstaller
2. Remove the yt-dlp directory
3. Remove the FFmpeg directory
4. Optionally remove application data (with user confirmation)

## Troubleshooting

If you encounter issues with the dependencies:

1. Try running the setup scripts manually:
   ```bash
   npm run setup:deps
   ```

2. Check that the binaries are executable (on Unix-based systems):
   ```bash
   chmod +x ytdlp/bin/yt-dlp
   chmod +x ffmpeg/bin/ffmpeg
   chmod +x ffmpeg/bin/ffprobe
   ```

3. Verify that the binaries are in the correct location by checking the project directory structure

4. For SQLite issues on Windows, the application includes a fix script:
   ```bash
   node fix-sqlite-path.js
   ``` 