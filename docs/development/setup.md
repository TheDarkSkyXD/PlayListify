# Development Environment Setup

This guide will help you set up your development environment for Playlistify.

## Prerequisites

- **Node.js**: Version 18.x or higher
- **npm**: Version 8.x or higher
- **Git**: Latest version
- **VS Code**: Recommended IDE with extensions

## Required VS Code Extensions

- TypeScript and JavaScript Language Features
- ESLint
- Prettier - Code formatter
- Tailwind CSS IntelliSense
- Auto Rename Tag
- Bracket Pair Colorizer

## Installation Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd playlistify
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

## Development Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run test` - Run all tests
- `npm run test:watch` - Run tests in watch mode
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run type-check` - Run TypeScript type checking

## Debugging

### VS Code Debugging

1. Open VS Code
2. Go to Run and Debug (Ctrl+Shift+D)
3. Select "Launch Electron" configuration
4. Set breakpoints and start debugging

### Chrome DevTools

- Main process: Use VS Code debugger
- Renderer process: Open DevTools in the Electron window (Ctrl+Shift+I)

## Troubleshooting

### Common Issues

1. **Node modules issues**: Delete `node_modules` and run `npm install`
2. **TypeScript errors**: Run `npm run type-check` to see detailed errors
3. **Build failures**: Check that all dependencies are installed correctly

### Getting Help

- Check existing issues in the repository
- Review documentation in the `docs/` directory
- Ask questions in team chat or create an issue