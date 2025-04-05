module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/tests'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.tsx?$',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  moduleNameMapper: {
    // Handle module aliases (if you're using them in your project)
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@backend/(.*)$': '<rootDir>/src/backend/$1',
    '^@frontend/(.*)$': '<rootDir>/src/frontend/$1',
    '^@shared/(.*)$': '<rootDir>/src/shared/$1',
    // Handle CSS imports (if you're using CSS modules)
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/frontend/preload/*.js',
    '!src/backend/preload-commonjs.js',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',
    },
  },
};
