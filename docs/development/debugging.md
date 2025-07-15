# Debugging Guide

This guide covers debugging techniques and tools for the Playlistify application.

## Debugging Tools

### VS Code Debugging

#### Main Process Debugging

1. **Launch Configuration** (`.vscode/launch.json`):
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Main Process",
      "type": "node",
      "request": "launch",
      "cwd": "${workspaceFolder}",
      "runtimeExecutable": "${workspaceFolder}/node_modules/.bin/electron",
      "windows": {
        "runtimeExecutable": "${workspaceFolder}/node_modules/.bin/electron.cmd"
      },
      "args": ["dist/main.js"],
      "outputCapture": "std",
      "console": "integratedTerminal",
      "protocol": "inspector"
    }
  ]
}
```

2. **Set Breakpoints**: Click in the gutter next to line numbers
3. **Start Debugging**: Press F5 or use the Debug panel

#### Renderer Process Debugging

1. **Open DevTools**: 
   - In development: Ctrl+Shift+I (Windows/Linux) or Cmd+Opt+I (Mac)
   - Programmatically: `webContents.openDevTools()`

2. **React DevTools**: Install the browser extension for React debugging

### Chrome DevTools

#### Console Debugging

```typescript
// Add console logs for debugging
console.log('Debug info:', data);
console.error('Error occurred:', error);
console.warn('Warning:', warning);

// Use console.table for objects
console.table(arrayOfObjects);

// Group related logs
console.group('User Actions');
console.log('User clicked button');
console.log('API call initiated');
console.groupEnd();
```

#### Network Tab

- Monitor IPC communication
- Check for failed requests
- Analyze performance timing

#### Sources Tab

- Set breakpoints in source code
- Step through code execution
- Inspect variable values
- Watch expressions

## Debugging Techniques

### IPC Communication Debugging

```typescript
// Backend (main process)
ipcMain.handle('debug-channel', async (event, data) => {
  console.log('IPC received:', data);
  try {
    const result = await processData(data);
    console.log('IPC result:', result);
    return result;
  } catch (error) {
    console.error('IPC error:', error);
    throw error;
  }
});

// Frontend (renderer process)
const debugIPC = async (data: any) => {
  console.log('Sending IPC:', data);
  try {
    const result = await window.electronAPI.invoke('debug-channel', data);
    console.log('IPC response:', result);
    return result;
  } catch (error) {
    console.error('IPC failed:', error);
    throw error;
  }
};
```

### React Component Debugging

```typescript
import { useEffect } from 'react';

function DebugComponent({ data }: { data: any }) {
  // Debug props changes
  useEffect(() => {
    console.log('Component props changed:', data);
  }, [data]);

  // Debug renders
  console.log('Component rendering with:', data);

  return <div>{/* Component JSX */}</div>;
}

// Use React DevTools Profiler
import { Profiler } from 'react';

function onRenderCallback(id: string, phase: string, actualDuration: number) {
  console.log('Render performance:', { id, phase, actualDuration });
}

<Profiler id="MyComponent" onRender={onRenderCallback}>
  <MyComponent />
</Profiler>
```

### State Management Debugging

```typescript
// Zustand store debugging
import { subscribeWithSelector } from 'zustand/middleware';

const useStore = create(
  subscribeWithSelector((set, get) => ({
    // Store state
    count: 0,
    increment: () => {
      console.log('Before increment:', get().count);
      set((state) => ({ count: state.count + 1 }));
      console.log('After increment:', get().count);
    },
  }))
);

