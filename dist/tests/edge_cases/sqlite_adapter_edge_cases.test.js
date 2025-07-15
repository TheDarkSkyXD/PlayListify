"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const sqlite_adapter_1 = require("../../src/adapters/sqlite-adapter");
const errors_1 = require("../../src/shared/errors");
const fs_1 = tslib_1.__importDefault(require("fs"));
const better_sqlite3_1 = tslib_1.__importDefault(require("better-sqlite3"));
jest.mock('fs');
jest.mock('better-sqlite3');
const mockDatabase = better_sqlite3_1.default;
describe('SQLiteAdapter Edge Cases', () => {
    const mockFs = fs_1.default;
    let mockDb;
    let mockPrepare;
    let mockRun;
    let mockAll;
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
        const adapter = new sqlite_adapter_1.SQLiteAdapter(':memory:');
        expect(() => adapter.initializeSchema()).toThrow(errors_1.SchemaExecutionError);
    });
    it('EC.2: Should retry and succeed on transient SQLITE_BUSY error', async () => {
        const busyError = new Error('SQLITE_BUSY: database is locked');
        const successResult = { changes: 1, lastInsertRowid: 1 };
        mockRun
            .mockImplementationOnce(() => { throw busyError; })
            .mockImplementationOnce(() => { throw busyError; })
            .mockReturnValueOnce(successResult);
        const adapter = new sqlite_adapter_1.SQLiteAdapter(':memory:');
        const result = await adapter.run('INSERT INTO test VALUES (?)', [1]);
        expect(result).toEqual(successResult);
        expect(mockRun).toHaveBeenCalledTimes(3);
    });
    it('EC.3: Should fail after max retries for persistent SQLITE_LOCKED error', async () => {
        const lockedError = new Error('SQLITE_LOCKED: database table is locked');
        mockAll.mockImplementation(() => {
            throw lockedError;
        });
        const adapter = new sqlite_adapter_1.SQLiteAdapter(':memory:');
        await expect(adapter.query('SELECT * FROM test')).rejects.toThrow(errors_1.DatabaseError);
        expect(mockAll).toHaveBeenCalledTimes(4); // 1 initial + 3 retries
    });
});
//# sourceMappingURL=sqlite_adapter_edge_cases.test.js.map