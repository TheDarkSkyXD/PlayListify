import { SQLiteAdapter } from '../../src/adapters/sqlite-adapter';
import { SchemaExecutionError, DatabaseError } from '../../src/shared/errors';
import fs from 'fs';
import Database from 'better-sqlite3';

jest.mock('fs');
jest.mock('better-sqlite3');

const mockDatabase = Database as jest.Mocked<any>;

describe('SQLiteAdapter Edge Cases', () => {
    const mockFs = fs as jest.Mocked<typeof fs>;
    let mockDb: any;
    let mockPrepare: any;
    let mockRun: any;
    let mockAll: any;

    beforeEach(() => {
        mockRun = jest.fn();
        mockAll = jest.fn();
        mockPrepare = jest.fn(() => ({
            run: mockRun,
            all: mockAll,
        }));
        mockDb = {
            exec: jest.fn(),
            pragma: jest.fn(),
            close: jest.fn(),
            prepare: mockPrepare,
        };
        mockDatabase.mockReturnValue(mockDb);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('EC.1: Should throw SchemaExecutionError if the schema file contains invalid SQL', () => {
        mockDb.exec.mockImplementation(() => {
            throw new Error('SQLITE_ERROR: near ")": syntax error');
        });

        const invalidSchema = 'CREATE TABLE background_tasks (id INTEGER PRIMARY KEY, name TEXT,)';
        mockFs.existsSync.mockReturnValue(true);
        mockFs.readFileSync.mockReturnValue(invalidSchema);

        const adapter = new SQLiteAdapter(':memory:');

        expect(() => adapter.initializeSchema()).toThrow(SchemaExecutionError);
    });

    it('EC.2: Should retry and succeed on transient SQLITE_BUSY error', async () => {
        const busyError = new Error('SQLITE_BUSY: database is locked');
        const successResult = { changes: 1, lastInsertRowid: 1 };

        mockRun
            .mockImplementationOnce(() => { throw busyError; })
            .mockImplementationOnce(() => { throw busyError; })
            .mockReturnValueOnce(successResult);

        const adapter = new SQLiteAdapter(':memory:');
        const result = await adapter.run('INSERT INTO test VALUES (?)', [1]);

        expect(result).toEqual(successResult);
        expect(mockRun).toHaveBeenCalledTimes(3);
    });

    it('EC.3: Should fail after max retries for persistent SQLITE_LOCKED error', async () => {
        const lockedError = new Error('SQLITE_LOCKED: database table is locked');

        mockAll.mockImplementation(() => {
            throw lockedError;
        });

        const adapter = new SQLiteAdapter(':memory:');

        await expect(adapter.query('SELECT * FROM test')).rejects.toThrow(DatabaseError);
        expect(mockAll).toHaveBeenCalledTimes(4); // 1 initial + 3 retries
    });
});