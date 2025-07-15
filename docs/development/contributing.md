# Contributing Guidelines

Thank you for your interest in contributing to Playlistify! This document provides guidelines for contributing to the project.

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help maintain a positive environment

## Development Workflow

1. **Fork and Clone**
   ```bash
   git clone <your-fork-url>
   cd playlistify
   ```

2. **Create Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make Changes**
   - Follow coding standards
   - Add tests for new functionality
   - Update documentation as needed

4. **Test Your Changes**
   ```bash
   npm run test
   npm run lint
   npm run type-check
   ```

5. **Commit Changes**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

6. **Push and Create PR**
   ```bash
   git push origin feature/your-feature-name
   ```

## Commit Message Format

Use conventional commits format:

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Code style changes
- `refactor:` - Code refactoring
- `test:` - Test additions or changes
- `chore:` - Build process or auxiliary tool changes

## Code Standards

- Use TypeScript for all new code
- Follow ESLint and Prettier configurations
- Write unit tests for new functionality
- Update documentation for API changes
- Use meaningful variable and function names

## Pull Request Guidelines

- Provide clear description of changes
- Include screenshots for UI changes
- Ensure all tests pass
- Keep PRs focused and atomic
- Request review from maintainers

## Testing

- Write unit tests for new functions
- Add integration tests for new features
- Ensure existing tests still pass
- Aim for good test coverage

## Documentation

- Update README if needed
- Document new APIs and interfaces
- Include code examples
- Keep documentation current with code changes