"use strict";
// tests/setup.ts
/**
 * Jest Test Setup
 *
 * This file runs before each test file and sets up global test configuration.
 */
// Mock console methods to reduce noise during testing
global.console = {
    ...console,
    // Uncomment to suppress console.log during tests
    // log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
};
// Set up global test timeout
jest.setTimeout(10000);
// Mock Date.now for consistent timestamps in tests
const mockDate = new Date('2025-01-01T00:00:00.000Z');
global.Date.now = jest.fn(() => mockDate.getTime());
// Clean up after each test
afterEach(() => {
    jest.clearAllMocks();
});
//# sourceMappingURL=setup.js.map