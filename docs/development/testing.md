# Testing Guidelines

This document outlines testing practices and guidelines for the Playlistify project.

## Testing Strategy

### Test Pyramid

1. **Unit Tests** (70%) - Fast, isolated tests for individual functions/components
2. **Integration Tests** (20%) - Tests for component interactions and IPC communication
3. **End-to-End Tests** (10%) - Full application workflow tests

### Test Types

- **Unit Tests**: Individual functions, components, services
- **Integration Tests**: IPC communication, file system operations, service interactions
- **Acceptance Tests**: User stories and complete workflows
- **Edge Case Tests**: Error conditions, boundary values, unusual inputs

## Testing Tools

- **Jest**: Unit and integration testing framework
- **React Testing Library**: React component testing
- **Playwright**: End-to-end testing for Electron
- **MSW**: API mocking for tests

## Unit Testing

### Component Testing

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/ui/Button';

describe('Button Component', () => {
  it('should render with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('should call onClick handler when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Service Testing

```typescript
import { UserService } from '@/services/UserService';

describe('UserService', () => {
  let userService: UserService;

  beforeEach(() => {
    userService = new UserService();
  });

  it('should create user with valid data', async () => {
    const userData = { name: 'John Doe', email: 'john@example.com' };
    const result = await userService.createUser(userData);
    
    expect(result.success).toBe(true);
    expect(result.data.name).toBe('John Doe');
  });

  it('should handle validation errors', async () => {
    const invalidData = { name: '', email: 'invalid-email' };
    const result = await userService.createUser(invalidData);
    
    expect(result.success).toBe(false);
    expect(result.error).toBeInstanceOf(ValidationError);
  });
});
```

## Integration Testing

### IPC Testing

```typescript
import { ipcMain, ipcRenderer } from 'electron';
import { setupIPCHandlers } from '@/backend/ipc-handlers';

describe('IPC Communication', () => {
  beforeEach(() => {
    setupIPCHandlers();
  });

  it('should handle playlist creation request', async () => {
    const playlistData = { name: 'Test Playlist', description: 'Test' };
    
    const result = await ipcRenderer.invoke('playlist:create', playlistData);
    
    expect(result.success).toBe(true);
    expect(result.data.name).toBe('Test Playlist');
  });
});
```

### File System Testing

```typescript
import { FileSystemService } from '@/services/FileSystemService';
import { tmpdir } from 'os';
import { join } from 'path';

describe('FileSystemService', () => {
  let fsService: FileSystemService;
  let testDir: string;

  beforeEach(() => {
    fsService = new FileSystemService();
    testDir = join(tmpdir(), 'playlistify-test');
  });

  afterEach(async () => {
    await fsService.removeDirectory(testDir);
  });

  it('should create directory structure', async () => {
    await fsService.ensureDirectory(testDir);
    const exists = await fsService.directoryExists(testDir);
    
    expect(exists).toBe(true);
  });
});
```

## End-to-End Testing

### Electron E2E Testing

```typescript
import { test, expect } from '@playwright/test';
import { ElectronApplication, _electron as electron } from 'playwright';

test.describe('Application Launch', () => {
  let electronApp: ElectronApplication;

  test.beforeAll(async () => {
    electronApp = await electron.launch({ args: ['dist/main.js'] });
  });

  test.afterAll(async () => {
    await electronApp.close();
  });

  test('should launch application successfully', async () => {
    const window = await electronApp.firstWindow();
    await expect(window).toHaveTitle('Playlistify');
  });

  test('should display main navigation', async () => {
    const window = await electronApp.firstWindow();
    await expect(window.locator('[data-testid="main-nav"]')).toBeVisible();
  });
});
```

## Test Organization

### Directory Structure

```
tests/
├── unit/
│   ├── frontend/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── utils/
│   ├── backend/
│   │   ├── services/
│   │   ├── handlers/
│   │   └── utils/
│   └── shared/
├── integration/
│   ├── ipc/
│   ├── filesystem/
│   └── dependencies/
├── acceptance/
└── edge_cases/
```

### Test File Naming

- Unit tests: `ComponentName.test.tsx` or `serviceName.test.ts`
- Integration tests: `featureName.integration.test.ts`
- E2E tests: `workflow.e2e.test.ts`

## Mocking Guidelines

### Service Mocking

```typescript
// Mock external dependencies
jest.mock('@/services/ExternalService', () => ({
  ExternalService: jest.fn().mockImplementation(() => ({
    getData: jest.fn().mockResolvedValue({ data: 'mocked' }),
  })),
}));
```

### IPC Mocking

```typescript
// Mock IPC communication
const mockIpcRenderer = {
  invoke: jest.fn(),
  on: jest.fn(),
  removeAllListeners: jest.fn(),
};

Object.defineProperty(window, 'electronAPI', {
  value: mockIpcRenderer,
});
```

## Test Data Management

### Test Fixtures

```typescript
// Create reusable test data
export const testPlaylist = {
  id: 'test-playlist-1',
  name: 'Test Playlist',
  description: 'A playlist for testing',
  videos: [],
  createdAt: new Date('2024-01-01'),
};

export const testUser = {
  id: 'test-user-1',
  name: 'Test User',
  email: 'test@example.com',
};
```

## Coverage Requirements

- **Minimum Coverage**: 80% overall
- **Critical Paths**: 95% coverage for core functionality
- **New Code**: 90% coverage for new features

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test suite
npm test -- --testPathPattern=components

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e
```

## Best Practices

1. **Test Behavior, Not Implementation**: Focus on what the code does, not how
2. **Use Descriptive Names**: Test names should clearly describe the scenario
3. **Arrange-Act-Assert**: Structure tests with clear setup, action, and verification
4. **Keep Tests Independent**: Each test should be able to run in isolation
5. **Mock External Dependencies**: Isolate the code under test
6. **Test Edge Cases**: Include error conditions and boundary values
7. **Maintain Test Code**: Keep tests clean and refactored like production code