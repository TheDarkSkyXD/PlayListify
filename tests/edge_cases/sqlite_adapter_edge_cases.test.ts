import { SQLiteAdapter } from '../../src/adapters/sqlite-adapter';
import { SchemaExecutionError } from '../../src/shared/errors';
import sqlite3 from 'sqlite3';
import fs from 'fs';
import path from 'path';

describe('SQLiteAdapter Edge Cases', () => {
    let db: sqlite3.Database;
    const dbPath = ':memory:';
    const schemaPath = path.join(__dirname, '..', '..', 'schema', 'database_schema.sql');
    const invalidSchemaPath = path.join(__dirname, 'invalid_schema.sql');

    beforeEach(() => {
        db = new sqlite3.Database(dbPath);
    });

    afterEach((done) => {
        db.close((err) => {
            if (err) {
                console.error(err.message);
            }
            if (fs.existsSync(invalidSchemaPath)) {
                fs.unlinkSync(invalidSchemaPath);
            }
            done();
        });
    });

    it('EC.1: Should throw SchemaExecutionError if the schema file contains invalid SQL', (done) => {
        const invalidSchema = 'CREATE TABLE background_tasks (id INTEGER PRIMARY KEY, name TEXT,);';
        // Use a unique name for the invalid schema file to avoid conflicts between tests
        const invalidSchemaPath = path.join(__dirname, `invalid_schema_${Date.now()}.sql`);
        fs.writeFileSync(invalidSchemaPath, invalidSchema);

        const adapter = new SQLiteAdapter(db);

        // Mock the schema path to force the adapter to use our invalid schema
        Object.defineProperty(adapter, 'schemaPath', {
            get: () => invalidSchemaPath,
            configurable: true
        });

        adapter.initializeSchema((error) => {
            expect(error).toBeInstanceOf(SchemaExecutionError);
            if (error) {
                expect(error.message).toContain('Failed to execute schema');
            }
            fs.unlinkSync(invalidSchemaPath); // Clean up the invalid schema file
            done();
        });
    });
});