// Subscribe to state changes
useStore.subscribe(
  (state) => state.count,
  (count) => console.log('Count changed to:', count)
);
```

### Error Boundary Debugging

```typescript
import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    console.error('Error boundary caught error:', error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error boundary details:', { error, errorInfo });
    // Send error to logging service
  }

  render() {
    if (this.state.hasError) {
      return (
        <div>
          <h2>Something went wrong.</h2>
          <details>
            <summary>Error details</summary>
            <pre>{this.state.error?.stack}</pre>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}
```

## Common Issues and Solutions

### Application Won't Start

1. **Check Dependencies**:
   ```bash
   npm install
   npm run build
   ```

2. **Clear Build Cache**:
   ```bash
   rm -rf dist/
   rm -rf .webpack/
   npm run build
   ```

3. **Check Main Process Logs**:
   - Look for errors in terminal output
   - Check if main.js exists in dist/

### Renderer Process Issues

1. **White Screen**:
   - Check browser console for errors
   - Verify renderer.js is loaded
   - Check for TypeScript compilation errors

2. **React Errors**:
   - Use React DevTools
   - Check component props and state
   - Look for key prop warnings

### IPC Communication Issues

1. **Handler Not Found**:
   ```typescript
   // Verify handler is registered
   console.log('Registered IPC handlers:', ipcMain.eventNames());
   ```

2. **Serialization Errors**:
   ```typescript
   // Ensure data is serializable
   const safeData = JSON.parse(JSON.stringify(data));
   ```

### Performance Issues

1. **Memory Leaks**:
   - Use Chrome DevTools Memory tab
   - Check for event listener cleanup
   - Monitor component unmounting

2. **Slow Rendering**:
   - Use React Profiler
   - Check for unnecessary re-renders
   - Optimize component dependencies

## Logging Strategies

### Structured Logging

```typescript
interface LogEntry {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  category: string;
  message: string;
  data?: any;
}

class Logger {
  private log(level: LogEntry['level'], category: string, message: string, data?: any) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      data
    };
    
    console.log(JSON.stringify(entry));
    // Also write to file in production
  }

  debug(category: string, message: string, data?: any) {
    this.log('debug', category, message, data);
  }

  info(category: string, message: string, data?: any) {
    this.log('info', category, message, data);
  }

  warn(category: string, message: string, data?: any) {
    this.log('warn', category, message, data);
  }

  error(category: string, message: string, data?: any) {
    this.log('error', category, message, data);
  }
}

export const logger = new Logger();
```

### Conditional Logging

```typescript
const isDevelopment = process.env.NODE_ENV === 'development';

const debugLog = isDevelopment ? console.log : () => {};
const debugError = isDevelopment ? console.error : () => {};

// Usage
debugLog('Development info:', data);
debugError('Development error:', error);
```

## Testing and Debugging

### Unit Test Debugging

```typescript
// Add debug output in tests
describe('UserService', () => {
  it('should create user', async () => {
    const userData = { name: 'Test User' };
    console.log('Test input:', userData);
    
    const result = await userService.createUser(userData);
    console.log('Test result:', result);
    
    expect(result.success).toBe(true);
  });
});
```

### Integration Test Debugging

```typescript
// Debug IPC in tests
test('IPC communication', async () => {
  const mockIPC = jest.fn().mockResolvedValue({ success: true });
  
  // Add logging to mock
  mockIPC.mockImplementation((channel, data) => {
    console.log('Mock IPC call:', { channel, data });
    return Promise.resolve({ success: true });
  });
});
```

## Production Debugging

### Error Reporting

```typescript
// Set up error reporting
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  // Send to error reporting service
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection at:', promise, 'reason:', reason);
  // Send to error reporting service
});
```

### Remote Debugging

```typescript
// Enable remote debugging in development
if (process.env.NODE_ENV === 'development') {
  app.commandLine.appendSwitch('remote-debugging-port', '9222');
}
```

## Best Practices

1. **Use Meaningful Log Messages**: Include context and relevant data
2. **Remove Debug Code**: Clean up console.log statements before production
3. **Use Proper Log Levels**: Debug, info, warn, error appropriately
4. **Test Error Paths**: Ensure error handling works correctly
5. **Monitor Performance**: Use profiling tools regularly
6. **Document Known Issues**: Keep track of common problems and solutions

This debugging guide should help you efficiently identify and resolve issues during development.