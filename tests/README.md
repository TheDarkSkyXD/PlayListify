# PlayListify Tests

This directory contains tests for the PlayListify application. The tests are organized to match the structure of the source code.

## Directory Structure

```
tests/
├── backend/           # Tests for backend (main process) code
│   ├── services/      # Tests for backend services
│   └── utils/         # Tests for backend utilities
├── frontend/          # Tests for frontend (renderer process) code
│   ├── components/    # Tests for UI components
│   ├── features/      # Tests for feature-specific components
│   ├── stores/        # Tests for state management stores
│   └── utils/         # Tests for frontend utilities
└── shared/            # Tests for shared code
    └── types/         # Tests for type definitions
```

## Running Tests

To run all tests:

```bash
npm test
```

To run tests with coverage:

```bash
npm run test:coverage
```

To run tests in watch mode (useful during development):

```bash
npm run test:watch
```

To run tests for a specific file or directory:

```bash
npm test -- tests/backend/services
```

## Writing Tests

### Naming Convention

- Test files should be named with the `.test.ts` or `.test.tsx` extension
- Test files should be placed in the same directory structure as the source code they are testing

### Test Structure

Each test file should:

1. Import the module being tested
2. Mock any dependencies as needed
3. Use `describe` blocks to group related tests
4. Use `test` or `it` blocks for individual test cases
5. Use `expect` assertions to verify behavior

Example:

```typescript
import { someFunction } from '../../../src/path/to/module';

describe('someFunction', () => {
  test('should return expected result', () => {
    const result = someFunction(input);
    expect(result).toBe(expectedOutput);
  });
});
```

### Mocking

- Use Jest's mocking capabilities to mock dependencies
- For Electron-specific APIs, use the mocks provided in `setup.js`
- For React components, use `@testing-library/react` for rendering and testing

## Best Practices

1. Test behavior, not implementation details
2. Keep tests simple and focused
3. Use descriptive test names
4. Avoid test interdependence
5. Clean up after tests (restore mocks, clean DOM, etc.)
6. Aim for high test coverage, but prioritize critical paths
7. Use snapshots sparingly and review them carefully

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Testing Electron Apps](https://www.electronjs.org/docs/latest/tutorial/automated-testing)
