# Development Guide

This guide provides comprehensive information for developers working on Playlistify.

## Quick Start

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Start development:**

   ```bash
   npm run dev
   ```

3. **Run tests:**
   ```bash
   npm test
   ```

## Development Environment

### Required Tools

- **Node.js** (v18+): JavaScript runtime
- **npm** (v8+): Package manager
- **Git**: Version control
- **VS Code** (recommended): IDE with configured settings

### Optional Tools

- **Electron DevTools**: Built-in debugging tools
- **React DevTools**: Browser extension for React debugging
- **Redux DevTools**: For state management debugging

## Project Structure

```
src/
├── frontend/           # React renderer process
│   ├── components/     # Reusable UI components
│   ├── pages/         # Route-based page components
│   ├── lib/           # Frontend utilities and services
│   └── styles/        # CSS and styling files
├── backend/           # Node.js main process
│   ├── services/      # Business logic services
│   ├── handlers/      # IPC request handlers
│   └── utils/         # Backend utilities
├── shared/            # Code shared between processes
│   ├── types/         # TypeScript type definitions
│   ├── constants/     # Application constants
│   └── utils/         # Shared utilities
└── preload.ts         # Secure IPC bridge
```

## Development Workflow

### Code Quality Pipeline

1. **Write Code**: Follow TypeScript and React best practices
2. **Type Check**: `npm run type-check`
3. **Lint**: `npm run lint` (auto-fixes issues)
4. **Format**: `npm run format` (Prettier formatting)
5. **Test**: `npm test` (unit and integration tests)
6. **Commit**: Pre-commit hooks run automatically

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "feat: add your feature description"

# Push and create PR
git push origin feature/your-feature-name
```

## Architecture Overview

### Process Architecture

Playlistify uses Electron's multi-process architecture:

- **Main Process**: Node.js backend (src/main.ts)
- **Renderer Process**: React frontend (src/renderer-router.tsx)
- **Preload Script**: Secure IPC bridge (src/preload.ts)

### Communication Flow

```
Frontend (React) ↔ Preload Script ↔ Main Process (Node.js)
```

### State Management

- **Frontend State**: Zustand stores for UI state
- **Server State**: TanStack Query for data fetching
- **Settings**: Electron Store for persistent configuration

## Development Scripts

### Core Development

```bash
# Start development server
npm run dev

# Start with debug logging
npm run dev:debug

# Clean build and restart
npm run dev:clean
```

### Building

```bash
# Build all processes
npm run build:all

# Build specific process
npm run build:main
npm run build:renderer
npm run build:preload

# Build with file watching
npm run build:watch

# Production build
npm run build:prod
```

### Code Quality

```bash
# Run all quality checks
npm run validate

# Individual checks
npm run type-check      # TypeScript compilation
npm run lint:check      # ESLint without fixing
npm run format:check    # Prettier without formatting

# Auto-fix issues
npm run lint           # ESLint with auto-fix
npm run format         # Prettier formatting
```

### Testing

```bash
# Run all tests
npm run test:all

# Specific test suites
npm run test:unit          # Unit tests
npm run test:integration   # Integration tests
npm run test:acceptance    # End-to-end tests

# Test utilities
npm run test:watch         # Watch mode
npm run test:coverage      # Coverage report
```

### Maintenance

```bash
# Clean build artifacts
npm run clean
npm run clean:all
npm run clean:cache

# Dependency management
npm run deps:check         # Check for updates
npm run deps:update        # Update dependencies
npm run security:audit     # Security audit
```

## Debugging

### VS Code Debugging

The project includes VS Code debugging configurations:

1. **Debug Electron Main Process**: Debug the Node.js backend
2. **Debug Electron Renderer Process**: Debug the React frontend
3. **Debug Jest Tests**: Debug unit tests
4. **Debug Current Jest Test**: Debug the currently open test file

### Electron DevTools

- **Main Process**: Use VS Code debugger or console logging
- **Renderer Process**: Use Chrome DevTools (Ctrl+Shift+I)

### Logging

The application uses Winston for structured logging:

```typescript
import { logger } from '@/shared/utils/logger';

logger.info('Information message');
logger.warn('Warning message');
logger.error('Error message', { error });
```

Logs are written to:

- Console (development)
- Files in `Console Logs/` directory (production)

## Testing Strategy

### Unit Tests

- **Location**: `tests/unit/`, `tests/services/`, `tests/__tests__/`
- **Framework**: Jest with TypeScript support
- **Coverage**: Aim for 80%+ code coverage
- **Mocking**: Mock external dependencies and IPC calls

### Integration Tests

- **Location**: `tests/integration/`
- **Focus**: Component interactions, IPC communication
- **Database**: Use in-memory SQLite for testing

### End-to-End Tests

- **Location**: `tests/acceptance/`
- **Framework**: Playwright
- **Focus**: Complete user workflows
- **Environment**: Automated browser testing

### Test Utilities

```typescript
// Mock IPC calls
import { mockIPC } from '@/tests/utils/mockIPC';

// Test data factories
import { createMockPlaylist } from '@/tests/utils/factories';

// Component testing utilities
import { renderWithProviders } from '@/tests/utils/renderWithProviders';
```

## Performance Optimization

### Bundle Analysis

```bash
npm run analyze
```

This generates a webpack bundle analyzer report.

### Performance Monitoring

- **Startup Time**: Monitor application startup performance
- **Memory Usage**: Track memory consumption
- **Bundle Size**: Keep bundle sizes optimized

### Best Practices

- Use React.lazy() for code splitting
- Implement proper memoization with useMemo/useCallback
- Optimize images and assets
- Use efficient data structures

## Security Guidelines

### IPC Security

- All IPC communication goes through the secure preload script
- Validate all inputs from the renderer process
- Use contextBridge for secure API exposure

### File System Security

- Validate all file paths
- Sanitize user inputs
- Use path.join() for safe path construction

### Dependency Security

```bash
npm run security:audit
npm run security:fix
```

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Clear cache: `npm run clean:cache`
   - Reinstall dependencies: `rm -rf node_modules && npm install`

2. **Type Errors**
   - Run type check: `npm run type-check`
   - Check tsconfig.json configuration

3. **Linting Errors**
   - Auto-fix: `npm run lint`
   - Check ESLint configuration

4. **Test Failures**
   - Run specific test: `npm test -- --testNamePattern="test name"`
   - Check test setup and mocks

### Debug Information

When reporting issues, include:

- Node.js version: `node --version`
- npm version: `npm --version`
- Operating system
- Error messages and stack traces
- Steps to reproduce

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for detailed contribution guidelines.

## Resources

- [Electron Documentation](https://www.electronjs.org/docs)
- [React Documentation](https://react.dev)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)
- [Jest Documentation](https://jestjs.io/docs)
- [Playwright Documentation](https://playwright.dev/docs)
