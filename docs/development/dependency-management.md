# Dependency Management System

The Dependency Management System handles the installation, validation, and management of external dependencies required by Playlistify, specifically yt-dlp and FFmpeg.

## Overview

The system provides:
- Automatic detection of missing dependencies
- Cross-platform installation support (Windows, macOS, Linux)
- Version checking and validation
- Progress tracking during installation
- Secure IPC communication between main and renderer processes
- Comprehensive error handling and recovery

## Architecture

### Core Components

1. **DependencyManagerService** (`src/backend/services/dependency-manager-service.ts`)
   - Main service class that manages all dependency operations
   - Handles installation, validation, and cleanup
   - Emits events for status updates and progress tracking

2. **Dependency Handlers** (`src/backend/handlers/dependency-handlers.ts`)
   - IPC handlers that expose dependency operations to the renderer process
   - Provides secure communication bridge
   - Forwards events from the service to renderer processes

3. **Platform Configuration** (`src/backend/config/dependency-config.ts`)
   - Platform-specific download URLs and file information
   - Directory structure management
   - Executable path resolution

4. **Utility Functions** (`src/backend/utils/dependency-utils.ts`)
   - File download with progress tracking
   - Archive extraction (ZIP, TAR)
   - Binary validation and version checking
   - Cleanup and error handling utilities

### Supported Dependencies

#### yt-dlp
- **Purpose**: YouTube video/playlist metadata extraction and downloading
- **Platforms**: Windows (.exe), macOS (binary), Linux (binary)
- **Installation**: Direct executable download

#### FFmpeg
- **Purpose**: Video/audio processing and conversion
- **Platforms**: Windows (ZIP archive), macOS (ZIP archive), Linux (TAR archive)
- **Installation**: Archive extraction with executable location

## Usage

### From Renderer Process

```typescript
// Check dependency status
const status = await window.api.dependency.checkStatus();
console.log('yt-dlp installed:', status.ytdlp.installed);
console.log('FFmpeg installed:', status.ffmpeg.installed);

// Install a dependency
try {
  await window.api.dependency.install('ytdlp');
  console.log('yt-dlp installed successfully');
} catch (error) {
  console.error('Installation failed:', error);
}

// Listen for installation progress
window.api.dependency.onDownloadProgress((event, progress) => {
  console.log(`${progress.dependency}: ${progress.progress}% - ${progress.status}`);
});

// Validate a dependency
const isValid = await window.api.dependency.validate('ffmpeg');
console.log('FFmpeg is valid:', isValid);

// Get dependency version
const version = await window.api.dependency.getVersion('ytdlp');
console.log('yt-dlp version:', version);
```

### From Main Process

```typescript
import { getDependencyManager } from './backend/handlers/dependency-handlers';

const dependencyManager = getDependencyManager();

if (dependencyManager) {
  // Check if all dependencies are ready
  const allReady = dependencyManager.areAllDependenciesReady();
  
  // Get current status
  const status = dependencyManager.getDependencyStatus();
  
  // Listen for events
  dependencyManager.on('installCompleted', (dependency) => {
    console.log(`${dependency} installation completed`);
  });
}
```

## Events

The dependency manager emits the following events:

- `statusUpdated`: Dependency status has changed
- `downloadProgress`: Download progress update
- `installStarted`: Installation has started for a dependency
- `installCompleted`: Installation completed successfully
- `installFailed`: Installation failed with error
- `dependenciesCleanedUp`: All dependencies have been cleaned up

## Error Handling

The system includes comprehensive error handling:

- **DependencyError**: General dependency management errors
- **DependencyInstallationError**: Installation-specific errors
- **DependencyValidationError**: Validation failures
- **DependencyDownloadError**: Download failures

All errors include descriptive messages and are properly propagated through the IPC layer.

## File Structure

```
src/
├── backend/
│   ├── config/
│   │   └── dependency-config.ts          # Platform-specific configuration
│   ├── handlers/
│   │   └── dependency-handlers.ts        # IPC handlers
│   ├── services/
│   │   └── dependency-manager-service.ts # Main service class
│   └── utils/
│       └── dependency-utils.ts           # Utility functions
├── shared/
│   ├── errors.ts                         # Error classes
│   ├── interfaces/
│   │   └── dependency-manager.ts         # TypeScript interfaces
│   └── types.ts                          # IPC type definitions
└── preload.ts                            # Renderer API exposure
```

## Testing

The system includes comprehensive unit and integration tests:

- **Unit Tests**: `tests/unit/dependency-manager.test.ts`
  - Tests all service methods and error conditions
  - Mocks external dependencies for isolated testing
  
- **Integration Tests**: `tests/integration/dependency-handlers.test.ts`
  - Tests IPC communication and event handling
  - Verifies proper integration between components

Run tests with:
```bash
npm test -- tests/unit/dependency-manager.test.ts
npm test -- tests/integration/dependency-handlers.test.ts
```

## Security Considerations

- All IPC communication is secured through context isolation
- File downloads are validated for accessibility before starting
- Archive extraction is performed in temporary directories
- Binary validation ensures executables are functional before use
- Path traversal protection in file operations

## Platform Support

| Platform | yt-dlp | FFmpeg | Notes |
|----------|--------|--------|-------|
| Windows  | ✅     | ✅     | Direct .exe and ZIP archive |
| macOS    | ✅     | ✅     | Binary and ZIP archive |
| Linux    | ✅     | ✅     | Binary and TAR archive |

## Troubleshooting

### Common Issues

1. **Download Failures**
   - Check internet connectivity
   - Verify download URLs are accessible
   - Check for firewall/proxy restrictions

2. **Installation Failures**
   - Ensure sufficient disk space
   - Check file permissions
   - Verify platform compatibility

3. **Validation Failures**
   - Check if binary is corrupted
   - Verify executable permissions (Unix-like systems)
   - Ensure all required system libraries are available

### Debug Mode

Enable debug logging by setting `NODE_ENV=development` to see detailed logs of dependency operations.