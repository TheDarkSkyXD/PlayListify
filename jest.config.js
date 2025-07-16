// jest.config.js

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  transform: {
    '^.+\\.ts$': 'ts-jest',
    '^.+\\.tsx$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.spec.ts',
    '!src/**/*.test.ts',
    '!src/main.ts',
    '!src/preload.ts',
    '!src/renderer-router.tsx',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: [
    'text',
    'lcov',
    'html',
    'json-summary'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@shared/(.*)$': '<rootDir>/src/shared/$1',
    '^@backend/(.*)$': '<rootDir>/src/backend/$1',
    '^@frontend/(.*)$': '<rootDir>/src/frontend/$1',
    '^electron$': '<rootDir>/tests/mocks/electron.ts'
  },
  testTimeout: 10000,
  verbose: true,
  // Electron-specific configuration
  testEnvironmentOptions: {
    url: 'http://localhost'
  },
  // Ignore patterns for faster testing
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/.webpack/',
    '/coverage/',
    '/tests/acceptance/',
    '/tests/chaos/',
    '/tests/edge_cases/',
    '.*\\.spec\\.ts$'
  ],
  // Transform ignore patterns
  transformIgnorePatterns: [
    'node_modules/(?!(electron|@electron)/)'
  ],
  // Clear mocks between tests
  clearMocks: true,
  restoreMocks: true,
  resetMocks: true,
};