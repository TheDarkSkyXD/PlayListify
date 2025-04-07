# PlayListify Component Organization

This document explains the organization of components in the PlayListify application to help developers understand where to place new components and how to use existing ones.

## Component Structure

The application uses a feature-based organization with shared components. Here's an overview of the component structure:

```
src/frontend/
├── components/            # Shared components used across features
│   ├── ui/                # Basic UI components (buttons, inputs, etc.)
│   ├── layout/            # Layout components (AppLayout, etc.)
│   └── common/            # Complex shared components
├── features/              # Feature-based organization
│   ├── dashboard/         # Dashboard feature
│   │   ├── components/    # Dashboard-specific components
│   │   ├── hooks/         # Dashboard-specific hooks
│   │   └── pages/         # Dashboard pages
│   ├── playlists/         # Playlists feature
│   │   ├── components/    # Playlist-specific components
│   │   ├── hooks/         # Playlist-specific hooks
│   │   └── pages/         # Playlist pages
│   ├── downloads/         # Downloads feature
│   │   ├── components/    # Download-specific components
│   │   ├── hooks/         # Download-specific hooks
│   │   └── pages/         # Download pages
│   ├── player/            # Video player feature
│   │   ├── components/    # Player-specific components
│   │   ├── hooks/         # Player-specific hooks
│   │   └── stores/        # Player-specific state management
│   ├── settings/          # Settings feature
│   │   ├── components/    # Settings-specific components
│   │   └── pages/         # Settings pages
│   └── ... (other features)
└── ... (other folders)
```

## Component Types

### Shared Components (`src/frontend/components/`)

These components are used across multiple features:

#### UI Components (`components/ui/`)

Basic UI elements that are reusable across the entire application:
- Buttons, inputs, checkboxes, labels, etc.
- Form elements, modals, tooltips
- These components are feature-agnostic and purely presentational

Examples:
- `button.tsx`
- `input.tsx`
- `checkbox.tsx`
- `dialog.tsx`

#### Layout Components (`components/layout/`)

Components that define the structure of your pages:
- `AppLayout.tsx` - Main application layout with sidebar
- Other potential layouts like AuthLayout, FullscreenLayout, etc.

#### Common Components (`components/common/`)

More complex shared components that aren't tied to a specific feature:
- `SidebarNav.tsx` - Navigation component
- `CachedImage.tsx` - Image with caching
- `ImportProgress/` - Progress indicators

### Feature-Specific Components (`src/frontend/features/*/components/`)

Components that are specific to a particular feature:
- `features/dashboard/components/` - Dashboard-specific components
- `features/playlists/components/` - Playlist-specific components (PlaylistList, PlaylistCard, etc.)
- `features/downloads/components/` - Download-specific components (DownloadList, DownloadItem, etc.)
- `features/player/components/` - Player-specific components (VideoPlayer, PlayerControls, etc.)
- `features/settings/components/` - Settings-specific components (SettingsForm, etc.)

## Decision Making

When deciding where to place a component, ask yourself:

1. **Is it a basic UI element?** → Place in `components/ui/`
2. **Is it a layout component?** → Place in `components/layout/`
3. **Is it used across multiple features?** → Place in `components/common/`
4. **Is it specific to one feature?** → Place in `features/[feature]/components/`

## Naming Conventions

- **Component Files**: Use PascalCase for component files (e.g., `Button.tsx`, `PlaylistCard.tsx`)
- **Utility Files**: Use camelCase for utility files (e.g., `formatters.ts`, `helpers.ts`)
- **Index Files**: Create index files to export components from folders
- **Feature Folders**: Use kebab-case for feature folders if they contain multiple words

## Styling

The application uses a combination of Tailwind CSS and CSS modules:

- **Global Styles**: Located in `src/frontend/styles/global.css`
- **CSS Variables**: Located in `src/frontend/styles/variables.css`
- **Animations**: Located in `src/frontend/styles/animations.css`
- **Theme Styles**: Located in `src/frontend/styles/themes/`

For component-specific styles, consider using CSS modules if the component requires complex styling beyond what Tailwind provides.

## Complex Component Organization

For complex components that require multiple files, organize them in a dedicated folder structure:

