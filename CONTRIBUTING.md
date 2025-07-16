# Contributing to Playlistify

Thank you for your interest in contributing to Playlistify! This document provides guidelines and information for contributors.

## Development Setup

### Prerequisites

- Node.js (v18 or higher)
- npm (v8 or higher)
- Git

### Getting Started

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd playlistify
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

## Development Workflow

### Code Quality

We maintain high code quality standards through automated tools:

- **ESLint**: Linting for JavaScript/TypeScript
- **Prettier**: Code formatting
- **TypeScript**: Type checking
- **Husky**: Git hooks for pre-commit checks

### Available Scripts

#### Development
- `npm run dev` - Start development server
- `npm run dev:debug` - Start with debug logging
- `npm run dev:clean` - Clean build and start development

#### Building
- `npm run build` - Build for production
- `npm run build:watch` - Build with file watching
- `npm run build:prod` - Clean build for production

#### Code Quality
- `npm run lint` - Run ESLint with auto-fix
- `npm run lint:check` - Run ESLint without fixing
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run type-check` - Run TypeScript type checking
- `npm run validate` - Run all quality checks

#### Testing
- `npm test` - Run unit tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage
- `npm run test:unit` - Run unit tests only
- `npm run test:integration` - Run integration tests
- `npm run test:acceptance` - Run end-to-end tests
- `npm run test:all` - Run all test suites

#### Maintenance
- `npm run clean` - Clean build artifacts
- `npm run deps:check` - Check for outdated dependencies
- `npm run security:audit` - Run security audit

### Code Style Guidelines

#### TypeScript/JavaScript
- Use TypeScript for all new code
- Follow the ESLint configuration
- Use meaningful variable and function names
- Add JSDoc comments for public APIs
- Prefer `const` over `let`, avoid `var`
- Use arrow functions for callbacks and short functions

#### React Components
- Use functional components with hooks
- Follow the component naming convention (PascalCase)
- Keep components small and focused
- Use TypeScript interfaces for props
- Implement proper error boundaries

#### File Organization
- Group related files in directories
- Use index files for clean imports
- Keep test files adjacent to source files
- Follow the established directory structure

### Git Workflow

#### Commit Messages
Follow conventional commit format:
```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Test changes
- `chore`: Build/tooling changes

Examples:
```
feat(playlist): add video search functionality
fix(ui): resolve navigation menu overflow issue
docs(readme): update installation instructions
```

#### Branch Naming
- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring

#### Pull Request Process
1. Create a feature branch from `main`
2. Make your changes following the style guidelines
3. Ensure all tests pass and code quality checks succeed
4. Update documentation if necessary
5. Submit a pull request with a clear description

### Pre-commit Hooks

The project uses Husky to run pre-commit hooks that:
- Run ESLint on staged files
- Format code with Prettier
- Ensure code quality standards

If the pre-commit hook fails, fix the issues before committing.

### Testing Guidelines

#### Unit Tests
- Write tests for all new functionality
- Use descriptive test names
- Follow the AAA pattern (Arrange, Act, Assert)
- Mock external dependencies
- Aim for high code coverage

#### Integration Tests
- Test component interactions
- Test IPC communication
- Test file system operations
- Test error handling scenarios

#### End-to-End Tests
- Test complete user workflows
- Use Playwright for browser automation
- Test critical user paths
- Include accessibility testing

### Performance Guidelines

- Optimize bundle size
- Use lazy loading for non-critical components
- Implement proper error boundaries
- Monitor memory usage
- Profile performance in development

### Security Guidelines

- Validate all user inputs
- Use secure IPC communication
- Implement proper file path validation
- Follow Electron security best practices
- Keep dependencies updated

### Documentation

- Update README.md for user-facing changes
- Add JSDoc comments for public APIs
- Update architecture documentation for significant changes
- Include examples in documentation

## Getting Help

- Check existing issues and discussions
- Review the documentation
- Ask questions in discussions
- Follow the code of conduct

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow
- Maintain a positive environment

Thank you for contributing to Playlistify!