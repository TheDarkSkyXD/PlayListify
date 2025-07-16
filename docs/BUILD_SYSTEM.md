# Build System Configuration

This document outlines the build system configuration for Playlistify, including development and production workflows.

## Overview

The build system is based on:
- **Webpack 5** for module bundling and asset processing
- **TypeScript** for type-safe development
- **Electron Forge** for Electron application packaging
- **PostCSS + TailwindCSS** for styling
- **Babel** for JavaScript transpilation

## Development Workflow

### Starting Development Server

```bash
# Start development server with hot reloading
npm run dev

# Start with debug logging
npm run dev:debug

# Start production mode for testing
npm start:prod
```

### Development Features

- **Hot Module Replacement (HMR)** - Changes reflect instantly
- **Fast Refresh** - React components update without losing state
- **TypeScript Type Checking** - Real-time type validation
- **CSS Hot Reloading** - Styles update without page refresh
- **Source Maps** - Debug with original source code

### Development Scripts

```bash
# Type checking
npm run type-check          # One-time check
npm run type-check:watch    # Watch mode

# Code quality
npm run lint                # Fix linting issues
npm run lint:check         # Check without fixing
npm run format             # Format code
npm run format:check       # Check formatting

# Build watching
npm run build:watch        # Watch and rebuild on changes
```

## Production Build

### Build Process

```bash
# Full production build
npm run build

# Individual builds
npm run build:main         # Main process
npm run build:renderer     # Renderer process
npm run build:preload      # Preload script
npm run build:all          # All processes
```

### Build Optimizations

- **Code Splitting** - Separate vendor and application bundles
- **Tree Shaking** - Remove unused code
- **Minification** - Compress JavaScript and CSS
- **Asset Optimization** - Optimize images and fonts
- **Bundle Analysis** - Analyze bundle size and composition

### Bundle Analysis

```bash
# Analyze bundle composition
npm run analyze
```

This generates a visual report showing:
- Bundle sizes and dependencies
- Code splitting effectiveness
- Optimization opportunities

## Configuration Files

### Webpack Configurations

- `webpack.main.config.js` - Main process configuration
- `webpack.renderer.config.js` - Renderer process configuration
- `webpack.preload.config.js` - Preload script configuration
- `webpack.rules.js` - Shared webpack rules
- `webpack.analyzer.config.js` - Bundle analysis configuration

### Build Tools

- `forge.config.js` - Electron Forge configuration
- `tsconfig.json` - TypeScript configuration
- `babel.config.js` - Babel transpilation
- `postcss.config.js` - PostCSS and TailwindCSS
- `tailwind.config.js` - TailwindCSS theme and utilities

### Environment Configuration

- `.env.development` - Development environment variables
- `.env.production` - Production environment variables

## Path Mapping

The build system supports TypeScript path mapping for clean imports:

```typescript
// Instead of relative imports
import { Button } from '../../../components/ui/Button'

// Use path mapping
import { Button } from '@/components/ui/Button'
```

Available path mappings:
- `@/*` → `src/*`
- `@/components/*` → `src/components/*`
- `@/services/*` → `src/services/*`
- `@/utils/*` → `src/utils/*`
- `@/types/*` → `src/types/*`
- `@/shared/*` → `src/shared/*`
- `@/lib/*` → `src/lib/*`
- `@/frontend/*` → `src/frontend/*`
- `@/backend/*` → `src/backend/*`

## Asset Processing

### Supported File Types

- **TypeScript/JavaScript** - `.ts`, `.tsx`, `.js`, `.jsx`
- **Stylesheets** - `.css`, `.scss`, `.sass`
- **Images** - `.png`, `.jpg`, `.jpeg`, `.gif`, `.svg`, `.ico`
- **Fonts** - `.woff`, `.woff2`, `.eot`, `.ttf`, `.otf`
- **Media** - `.mp3`, `.mp4`, `.wav`, `.ogg`, `.webm`
- **Data** - `.json`, `.txt`, `.md`

### Asset Optimization

- Images under 8KB are inlined as data URLs
- Larger assets are processed with content hashing
- Fonts and media files are optimized for web delivery

## Performance Optimization

### Development

- **Filesystem Caching** - Faster subsequent builds
- **Transpile Only** - Skip type checking during development
- **Async Type Checking** - Non-blocking type validation
- **Hot Module Replacement** - Update modules without full reload

### Production

- **Code Splitting** - Separate vendor and app bundles
- **Chunk Optimization** - Optimal bundle sizes
- **CSS Minification** - Compressed stylesheets
- **Asset Compression** - Optimized images and fonts

## Troubleshooting

### Common Issues

1. **Build Failures**
   ```bash
   # Clear cache and rebuild
   npm run clean
   npm run clean:cache
   npm install
   npm run build
   ```

2. **Type Errors**
   ```bash
   # Check TypeScript configuration
   npm run type-check
   ```

3. **Styling Issues**
   ```bash
   # Verify PostCSS and TailwindCSS setup
   npm run build:renderer
   ```

### Debug Mode

Enable debug logging for detailed build information:

```bash
# Development with debug logging
npm run dev:debug

# Set specific debug namespaces
DEBUG=webpack:* npm run dev
```

## Maintenance

### Updating Dependencies

```bash
# Update all dependencies
npm update

# Rebuild native modules after updates
npm run postinstall
```

### Cache Management

```bash
# Clear build caches
npm run clean:cache

# Full clean (removes all build artifacts)
npm run clean
```

## Integration with Electron Forge

The build system integrates seamlessly with Electron Forge for:
- Development server with hot reloading
- Production packaging and distribution
- Native module handling
- Platform-specific builds

For more information on packaging and distribution, see the Electron Forge documentation.