# Playlistify

A powerful YouTube playlist manager and downloader built with Electron, React, and TypeScript. Take control of your YouTube content with features like playlist management, video downloading, offline playback, and health checking.

## Features

- 🎵 **Playlist Management**: Import and organize YouTube playlists
- 📥 **Video Downloads**: Download videos for offline viewing with yt-dlp
- 🔍 **Smart Search**: Search within playlists and across your library
- ⚡ **Background Tasks**: Efficient background processing for downloads
- 🏥 **Health Monitoring**: Check playlist integrity and video availability
- 🎨 **Modern UI**: Clean, responsive interface with dark/light themes
- 🔒 **Secure**: Sandboxed architecture with secure IPC communication

## Tech Stack

### Frontend
- **React** 19.1.0 - Modern UI framework
- **TypeScript** 5.5.3 - Type-safe development
- **TailwindCSS** 3.4.1 - Utility-first styling
- **shadcn/ui** - High-quality component library
- **TanStack Router** - Type-safe routing
- **TanStack React Query** - Server state management
- **Zustand** - Client state management

### Backend
- **Electron** 36.4.0 - Cross-platform desktop framework
- **Node.js** - JavaScript runtime
- **better-sqlite3** 11.10.0 - Fast SQLite database
- **yt-dlp-wrap** 2.3.12 - YouTube video downloading
- **fluent-ffmpeg** 2.1.3 - Video processing

### Development
- **Webpack** - Module bundling
- **Electron Forge** - Build and packaging
- **Jest** - Unit testing
- **Playwright** - End-to-end testing
- **ESLint** & **Prettier** - Code quality

## Quick Start

### Prerequisites

- **Node.js** 18.x or higher
- **npm** 8.x or higher
- **Git** latest version

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd playlistify

# Install dependencies
npm install

# Start development server
npm run dev
```

### Development Scripts

```bash
npm run dev          # Start development with hot reload
npm run build        # Build for production
npm run package      # Create distributable packages
npm test             # Run all tests
npm run test:watch   # Run tests in watch mode
npm run lint         # Run ESLint
npm run format       # Format code with Prettier
npm run type-check   # Run TypeScript type checking
```

## Project Structure

```
playlistify/
├── src/
│   ├── frontend/          # React application
│   │   ├── components/    # UI components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── pages/         # Route components
│   │   ├── stores/        # Zustand stores
│   │   └── styles/        # CSS and styling
│   ├── backend/           # Electron main process
│   │   ├── handlers/      # IPC handlers
│   │   ├── services/      # Business logic
│   │   └── utils/         # Backend utilities
│   ├── shared/            # Shared code
│   │   ├── types/         # TypeScript types
│   │   ├── constants/     # App constants
│   │   └── utils/         # Shared utilities
│   ├── main.ts           # Electron main process
│   ├── preload.ts        # Secure preload script
│   └── renderer.tsx      # React app entry
├── assets/               # Static assets
├── tests/                # Test files
├── docs/                 # Documentation
└── dist/                 # Build output
```

See [Project Structure](docs/PROJECT_STRUCTURE.md) for detailed information.

## Development

### Getting Started

1. **Setup Environment**: Follow the [Development Setup Guide](docs/development/setup.md)
2. **Coding Standards**: Review [Coding Standards](docs/development/coding-standards.md)
3. **Contributing**: Read [Contributing Guidelines](docs/development/contributing.md)
4. **Testing**: Check [Testing Guidelines](docs/development/testing.md)

### Key Features in Development

- **Phase 1**: Core infrastructure and project setup ✅
- **Phase 2**: Playlist management and UI
- **Phase 3**: Video downloading and processing
- **Phase 4**: Background tasks and health monitoring
- **Phase 5**: Advanced features and optimization

## Architecture

Playlistify follows a secure, multi-process architecture:

- **Main Process**: Handles system operations, file management, and external tools
- **Renderer Process**: Runs the React UI in a sandboxed environment
- **Preload Script**: Provides secure communication bridge between processes

Key architectural decisions:
- Context isolation for security
- Type-safe IPC communication
- Automated dependency management
- Modular service architecture

## Security

- **Process Isolation**: Frontend runs in sandboxed environment
- **Secure IPC**: All communication through contextBridge
- **Input Validation**: Comprehensive validation of all user inputs
- **File System Security**: Controlled file operations with path validation
- **Dependency Security**: Managed external tool installation

## Testing

Comprehensive testing strategy:
- **Unit Tests**: Individual components and functions
- **Integration Tests**: IPC communication and service interactions
- **End-to-End Tests**: Complete user workflows
- **Edge Case Tests**: Error conditions and boundary scenarios

```bash
npm test                    # Run all tests
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests only
npm run test:e2e          # End-to-end tests only
npm run test:coverage     # Generate coverage report
```

## Building and Distribution

```bash
# Development build
npm run build

# Create platform-specific packages
npm run package

# Platform-specific builds
npm run package:windows
npm run package:macos
npm run package:linux
```

## Documentation

- [Project Structure](docs/PROJECT_STRUCTURE.md) - Codebase organization
- [Development Setup](docs/development/setup.md) - Environment setup
- [API Documentation](docs/api/README.md) - API reference
- [Architecture Decisions](docs/architecture/README.md) - Technical decisions

## Contributing

We welcome contributions! Please read our [Contributing Guidelines](docs/development/contributing.md) before submitting pull requests.

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests and documentation
5. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- 📖 [Documentation](docs/README.md)
- 🐛 [Issue Tracker](https://github.com/your-repo/issues)
- 💬 [Discussions](https://github.com/your-repo/discussions)

---

Built with ❤️ using Electron, React, and TypeScript.