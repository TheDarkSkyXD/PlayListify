# UI State Management with Zustand

This directory contains the complete UI state management system for the Playlistify application,
built with Zustand and designed to handle complex playlist management workflows.

## Architecture Overview

The state management system is organized into four main stores:

1. **App UI Store** (`useAppUIStore`) - Global application UI state
2. **Modal Store** (`useModalStore`) - Modal and dialog management
3. **Playlist UI Store** (`usePlaylistUIStore`) - Playlist-specific UI state
4. **Playlist Store** (`usePlaylistStore`) - Playlist operations and notifications

## Core Stores

### App UI Store (`useAppUIStore`)

Manages global application state including theme, language, layout preferences, and system status.

```typescript
import { useAppUIStore } from './stores';

const MyComponent = () => {
  const { theme, setTheme, isLoading, setLoading } = useAppUIStore();

  return (
    <div className={theme === 'dark' ? 'dark' : 'light'}>
      {isLoading && <LoadingSpinner />}
      <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
        Toggle Theme
      </button>
    </div>
  );
};
```

**Key Features:**

- Theme management (light/dark/system)
- Language and localization
- Layout preferences (sidebar width, header height)
- Accessibility settings
- Performance settings
- Window state tracking
- Feature flags

### Modal Store (`useModalStore`)

Handles all modal and dialog interactions with support for modal stacking and keyboard shortcuts.

```typescript
import { useModalStore } from './stores';

const PlaylistActions = () => {
  const { showCreatePlaylistModal, showConfirmDialog } = useModalStore();

  const handleDelete = () => {
    showConfirmDialog({
      title: 'Delete Playlist',
      message: 'Are you sure?',
      variant: 'danger',
      onConfirm: () => {
        // Delete logic
      }
    });
  };

  return (
    <div>
      <button onClick={() => showCreatePlaylistModal()}>
        Create Playlist
      </button>
      <button onClick={handleDelete}>
        Delete Playlist
      </button>
    </div>
  );
};
```

**Key Features:**

- Modal stacking support
- Type-safe modal data
- Keyboard shortcuts (ESC to close)
- Body scroll locking
- Persistent and closable modals
- Loading states for modal operations

### Playlist UI Store (`usePlaylistUIStore`)

Manages playlist-specific UI state including view modes, filters, sorting, and selection.

```typescript
import { usePlaylistUIStore } from './stores';

const PlaylistGrid = () => {
  const {
    viewMode,
    setViewMode,
    filters,
    setSearch,
    selection,
    selectPlaylist,
    sortBy,
    setSorting
  } = usePlaylistUIStore();

  return (
    <div>
      <input
        value={filters.search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search playlists..."
      />
      <select value={sortBy} onChange={(e) => setSorting(e.target.value)}>
        <option value="name">Name</option>
        <option value="created_at">Created</option>
        <option value="updated_at">Updated</option>
      </select>
      <button onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}>
        Toggle View
      </button>
    </div>
  );
};
```

**Key Features:**

- View mode switching (grid/list/compact)
- Advanced filtering and search
- Multi-select with keyboard support
- Sorting and pagination
- Recently viewed tracking
- Saved filter presets

### Playlist Store (`usePlaylistStore`)

Handles playlist operations, notifications, clipboard, and undo/redo functionality.

```typescript
import { usePlaylistStore, useNotificationManager } from './stores';

const PlaylistOperations = () => {
  const { startOperation, completeOperation, addToHistory } = usePlaylistStore();
  const { showSuccess, showError } = useNotificationManager();

  const createPlaylist = async (data) => {
    const operationId = startOperation('create');

    try {
      // Perform operation
      await api.createPlaylist(data);

      completeOperation(operationId, true);
      addToHistory('CREATE_PLAYLIST', data);
      showSuccess('Success', 'Playlist created!');
    } catch (error) {
      completeOperation(operationId, false, error.message);
      showError('Error', 'Failed to create playlist');
    }
  };

  return <button onClick={() => createPlaylist(data)}>Create</button>;
};
```

**Key Features:**

