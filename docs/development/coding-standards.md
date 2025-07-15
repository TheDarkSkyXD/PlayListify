# Coding Standards

This document outlines the coding standards and best practices for the Playlistify project.

## TypeScript Standards

### Type Definitions

```typescript
// Use interfaces for object shapes
interface User {
  id: string;
  name: string;
  email: string;
}

// Use types for unions and computed types
type Status = 'loading' | 'success' | 'error';
type UserKeys = keyof User;
```

### Naming Conventions

- **Variables/Functions**: camelCase (`userName`, `getUserData`)
- **Classes**: PascalCase (`UserService`, `PlaylistManager`)
- **Constants**: UPPER_SNAKE_CASE (`API_BASE_URL`, `MAX_RETRIES`)
- **Interfaces**: PascalCase with descriptive names (`UserData`, `PlaylistItem`)
- **Types**: PascalCase (`UserStatus`, `ApiResponse`)

### Function Guidelines

```typescript
// Use arrow functions for simple operations
const add = (a: number, b: number): number => a + b;

// Use function declarations for complex logic
function processPlaylist(playlist: Playlist): ProcessedPlaylist {
  // Complex logic here
  return processedPlaylist;
}

// Always specify return types for public functions
export function createUser(data: UserData): Promise<User> {
  // Implementation
}
```

## React Standards

### Component Structure

```typescript
// Use functional components with TypeScript
interface Props {
  title: string;
  onClose: () => void;
}

export function Modal({ title, onClose }: Props) {
  return (
    <div className="modal">
      <h2>{title}</h2>
      <button onClick={onClose}>Close</button>
    </div>
  );
}
```

### Hooks Usage

```typescript
// Custom hooks should start with 'use'
function usePlaylist(id: string) {
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  
  useEffect(() => {
    // Fetch playlist logic
  }, [id]);
  
  return { playlist, setPlaylist };
}
```

## File Organization

### Import Order

```typescript
// 1. Node modules
import React from 'react';
import { useState } from 'react';

// 2. Internal modules (absolute paths)
import { UserService } from '@/services/UserService';
import { Button } from '@/components/ui/Button';

// 3. Relative imports
import './Component.css';
```

### Export Patterns

```typescript
// Named exports for utilities and services
export { UserService } from './UserService';
export { validateEmail } from './validators';

// Default exports for React components
export default function HomePage() {
  return <div>Home</div>;
}
```

## Error Handling

### Error Types

```typescript
// Define specific error types
class ValidationError extends Error {
  constructor(field: string, message: string) {
    super(`Validation failed for ${field}: ${message}`);
    this.name = 'ValidationError';
  }
}
```

### Error Handling Patterns

```typescript
// Use Result pattern for operations that can fail
type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

async function fetchUser(id: string): Promise<Result<User>> {
  try {
    const user = await userService.getUser(id);
    return { success: true, data: user };
  } catch (error) {
    return { success: false, error: error as Error };
  }
}
```

## Performance Guidelines

- Use `React.memo` for expensive components
- Implement proper dependency arrays in `useEffect`
- Use `useMemo` and `useCallback` judiciously
- Avoid inline object/function creation in render

## Security Guidelines

- Validate all inputs
- Sanitize data before display
- Use proper TypeScript types to prevent runtime errors
- Follow Electron security best practices
- Never expose sensitive data to renderer process

## Testing Standards

```typescript
// Use descriptive test names
describe('UserService', () => {
  it('should return user data when valid ID is provided', async () => {
    // Test implementation
  });
  
  it('should throw error when user is not found', async () => {
    // Test implementation
  });
});
```

## Documentation Standards

- Use JSDoc for public APIs
- Include examples in documentation
- Keep README files up to date
- Document complex business logic