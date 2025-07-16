# Testing Infrastructure

This directory contains the comprehensive testing infrastructure for the Playlistify application.

## Overview

The testing infrastructure includes:

- **Unit Tests**: Testing individual components and services
- **Integration Tests**: Testing interactions between components
- **Test Utilities**: Mocking and helper utilities for testing
- **Coverage Reporting**: Code coverage analysis and quality gates

## Test Structure

```
tests/
├── __tests__/           # Core unit tests
├── utils/               # Test utilities and helpers
├── mocks/               # Mock implementations
├── integration/         # Integration tests
├── setup.ts             # Global test setup
└── README.md           # This file
```

## Running Tests

### All Tests
```bash
npm test
```

### Specific Test Patterns
```bash
# Run only unit tests
npm run test:unit

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- --testPathPattern="shared-errors.test.ts"

# Run tests in watch mode
npm run test:watch
```

## Test Configuration

### Jest Configuration
- **Framework**: Jest with TypeScript support
- **Environment**: Node.js environment for Electron testing
- **Coverage**: 80% threshold for branches, functions, lines, and statements
- **Timeout**: 10 seconds default timeout
- **Mocking**: Comprehensive Electron API mocking

### Key Features
- **Electron Mocking**: Complete Electron API mock for testing
- **IPC Testing**: Utilities for testing Inter-Process Communication
- **Service Mocking**: Mock implementations for backend services
- **React Testing**: Utilities for testing React components (future)

## Test Utilities

### IPC Testing (`tests/utils/ipc-test-utils.ts`)
- `MockIPCMain`: Mock IPC main process
- `MockIPCRenderer`: Mock IPC renderer process
- `MockContextBridge`: Mock context bridge
- `testIPCRoundTrip`: Helper for testing complete IPC communication

### Service Testing (`tests/utils/service-test-utils.ts`)
- `createServiceTestEnvironment`: Set up test environment
- `MockElectronStore`: Mock electron-store
- `MockLogger`: Mock winston logger
- `createTempTestDirectory`: Create temporary directories for testing

### React Testing (`tests/utils/react-test-utils.tsx`)
- `renderWithProviders`: Render components with all providers
- `createTestQueryClient`: Create test React Query client
- `mockAPIResponse`: Mock API responses for testing

## Mock Implementations

### Electron Mock (`tests/mocks/electron.ts`)
Complete mock of Electron APIs including:
- BrowserWindow
- IPC (main and renderer)
- App lifecycle
- Dialog, Shell, Screen
- Menu, Tray, Notification
- Context Bridge

## Test Examples

### Unit Test Example
```typescript
import { SystemError } from '../../src/shared/errors';

describe('SystemError', () => {
  it('should create error with correct properties', () => {
    const error = new SystemError('Test message', 'TEST_CODE');
    
    expect(error.message).toBe('Test message');
    expect(error.code).toBe('TEST_CODE');
    expect(error.name).toBe('SystemError');
    expect(error.recoverable).toBe(true);
  });
});
```

### IPC Test Example
```typescript
import { createIPCTestEnvironment } from '../utils/ipc-test-utils';

describe('IPC Communication', () => {
  let ipcEnv: ReturnType<typeof createIPCTestEnvironment>;

  beforeEach(() => {
    ipcEnv = createIPCTestEnvironment();
  });

  it('should handle IPC round-trip', async () => {
    const handler = jest.fn().mockResolvedValue('result');
    ipcEnv.ipcMain.handle('test-channel', handler);
    
    const result = await ipcEnv.ipcMain.invokeHandler('test-channel', 'arg');
    
    expect(result).toBe('result');
    expect(handler).toHaveBeenCalledWith('arg');
  });
});
```

## Coverage Requirements

The testing infrastructure enforces minimum coverage thresholds:
- **Branches**: 80%
- **Functions**: 80%
- **Lines**: 80%
- **Statements**: 80%

## Best Practices

1. **Test Organization**: Group related tests in describe blocks
2. **Setup/Teardown**: Use beforeEach/afterEach for test isolation
3. **Mocking**: Use comprehensive mocks for external dependencies
4. **Assertions**: Write clear, specific assertions
5. **Error Testing**: Test both success and error scenarios
6. **Async Testing**: Properly handle async operations with await

## Troubleshooting

### Common Issues

1. **Timeout Errors**: Increase timeout for long-running tests
2. **Mock Issues**: Ensure mocks are properly reset between tests
3. **Import Errors**: Check module path mappings in Jest config
4. **Electron Errors**: Use provided Electron mocks instead of real APIs

### Debug Tips

1. Use `--verbose` flag for detailed test output
2. Use `--no-coverage` to speed up test runs during development
3. Use `--testPathPattern` to run specific tests
4. Check test setup in `tests/setup.ts` for global configuration

## Current Status

✅ **Completed Features**:
- Jest configuration with TypeScript support
- Electron-specific testing environment
- IPC communication test utilities
- Service testing utilities and mocks
- Basic unit tests for core services
- Coverage reporting and quality gates

🔄 **In Progress**:
- React component testing utilities
- End-to-end testing setup
- Performance testing utilities

📋 **Planned**:
- Visual regression testing
- Accessibility testing
- Load testing for background services