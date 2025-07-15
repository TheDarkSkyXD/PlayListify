# Project Structure

This document describes the organization and structure of the Playlistify project.

## Overview

Playlistify follows a well-organized directory structure that separates concerns between frontend, backend, shared code, assets, tests, and documentation.

## Root Directory Structure

```
playlistify/
├── .git/                     # Git repository data                 # Kiro IDE configuration 
├── .vscode/                  # VS Code workspace settings
├── .webpack/                 # Webpack build artifacts
├── assets/                   # Static assets (icons, images, fonts)
├── context/                  # Project context and documentation
├── dist/                     # Build output directory
├── docs/                     # Project documentation
├── node_modules/             # npm dependencies
├── src/                      # Source code
├── tests/                    # Test files
├── types/                    # Global TypeScript type definitions
├── package.json              # npm package configuration
├── tsconfig.json             # TypeScript configuration
├── webpack.*.js              # Webpack configuration files
└── README.md                 # Project overview
```

## Source Code Structure (`src/`)

### Frontend (`src/frontend/`)

```
src/frontend/
├── components/               # React components
│   ├── ui/                  # Reusable UI components (shadcn/ui)
│   ├── layout/              # Layout components (headers, sidebars)
│   └── forms/               # Form-specific components
├── hooks/                   # Custom React hooks
├── lib/                     # Frontend utility functions
├── pages/                   # Page components for routing
├── stores/                  # Zustand state management
├── styles/                  # Styling files
│   ├── components/          # Component-specific styles
│   └── globals/             # Global styles and themes
└── utils/                   # Frontend utility functions
```

### Backend (`src/backend/`)

```
src/backend/
├── config/                  # Configuration files
├── handlers/                # IPC request handlers
├── middleware/              # Request processing middleware
├── models/                  # Data models and schemas
├── services/                # Business logic services
└── utils/                   # Backend utility functions
```

### Shared Code (`src/shared/`)

```
src/shared/
├── constants/               # Application constants
├── enums/                   # TypeScript enums
├── interfaces/              # TypeScript interfaces
├── types/                   # Type definitions
├── utils/                   # Shared utility functions
└── validators/              # Data validation schemas
```

### Root Source Files

- `main.ts` - Electron main process entry point
- `preload.ts` - Secure preload script for IPC
- `renderer.tsx` - React application entry point
- `index.html` - HTML template for renderer

## Assets Structure (`assets/`)

```
assets/
├── fonts/                   # Custom fonts
├── icons/                   # Application and UI icons
│   ├── app/                # Application icons (ico, icns, png)
│   └── ui/                 # UI icons and graphics
├── images/                  # Images and graphics
│   ├── backgrounds/        # Background images
│   ├── logos/              # Brand logos
│   ├── placeholders/       # Placeholder images
│   └── screenshots/        # App screenshots
└── public/                  # Static public assets
```

## Tests Structure (`tests/`)

```
tests/
├── acceptance/              # User story acceptance tests
├── chaos/                   # Chaos engineering tests
├── edge_cases/              # Edge case and error condition tests
├── integration/             # Integration tests
│   ├── dependencies/       # External dependency tests
│   ├── filesystem/         # File system operation tests
│   └── ipc/                # IPC communication tests
└── unit/                    # Unit tests
    ├── backend/            # Backend unit tests
    │   ├── handlers/       # IPC handler tests
    │   ├── services/       # Service layer tests
    │   └── utils/          # Backend utility tests
    ├── frontend/           # Frontend unit tests
    │   ├── components/     # React component tests
    │   ├── hooks/          # Custom hook tests
    │   ├── stores/         # State management tests
    │   └── utils/          # Frontend utility tests
    └── shared/             # Shared code tests
```

## Documentation Structure (`docs/`)

```
docs/
├── api/                     # API documentation
├── architecture/            # Architecture decisions and diagrams
├── development/             # Developer guides and standards
├── research/                # Research and analysis documents
├── specifications/          # Technical specifications
└── test-plans/              # Test planning documents
```

## Configuration Files

### TypeScript Configuration

- `tsconfig.json` - Main TypeScript configuration
- `tests/tsconfig.json` - Test-specific TypeScript configuration

### Build Configuration

- `webpack.main.config.js` - Main process Webpack config
- `webpack.renderer.config.js` - Renderer process Webpack config
- `webpack.preload.config.js` - Preload script Webpack config
- `webpack.rules.js` - Shared Webpack rules
- `babel.config.js` - Babel configuration
- `forge.config.js` - Electron Forge configuration

### Development Tools

- `.eslintrc.js` - ESLint configuration
- `.prettierrc` - Prettier configuration
- `jest.config.js` - Jest testing configuration
- `playwright.config.ts` - Playwright E2E testing configuration

## Path Aliases

The project uses TypeScript path aliases for cleaner imports:

```typescript
// Instead of relative imports
import { UserService } from '../../../backend/services/UserService';

// Use absolute imports
import { UserService } from '@/backend/services/UserService';
```

### Configured Aliases

- `@/` - Points to `src/`
- `@/frontend/` - Points to `src/frontend/`
- `@/backend/` - Points to `src/backend/`
- `@/shared/` - Points to `src/shared/`
- `@/assets/` - Points to `assets/`

## File Naming Conventions

### Components

- React components: `PascalCase.tsx` (e.g., `UserProfile.tsx`)
- Component tests: `PascalCase.test.tsx` (e.g., `UserProfile.test.tsx`)

### Services and Utilities

- Service classes: `PascalCase.ts` (e.g., `UserService.ts`)
- Utility functions: `camelCase.ts` (e.g., `fileUtils.ts`)
- Test files: `camelCase.test.ts` (e.g., `fileUtils.test.ts`)

### Types and Interfaces

- Type definitions: `PascalCase.ts` (e.g., `UserTypes.ts`)
- Shared interfaces: `PascalCase.ts` (e.g., `ApiInterfaces.ts`)

## Import/Export Patterns

### Barrel Exports

Use index files to create clean import paths:

```typescript
// src/frontend/components/index.ts
export { Button } from './ui/Button';
export { Modal } from './ui/Modal';
export { UserProfile } from './UserProfile';

// Usage
import { Button, Modal, UserProfile } from '@/frontend/components';
```

### Service Exports

```typescript
// Named exports for services
export { UserService } from './UserService';
export { PlaylistService } from './PlaylistService';

// Default exports for main classes
export default class DatabaseService {
  // Implementation
}
```

## Development Workflow

1. **Feature Development**: Create feature branches from main
2. **Code Organization**: Follow the established directory structure
3. **Testing**: Write tests in corresponding test directories
4. **Documentation**: Update relevant documentation
5. **Code Review**: Ensure adherence to structure guidelines

## Best Practices

1. **Separation of Concerns**: Keep frontend, backend, and shared code separate
2. **Consistent Naming**: Follow established naming conventions
3. **Path Aliases**: Use configured aliases for cleaner imports
4. **Test Organization**: Mirror source structure in test directories
5. **Documentation**: Keep documentation current with code changes
6. **Asset Organization**: Organize assets by type and usage
7. **Configuration Management**: Keep configuration files organized and documented

This structure provides a solid foundation for the Playlistify application, ensuring maintainability, scalability, and developer productivity.