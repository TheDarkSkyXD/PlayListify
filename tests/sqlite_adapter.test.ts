import { SQLiteAdapter } from '../src/sqlite_adapter';
import { ArgumentException, DatabaseConnectionError, SchemaExecutionError } from '../src/exceptions';
import fs from 'fs';
import sqlite3 from 'sqlite3';

jest.mock('fs');
jest.mock('sqlite3');

const mockSqlite3 = sqlite3 as jest.Mocked<typeof sqlite3>;

describe('SQLiteAdapter', () => {
    const dbPath = './test.db';
    const schemaPath = './schema.sql';
    const schemaContent = 'CREATE TABLE test (id INTEGER PRIMARY KEY, name TEXT);';

    let mockDb: {
        prepare: jest.Mock;
        close: jest.Mock;
        run: jest.Mock;
    };

    beforeEach(() => {
        jest.useFakeTimers();
        (fs.readFileSync as jest.Mock).mockReturnValue(schemaContent);
        
        mockDb = {
            prepare: jest.fn().mockReturnThis(),
            close: jest.fn((callback) => callback(null)),
            run: jest.fn((sql, callback) => {
                if (callback) callback(null)
            }),
        };

        (mockSqlite3.Database as any as jest.Mock).mockImplementation((path, callback) => {
            if (path === 'fail_connection') {
                callback(new Error('Connection failed'));
            } else {
                callback(null);
            }
            return mockDb;
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
        jest.useRealTimers();
    });

    describe('constructor', () => {
        it('FR.1.1: should throw ArgumentException if dbPath is null or empty', () => {
            expect(() => new SQLiteAdapter('')).toThrow(ArgumentException);
            expect(() => new SQLiteAdapter(null as any)).toThrow(ArgumentException);
        });

        it('FR.1.2: should throw ArgumentException for invalid dbPath characters', () => {
            expect(() => new SQLiteAdapter('a:b*c?d"e<f>g|h')).toThrow(ArgumentException);
        });

        it('FR.2.1: should assign dbPath correctly', () => {
            const adapter = new SQLiteAdapter(dbPath);
            expect(adapter.dbPath).toBe(dbPath);
        });

        it('FR.2.2: should assign schemaPath or use default', () => {
            const adapterWithSchema = new SQLiteAdapter(dbPath, schemaPath);
            expect(adapterWithSchema.schemaPath).toBe(schemaPath);
            const adapterDefault = new SQLiteAdapter(dbPath);
            expect(adapterDefault.schemaPath).toBe('schema/database_schema.sql');
        });
        
        it('FR.2.3: should assign maxRetries or use default', () => {
            const adapterWithRetries = new SQLiteAdapter(dbPath, schemaPath, 10);
            expect(adapterWithRetries.maxRetries).toBe(10);
            const adapterDefault = new SQLiteAdapter(dbPath, schemaPath);
            expect(adapterDefault.maxRetries).toBe(5);
        });

        it('FR.2.4: should assign retryIntervalMs or use default', () => {
            const adapterWithInterval = new SQLiteAdapter(dbPath, schemaPath, 5, 2000);
            expect(adapterWithInterval.retryIntervalMs).toBe(2000);
            const adapterDefault = new SQLiteAdapter(dbPath, schemaPath);
            expect(adapterDefault.retryIntervalMs).toBe(1000);
        });

        it('FR.3.1 & FR.3.2: should connect to the database and set isConnected to true', () => {
            const adapter = new SQLiteAdapter(dbPath);
            expect(mockSqlite3.Database).toHaveBeenCalledWith(dbPath, expect.any(Function));
            expect(adapter.isConnected).toBe(true);
        });

        it('FR.3.3: should throw DatabaseConnectionError if connection fails after max retries', () => {
             (mockSqlite3.Database as any as jest.Mock).mockImplementation((path, callback) => {
                callback(new Error('Connection failed'));
             });
             expect(() => new SQLiteAdapter(dbPath)).toThrow(DatabaseConnectionError);
        });

        it('FR.4.1-FR.4.4: should apply schema successfully within a transaction', () => {
            new SQLiteAdapter(dbPath, schemaPath);
            expect(fs.readFileSync).toHaveBeenCalledWith(schemaPath, 'utf8');
            expect(mockDb.run).toHaveBeenCalledWith('BEGIN TRANSACTION');
            expect(mockDb.run).toHaveBeenCalledWith(schemaContent);
            expect(mockDb.run).toHaveBeenCalledWith('COMMIT');
        });

        it('FR.4.3 & FR.4.5: should throw SchemaExecutionError and rollback transaction on schema failure', () => {
            const error = new Error('SQL error');
            (mockDb.run as jest.Mock).mockImplementation((sql, callback) => {
                if (sql === schemaContent && callback) {
                    callback(error);
                }
                 if (callback) {
                    callback(null)
                }
            });
            expect(() => new SQLiteAdapter(dbPath, schemaPath)).toThrow(SchemaExecutionError);
            expect(mockDb.run).toHaveBeenCalledWith('BEGIN TRANSACTION');
            expect(mockDb.run).toHaveBeenCalledWith(schemaContent);
            expect(mockDb.run).toHaveBeenCalledWith('ROLLBACK');
            expect(mockDb.run).not.toHaveBeenCalledWith('COMMIT');
        });
        
        it('FR.5.1-FR.5.3: should set up a connection check timer', () => {
            const adapter = new SQLiteAdapter(dbPath);
            expect(setInterval).toHaveBeenCalledWith(expect.any(Function), 5000);
            adapter.close();
        });
    });

    describe('query', () => {
        let adapter: SQLiteAdapter;

        beforeEach(() => {
            adapter = new SQLiteAdapter(dbPath, schemaPath);
        });

        afterEach(async () => {
            await adapter.close();
        });

        it('FR.6.1: should throw ArgumentException for null or empty SQL', async () => {
            await expect(adapter.query(null as any, [])).rejects.toThrow(ArgumentException);
            await expect(adapter.query('', [])).rejects.toThrow(ArgumentException);
        });

        it('FR.7.1-FR.7.3: should use parameterized queries to prevent SQL injection', async () => {
            const statement = {
                bind: jest.fn(),
                all: jest.fn((callback) => callback(null, [])),
                finalize: jest.fn(),
            };
            (mockDb.prepare as jest.Mock).mockReturnValue(statement);
            await adapter.query('SELECT * FROM test WHERE id = ?', [1]);
            expect(mockDb.prepare).toHaveBeenCalledWith('SELECT * FROM test WHERE id = ?');
            expect(statement.bind).toHaveBeenCalledWith(1);
            expect(statement.all).toHaveBeenCalled();
        });

        it('FR.9.1-FR.9.3: should execute query and return processed result', async () => {
            const result = [{ id: 1, name: 'test' }];
            const statement = {
                bind: jest.fn(),
                all: jest.fn((callback) => callback(null, result)),
                finalize: jest.fn(),
            };
            (mockDb.prepare as jest.Mock).mockReturnValue(statement);
            const queryResult = await adapter.query('SELECT * FROM test', []);
            expect(queryResult).toEqual(result);
        });

        it('FR.10.2: should throw QueryExecutionError on execution failure', async () => {
            const error = new Error('Query failed');
            const statement = {
                bind: jest.fn(),
                all: jest.fn((callback) => callback(error, null)),
                finalize: jest.fn(),
            };
            (mockDb.prepare as jest.Mock).mockReturnValue(statement);
            await expect(adapter.query('SELECT * FROM test', [])).rejects.toThrow(error);
        });
        
        it('FR.11.1: should finalize statement after query execution', async () => {
            const statement = {
                bind: jest.fn(),
                all: jest.fn((callback) => callback(null, [])),
                finalize: jest.fn(),
            };
            (mockDb.prepare as jest.Mock).mockReturnValue(statement);
            await adapter.query('SELECT * FROM test', []);
            expect(statement.finalize).toHaveBeenCalled();
        });

        it('EC.11: should reject with an error for invalid parameter types', async () => {
            const error = new TypeError("SQLite doesn't support objects");
             const statement = {
                bind: jest.fn().mockImplementation(()=>{
                    throw error;
                }),
                all: jest.fn((callback) => callback(null, [])),
                finalize: jest.fn(),
            };
            (mockDb.prepare as jest.Mock).mockReturnValue(statement);
            await expect(adapter.query('SELECT * FROM test WHERE data = ?', [{}])).rejects.toThrow(error);
        });
    });

    describe('close', () => {
        it('should close the database connection and clear the interval', async () => {
            const adapter = new SQLiteAdapter(dbPath);
            await adapter.close();
            expect(mockDb.close).toHaveBeenCalled();
            expect(clearInterval).toHaveBeenCalled();
            expect(adapter.isConnected).toBe(false);
        });

        it('should reject with DatabaseConnectionError if closing fails', async () => {
            const error = new Error('Close failed');
            (mockDb.close as jest.Mock).mockImplementation((callback) => {
                callback(error);
            });
            const adapter = new SQLiteAdapter(dbPath);
            await expect(adapter.close()).rejects.toThrow(DatabaseConnectionError);
        });
    });
});
