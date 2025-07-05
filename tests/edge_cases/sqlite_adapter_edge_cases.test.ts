import { SQLiteAdapter } from '../../src/adapters/sqlite-adapter';
import { SchemaExecutionError } from '../../src/shared/errors';
import fs from 'fs';

jest.mock('fs');

// Mock the sqlite3 module to avoid native binding issues in the test environment
jest.mock('sqlite3', () => {
    const mockDb = {
        exec: jest.fn((_query, callback) => {
            // Simulate an error from an invalid schema
            callback(new Error('SQLITE_ERROR: near ")": syntax error'));
        }),
        close: jest.fn(),
    };
    return {
        Database: jest.fn(() => mockDb),
    };
});


describe('SQLiteAdapter Edge Cases', () => {
    const mockFs = fs as jest.Mocked<typeof fs>;
    
    it('EC.1: Should throw SchemaExecutionError if the schema file contains invalid SQL', (done) => {
        const invalidSchema = 'CREATE TABLE background_tasks (id INTEGER PRIMARY KEY, name TEXT,)';
        mockFs.existsSync.mockReturnValue(true);
        mockFs.readFileSync.mockReturnValue(invalidSchema);

        const adapter = new SQLiteAdapter(':memory:');

        adapter.initializeSchema((error) => {
            expect(error).not.toBeUndefined();
            expect(error).toBeInstanceOf(SchemaExecutionError);
            if (error) {
                expect(error.message).toContain('Failed to execute schema');
            }
            done();
        });
    });
});