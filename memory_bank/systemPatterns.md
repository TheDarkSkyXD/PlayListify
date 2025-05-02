# System Patterns

This document outlines the key architectural patterns used in the PlayListify application.

## 1. Main-Renderer Communication Pattern

We're using Electron's contextBridge API for secure IPC communication between the main and renderer processes:

```typescript
// In preload.ts
contextBridge.exposeInMainWorld('electron', {
  ping: () => ipcRenderer.invoke('ping'),
  // Add more API methods here
});

// In renderer
const result = await window.electron.ping();
```

## 2. Error Handling Pattern

We use a consistent error handling pattern throughout the application:

```typescript
try {
  // Operation
} catch (error) {
  logger.error('Operation failed:', error);
  throw new AppError('OPERATION_FAILED', 'Operation failed: ' + error.message);
}
```

## 3. Database Operation Pattern

For database operations, we follow a consistent pattern with proper transaction handling and error management:

```typescript
export const someDatabaseOperation = async (
  db: Database,
  ...params
): Promise<ResultType> => {
  try {
    // For operations that affect multiple records, use transactions
    if (needsTransaction) {
      await db.exec('BEGIN TRANSACTION');
      
      try {
        // Perform database operations
        
        // Commit if successful
        await db.exec('COMMIT');
      } catch (error) {
        // Rollback on error
        await db.exec('ROLLBACK');
        throw error;
      }
    } else {
      // Simple operation without transaction
    }
    
    // Return result
    logger.info('Operation completed successfully');
    return result;
  } catch (error) {
    logger.error('Database operation failed:', error);
    throw error;
  }
};
```

## 4. Data Access Pattern

We use a data access layer that separates the database implementation details from the business logic:

```typescript
// Database implementation in src/main/database/
// Service layer in src/main/services/
// IPC handlers in src/main/ipc/

// Example flow:
// 1. IPC request comes in through ipcHandlers
// 2. Handler calls service function
// 3. Service function calls database query
// 4. Result flows back up the chain
```

## 5. Repository Pattern for Database Access

Our database access follows the repository pattern, with dedicated modules for each entity type:

```typescript
// playlistQueries.ts - Repository for playlist operations
export const getAllPlaylists = async (db: Database): Promise<PlaylistSummary[]> => {
  // Implementation
};

// videoQueries.ts - Repository for video operations
export const getVideoById = async (db: Database, id: number): Promise<Video | null> => {
  // Implementation
};
```

## 6. Singleton Pattern for Database Connection

We use a singleton pattern for database connections to ensure we only have one connection throughout the application:

```typitten
// Singleton implementation
export const getDatabase = (() => {
  let db: Database | null = null;
  
  return async (): Promise<Database> => {
    if (!db) {
      db = await initDatabase();
    }
    return db;
  };
})();
```

## 7. Adapter Pattern for Database Compatibility

We use the adapter pattern to provide a compatible interface between sqlite3 and better-sqlite3:

```typescript
// sqlite-adapter.ts implements the Database interface that matches better-sqlite3's API
// This allows us to switch implementations without changing consumer code
class Database {
  // Methods that mimic better-sqlite3 API but use sqlite3 internally
}
```

## 8. Migration System Pattern

We use a simple migration system for database schema updates:

```typescript
const runMigrations = async (db: Database, fromVersion: number, toVersion: number): Promise<void> => {
  // For each version step, apply the necessary changes
  // Update version number when complete
};
```

## 9. State Management Pattern

For frontend state management, we use Zustand stores:

```typescript
// store/playlistStore.ts
export const usePlaylistStore = create<PlaylistStore>((set) => ({
  playlists: [],
  currentPlaylist: null,
  setPlaylists: (playlists) => set({ playlists }),
  setCurrentPlaylist: (playlist) => set({ currentPlaylist: playlist }),
}));
```

## 10. React Query Pattern

For data fetching and caching, we use React Query:

```typescript
// hooks/usePlaylistQueries.ts
export const useGetAllPlaylists = () => {
  return useQuery<PlaylistSummary[], Error>(
    ['playlists'],
    async () => {
      const result = await window.electron.getAllPlaylists();
      return result;
    }
  );
};
```

These patterns provide a consistent structure to the PlayListify application and help ensure code quality and maintainability.

## Architecture Patterns

### Frontend Architecture
- **Framework**: React.js with TypeScript
- **State Management**: Redux for global state, React Context for component-level state
- **Styling**: Styled Components with a design system
- **Routing**: React Router for navigation
- **Form Management**: Formik with Yup validation

### Backend Architecture
- **API Style**: RESTful API with Express.js
- **Authentication**: JWT-based authentication
- **Database**: MongoDB for user data and playlist metadata
- **Caching**: Redis for API response caching
- **External APIs**: Integration with music streaming services via their official APIs

## Code Patterns

### Component Structure
```
/components
  /common         # Reusable UI components
  /layout         # Layout components
  /features       # Feature-specific components
    /playlist
    /user
    /search
  /pages          # Page components
```

### Naming Conventions
- **Components**: PascalCase (e.g., PlaylistCard)
- **Functions**: camelCase (e.g., fetchPlaylistData)
- **Constants**: UPPER_SNAKE_CASE (e.g., API_ENDPOINTS)
- **Files**: Component files match their component name (e.g., PlaylistCard.tsx)

### State Management Pattern
- Use Redux for:
  - User authentication state
  - Global application state
  - Shared data between unrelated components
- Use React Context for:
  - Theme/UI preferences
  - Feature-specific state (localized to a feature)
- Use local state for:
  - Component-specific state
  - Temporary UI state

### API Integration Pattern
- Service layer abstracts API calls
- Consistent error handling through middleware
- Response normalization for consistent data structure

### Testing Strategy
- **Unit Tests**: Jest for individual components and utilities
- **Integration Tests**: React Testing Library for component integration
- **E2E Tests**: Cypress for critical user flows

## Folder Structure
```
/src
  /assets         # Static assets
  /components     # UI components
  /hooks          # Custom React hooks
  /pages          # Page components
  /services       # API services
  /store          # Redux store
  /types          # TypeScript types and interfaces
  /utils          # Utility functions
```

*This document serves as a reference for maintaining consistent code patterns and architecture decisions.* 