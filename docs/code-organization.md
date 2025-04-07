# Code Organization

This document describes the code organization principles used in the PlayListify application.

## File Size Limits

To maintain code readability and maintainability, we follow these guidelines:

- **Backend code files**: Limited to 500 lines maximum
- **Frontend code files**: Limited to 500 lines maximum

When a file exceeds these limits, it should be split into multiple smaller files organized in dedicated folders.

## Modular Structure

Large components and services are organized in a modular structure:

### Services

Services are organized in dedicated folders with the following structure:

```
services/
  └── serviceName/
      ├── index.ts        # Main export file
      ├── moduleA.ts      # Specific functionality module
      ├── moduleB.ts      # Specific functionality module
      └── ...
```

Example: `playlistService` is organized as follows:

```
services/
  └── playlistService/
      ├── index.ts        # Main export file
      ├── crud.ts         # CRUD operations
      ├── import.ts       # Import functionality
      ├── videos.ts       # Video-related operations
      └── download.ts     # Download functionality
```

### Components

Complex UI components are organized in dedicated folders with the following structure:

```
components/
  └── ComponentName/
      ├── index.tsx       # Main export file
      ├── types.ts        # Shared types and interfaces
      ├── useHook.ts      # Custom hooks
      ├── SubComponent.tsx # Smaller component
      └── ...
```

Example: `VideoPlayer` is organized as follows:

```
components/
  └── VideoPlayer/
      ├── index.tsx              # Main export file
      ├── types.ts               # Shared types and interfaces
      ├── useVideoPlayer.ts      # Custom hook for state management
      ├── VideoPlayerControls.tsx # Controls component
      ├── VideoPlayerYouTube.tsx  # YouTube-specific implementation
      ├── VideoPlayerLocal.tsx    # Local video implementation
      ├── VideoPlayerError.tsx    # Error display component
      └── VideoPlayerLoading.tsx  # Loading state component
```

## Backward Compatibility

To maintain backward compatibility, the original file is kept but modified to re-export from the new modular structure:

```typescript
/**
 * This file is kept for backward compatibility.
 * It re-exports the component from the new modular structure.
 */

import Component from './ComponentName';

export default Component;
```

## Testing

Each module should have its own test file that verifies its functionality. Tests should be organized in a structure that mirrors the source code:

```
tests/
  └── frontend/
      └── features/
          └── ComponentName/
              ├── index.test.tsx
              ├── SubComponent.test.tsx
              └── ...
```

## Benefits of This Structure

1. **Improved Code Organization**: Each file has a clear, focused responsibility.
2. **Better Maintainability**: Smaller files are easier to understand and modify.
3. **Enhanced Collaboration**: Multiple developers can work on different aspects of the service without conflicts.
4. **Easier Testing**: Each module can be tested independently.
5. **Better Code Navigation**: It's easier to find specific functionality.
6. **Reduced Cognitive Load**: Developers can focus on one aspect of the component at a time.
7. **Improved Reusability**: Smaller components can be reused in other parts of the application.
