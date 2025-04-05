# PlayListify Development Guide

This document provides guidelines and information for developers working on the PlayListify application.

## Development Environment Setup

### Prerequisites

- Node.js (v16 or later)
- npm (v7 or later)
- Git

### Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/PlayListify.git
   cd PlayListify
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

## Project Structure

The project follows a clear separation between backend (Electron main process) and frontend (Electron renderer process) code:

- `src/backend/`: Electron main process code
- `src/frontend/`: Electron renderer process code (React)
- `src/shared/`: Code shared between backend and frontend
- `src/preload.ts`: Electron preload script for IPC
- `src/main.ts`: Electron main process entry point
- `src/renderer.tsx`: Electron renderer process entry point

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Define interfaces for all data structures
- Use proper type annotations for function parameters and return types
- Avoid using `any` type when possible
- Use type assertions only when necessary

### React Components

- Use functional components with hooks
- Organize components by feature in the `src/frontend/features/` directory
- Use the UI components from `src/frontend/components/ui/` for consistent styling
- Keep components focused on a single responsibility
- Use proper prop types for all components

### Backend Services

- Organize services by functionality in the `src/backend/services/` directory
- Use dependency injection to make services testable
- Handle errors properly and provide meaningful error messages
- Use async/await for asynchronous operations
- Document public APIs with JSDoc comments

## Database Development

### Working with SQLite

The application uses SQLite for storing playlist and video metadata. Here are some guidelines for working with the database:

1. **Schema Changes**:
   - Add new tables or columns in `src/backend/services/databaseManager.ts`
   - Create migration scripts in `scripts/` for existing databases
   - Document schema changes in `docs/DATABASE.md`

2. **Querying**:
   - Use parameterized queries to prevent SQL injection
   - Use transactions for operations that modify multiple tables
   - Add indexes for frequently queried columns

3. **Testing**:
   - Use the in-memory database for unit tests
   - Create test fixtures for common database operations
   - Test edge cases and error conditions

### Database Tools

The application provides several npm scripts for working with the database:

- `npm run db:info`: Display information about the database
- `npm run db:backup`: Create a backup of the database
- `npm run db:restore`: Restore the database from a backup
- `npm run db:clear`: Clear all data from the database
- `npm run db:reset`: Reset the database to its initial state
- `npm run db:update-schema`: Update the database schema

## IPC Communication

Communication between the backend and frontend is handled through IPC. Here's how to add a new IPC handler:

1. Define the handler function in an appropriate file in `src/backend/ipc/`:
   ```typescript
   ipcMain.handle('channel:action', async (event, ...args) => {
     try {
       // Implement the handler
       return result;
     } catch (error) {
       console.error('Error in channel:action:', error);
       throw error;
     }
   });
   ```

2. Register the handler in `src/backend/ipc/handlers.ts`:
   ```typescript
   import { registerMyHandlers } from './myHandlers';
   
   export function registerIpcHandlers(): void {
     // ...
     registerMyHandlers();
   }
   ```

3. Expose the handler in `src/preload.ts`:
   ```typescript
   myFeature: {
     action: (...args) => ipcRenderer.invoke('channel:action', ...args)
   }
   ```

4. Update the API type in `src/shared/types/appTypes.ts`:
   ```typescript
   myFeature: {
     action: (...args: ArgType[]) => Promise<ResultType>;
   }
   ```

## Testing

### Unit Tests

- Write unit tests for all new functionality
- Use Jest for testing
- Place test files next to the files they test with a `.test.ts` extension
- Mock external dependencies
- Run tests with `npm test`

### Integration Tests

- Write integration tests for critical user flows
- Use Playwright for end-to-end testing
- Place integration tests in the `tests/integration/` directory
- Run integration tests with `npm run test:integration`

## Building and Packaging

### Development Build

- Run `npm run build` to create a development build
- The build output will be in the `dist/` directory

### Production Build

- Run `npm run package` to create a production build
- The packaged application will be in the `out/` directory

### Platform-Specific Builds

- Run `npm run package:win` to create a Windows build
- Run `npm run package:mac` to create a macOS build
- Run `npm run package:linux` to create a Linux build

## Troubleshooting

### Common Issues

1. **TypeScript Errors**:
   - Make sure all imports are correct
   - Check for missing type definitions
   - Use proper type assertions when necessary

2. **Database Errors**:
   - Check if the database file exists
   - Verify that the database schema is up to date
   - Look for SQL syntax errors

3. **IPC Communication Errors**:
   - Ensure that the channel name is correct
   - Check that the handler is properly registered
   - Verify that the arguments are correctly passed

### Debugging

1. **Backend Debugging**:
   - Use `console.log` for simple debugging
   - Check the logs in the `logs/` directory
   - Use the Chrome DevTools for more advanced debugging

2. **Frontend Debugging**:
   - Use the React DevTools
   - Check the browser console for errors
   - Use the Redux DevTools for state debugging

## Contributing

1. Create a new branch for your feature or bugfix
2. Make your changes
3. Write tests for your changes
4. Update documentation if necessary
5. Submit a pull request

## Resources

- [Electron Documentation](https://www.electronjs.org/docs)
- [React Documentation](https://reactjs.org/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)
- [SQLite Documentation](https://www.sqlite.org/docs.html)
- [yt-dlp Documentation](https://github.com/yt-dlp/yt-dlp#readme)
