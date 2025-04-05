# PlayListify Styling Guide

This document explains the styling approach used in the PlayListify application.

## Styling Structure

The application uses a combination of Tailwind CSS and custom CSS files:

```
src/renderer/styles/
├── global.css        # Global styles and Tailwind imports
├── variables.css     # CSS variables (colors, spacing, etc.)
├── animations.css    # Global animations
├── themes/           # Theme-specific styles
│   ├── light.css     # Light theme
│   └── dark.css      # Dark theme
└── README.md         # This file
```

## Styling Approach

### 1. Tailwind CSS

Tailwind CSS is the primary styling approach used in the application. It provides utility classes for most styling needs.

Example:
```jsx
<button className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90">
  Click Me
</button>
```

### 2. CSS Variables

CSS variables are defined in `variables.css` and provide a consistent set of values for colors, spacing, typography, etc.

Example:
```css
:root {
  --color-primary: #FF0000;
  --spacing-4: 1rem;
}
```

These variables can be used in both CSS and inline styles:

```jsx
// In CSS
.my-element {
  color: var(--color-primary);
  padding: var(--spacing-4);
}

// In inline styles
<div style={{ color: 'var(--color-primary)' }}>Text</div>
```

### 3. Theme Support

The application supports light and dark themes:

- Light theme styles are defined in `themes/light.css`
- Dark theme styles are defined in `themes/dark.css`

Theme switching is handled by adding a `dark` class to the `html` element.

### 4. Animations

Common animations are defined in `animations.css` and can be applied to elements as needed.

Example:
```jsx
<div className="animate-fade-in">This will fade in</div>
```

## Best Practices

1. **Use Tailwind classes first**: Prefer Tailwind utility classes for most styling needs
2. **Use CSS variables for consistency**: Use CSS variables for colors, spacing, etc.
3. **Keep component-specific styles close to components**: If a component needs complex styling, consider using CSS modules
4. **Support both light and dark themes**: Ensure all components look good in both light and dark modes
5. **Use semantic class names**: Use class names that describe the purpose, not the appearance
6. **Avoid inline styles**: Use Tailwind classes or CSS instead of inline styles when possible
7. **Use the `cn` utility**: Use the `cn` utility function to conditionally apply classes

## Utility Functions

### `cn` Function

The `cn` function (from `src/renderer/utils/classNames.ts`) is a utility for conditionally joining class names:

```jsx
import { cn } from '../../utils/classNames';

function Button({ className, variant, disabled }) {
  return (
    <button
      className={cn(
        'base-button',
        variant === 'primary' && 'bg-primary text-white',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      Click Me
    </button>
  );
}
```

## Theme Switching

Theme switching is handled in the `AppLayout` component. It toggles the `dark` class on the `html` element and stores the preference in localStorage.

## Adding New Styles

1. **For component-specific styles**: Add them directly to the component using Tailwind classes
2. **For shared styles**: Add them to the appropriate CSS file
3. **For new variables**: Add them to `variables.css`
4. **For new animations**: Add them to `animations.css`
5. **For theme-specific styles**: Add them to the appropriate theme file

## Example: Creating a New Component with Styles

```jsx
// src/renderer/components/ui/Card.tsx
import React from 'react';
import { cn } from '../../utils/classNames';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className }: CardProps) {
  return (
    <div
      className={cn(
        'bg-card text-card-foreground rounded-lg border border-border p-4 shadow-sm',
        className
      )}
    >
      {children}
    </div>
  );
}
```

This component uses Tailwind classes and CSS variables to create a consistent card component that works in both light and dark themes.