- Operation tracking with progress
- Import/export state management
- Notification system
- Clipboard operations
- Undo/redo functionality
- Keyboard shortcuts

## Integration and Coordination

### Store Integration Hook

The `useStoreIntegration` hook provides coordinated access to all stores and handles cross-store
interactions:

```typescript
import { useStoreIntegration } from './stores';

const PlaylistManager = () => {
  const { actions, computed } = useStoreIntegration();

  const handleCreatePlaylist = async (data) => {
    const success = await actions.createPlaylistWithUI(data);
    if (success) {
      // Playlist created with full UI coordination
    }
  };

  return (
    <div>
      <p>Selected: {computed.selectedCount} playlists</p>
      <p>Can undo: {computed.canUndo ? 'Yes' : 'No'}</p>
      <button
        onClick={() => handleCreatePlaylist({ title: 'New Playlist', type: 'custom' })}
        disabled={computed.isAnyOperationActive}
      >
        Create Playlist
      </button>
    </div>
  );
};
```

### Store Provider

Wrap your app with the `StoreProvider` to initialize all store side effects:

```typescript
import { StoreProvider } from './stores';

const App = () => {
  return (
    <StoreProvider>
      <YourAppComponents />
    </StoreProvider>
  );
};
```

## Persistence

Stores automatically persist relevant state to localStorage:

- **App UI Store**: Theme, language, layout preferences, feature flags
- **Playlist UI Store**: View preferences, saved filters, search history
- **Playlist Store**: Keyboard shortcuts, recent imports

Transient state (selections, notifications, operations) is not persisted.

## Performance Optimizations

### Selector Hooks

Use specific selector hooks for better performance:

```typescript
// Instead of this (re-renders on any store change)
const store = usePlaylistUIStore();

// Use this (only re-renders when viewMode changes)
const viewMode = usePlaylistViewMode();
```

### Computed Values

Access computed values through the integration hook:

```typescript
const { computed } = useStoreIntegration();
// computed.selectedCount, computed.hasActiveFilters, etc.
```

## Testing

The system includes comprehensive testing utilities:

```typescript
import { createTestStore, testStoreAction } from './stores/store-test-utils';

describe('Playlist Store', () => {
  it('should create playlist', async () => {
    const store = createTestStore(usePlaylistStore);

    await testStoreAction(
      store,
      () => store.getState().startOperation('create'),
      (prev, next) => next.operations.length > prev.operations.length,
    );
  });
});
```

## Keyboard Shortcuts

Global shortcuts are handled automatically:

- `Ctrl/Cmd + N`: New playlist
- `Ctrl/Cmd + I`: Import playlist
- `Ctrl/Cmd + A`: Select all
- `Delete`: Delete selected
- `F2`: Rename selected
- `Escape`: Clear selection
- `Ctrl/Cmd + Z`: Undo
- `Ctrl/Cmd + Shift + Z`: Redo

## Error Handling

All stores include comprehensive error handling:

```typescript
// Errors are automatically caught and displayed as notifications
const { showError } = useNotificationManager();

try {
  await riskyOperation();
} catch (error) {
  showError('Operation Failed', error.message);
}
```

## Best Practices

1. **Use Integration Hook**: For complex operations that involve multiple stores
2. **Specific Selectors**: Use specific selector hooks to minimize re-renders
3. **Batch Updates**: Use the integration hook's coordinated actions for related updates
4. **Error Boundaries**: Wrap components in error boundaries for store errors
5. **Testing**: Use the provided test utilities for comprehensive store testing

## Migration Guide

If migrating from other state management solutions:

1. Replace Redux actions with Zustand store methods
2. Convert selectors to Zustand selector hooks
3. Move side effects to the StoreProvider
4. Update tests to use the provided test utilities

## Debugging

Use the debug hook for development:

```typescript
import { useStoreDebugInfo } from './stores';

const DebugPanel = () => {
  const storeState = useStoreDebugInfo();

  return (
    <pre>{JSON.stringify(storeState, null, 2)}</pre>
  );
};
```

This comprehensive state management system provides a solid foundation for the playlist management
application with excellent performance, testing support, and developer experience.
