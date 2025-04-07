# Database Tests

This folder contains test scripts for verifying database functionality in the application.

## Available Tests

### 1. SQLite Test

This script tests the SQLite database directly without Electron.

```bash
npx ts-node tests/database/test-sqlite.ts
```

### 2. Database Manager Test

This script tests the SQLite database manager within an Electron context.

```bash
npx ts-node tests/database/test-database.ts
```

### 3. Create Test Database

This script creates a test JSON database file for development.

```bash
npx ts-node tests/database/create-test-db.ts
```

## What These Tests Verify

1. **SQLite Functionality**: Verifies that the SQLite database works correctly for CRUD operations.
2. **Database Manager**: Tests the database manager within an Electron context.
3. **Test Data Creation**: Creates sample data for testing and development.

## Troubleshooting

If the tests fail, check the following:

1. **SQLite Installation**: Make sure SQLite is properly installed and accessible.
2. **Electron Context**: The database manager test must be run in an Electron context.
3. **File Permissions**: Make sure the application has permission to create and modify files in the database directory.

## Notes

- These tests are for development and testing purposes only.
- The test database files are temporary and will be removed after the tests complete.
- You can modify the test data in `create-test-db.ts` to suit your testing needs.