```
components/
  └── ComponentName/
      ├── index.tsx       # Main export file
      ├── types.ts        # Shared types and interfaces
      ├── useHook.ts      # Custom hooks
      ├── SubComponent.tsx # Smaller component
      └── ... (other files)
```

Example:

```
components/
  └── ImportProgress/
      ├── index.tsx                # Main export file
      ├── ImportProgressBar.tsx    # Progress bar component
      ├── useImportProgress.ts     # Custom hook for progress state
      └── types.ts                 # Shared types
```

## File Size Limits

To maintain code readability and maintainability, follow these guidelines:

- **Frontend code files**: Limited to 500 lines maximum

When a file exceeds these limits, split it into multiple smaller files organized in dedicated folders as shown above.

## Best Practices

1. **Keep components focused**: Each component should do one thing well
2. **Use composition**: Compose complex components from simpler ones
3. **Avoid deep nesting**: Keep component hierarchies shallow
4. **Document components**: Add JSDoc comments to explain component purpose and props
5. **Use TypeScript**: Define prop types for all components
6. **Create index files**: Use index files to simplify imports
7. **Prefer shadcn components**: Use shadcn UI components rather than direct Radix UI components
8. **Limit file size**: Keep files under 500 lines by splitting into smaller modules
9. **Use feature folders**: Organize related components in feature folders
10. **Export from index**: Create index files that export all components from a folder

## Examples

### Shared UI Component

```tsx
// src/frontend/components/ui/button.tsx
import React from 'react';
import { cn } from '../../utils/classNames';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Button component with various variants and sizes
 */
export function Button({
  className,
  variant = 'default',
  size = 'md',
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'button-base',
        // Variant classes
        variant === 'primary' && 'bg-primary text-primary-foreground',
        // Size classes
        size === 'sm' && 'px-3 py-1 text-sm',
        className
      )}
      {...props}
    />
  );
}
```

### Feature-Specific Component

```tsx
// src/frontend/features/playlists/components/PlaylistCard.tsx
import React from 'react';
import { Playlist } from '../../../../shared/types/appTypes';
import { CachedImage } from '../../../components/common/CachedImage';
import { formatDate } from '../../../utils/formatting';

interface PlaylistCardProps {
  playlist: Playlist;
  onClick?: () => void;
}

/**
 * Card component for displaying a playlist
 */
export function PlaylistCard({ playlist, onClick }: PlaylistCardProps) {
  return (
    <div
      className="bg-card rounded-lg shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <CachedImage
        src={playlist.thumbnailUrl}
        alt={playlist.title}
        className="w-full aspect-video object-cover"
      />
      <div className="p-4">
        <h3 className="font-medium text-lg">{playlist.title}</h3>
        <p className="text-sm text-muted-foreground">
          {playlist.videoCount} videos • Updated {formatDate(playlist.updatedAt)}
        </p>
      </div>
    </div>
  );
}
```

## Backward Compatibility

When refactoring existing components into a modular structure, maintain backward compatibility by keeping the original file and modifying it to re-export from the new structure:

```typescript
/**
 * This file is kept for backward compatibility.
 * It re-exports the component from the new modular structure.
 */

import { ImportProgressBar } from './ImportProgress/ImportProgressBar';

export default ImportProgressBar;
```

## Testing

Each component should have its own test file that verifies its functionality. Tests should be organized in a structure that mirrors the source code:

```
tests/
  └── frontend/
      └── features/
          └── ComponentName/
              ├── index.test.tsx
              ├── SubComponent.test.tsx
              └── ... (other test files)
```

Example test file structure for the ImportProgress component:

```
tests/
  └── frontend/
      └── components/
          └── ImportProgress/
              ├── ImportProgressBar.test.tsx
              └── useImportProgress.test.ts
```

## Benefits of This Structure

1. **Improved Code Organization**: Each file has a clear, focused responsibility
2. **Better Maintainability**: Smaller files are easier to understand and modify
3. **Enhanced Collaboration**: Multiple developers can work on different aspects of a feature
4. **Easier Testing**: Each module can be tested independently
5. **Better Code Navigation**: It's easier to find specific functionality
6. **Reduced Cognitive Load**: Developers can focus on one aspect of a component at a time
7. **Improved Reusability**: Smaller components can be reused in other parts of the application