# UI Icons

This directory contains UI icons used throughout the application interface.

## Organization

- Use lucide-react for most UI icons
- Custom SVG icons should be placed here when lucide-react doesn't have suitable options
- Icons should be optimized SVGs with consistent sizing
- Follow naming convention: `icon-name.svg`

## Usage

```typescript
// For custom SVG icons
import CustomIcon from '@/assets/icons/ui/custom-icon.svg';

// For lucide-react icons (preferred)
import { Play, Pause, Download } from 'lucide-react';
```