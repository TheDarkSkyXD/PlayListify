"use strict";
// src/adapters/sqlite-adapter.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.SQLiteAdapter = void 0;
const tslib_1 = require("tslib");
const better_sqlite3_1 = tslib_1.__importDefault(require("better-sqlite3"));
const fs_1 = tslib_1.__importDefault(require("fs"));
const errors_1 = require("../shared/errors");
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
class SQLiteAdapter {
    constructor(dbOrPath) {
        this.maxRetries = 3;
        this.retryDelay = 50;
        try {
            if (typeof dbOrPath === 'string') {
                this.db = new better_sqlite3_1.default(dbOrPath);
            }
            else {
                this.db = dbOrPath;
            }
            this.db.pragma('journal_mode = WAL');
        }
        catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            throw new errors_1.DatabaseConnectionError(`Failed to connect to database: ${message}`);
        }
    }
    initializeSchema() {
        const schemaPath = './schema/database_schema.sql';
        try {
            if (fs_1.default.existsSync(schemaPath)) {
                const schema = fs_1.default.readFileSync(schemaPath, 'utf8');
                this.db.exec(schema);
            }
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            throw new errors_1.SchemaExecutionError(`Failed to execute schema: ${message}`);
        }
    }
    async _executeWithRetries(operation) {
        let attempts = 0;
        while (true) {
            try {
                return operation();
            }
            catch (err) {
                const message = err instanceof Error ? err.message : String(err);
                if ((message.includes('SQLITE_BUSY') || message.includes('SQLITE_LOCKED')) && attempts < this.maxRetries) {
                    attempts++;
                    await delay(this.retryDelay);
                }
                else {
                    throw err;
                }
            }
        }
    }
    async query(sql, params = []) {
        const operation = () => this.db.prepare(sql).all(...params);
        return this._executeWithRetries(operation);
    }
    async run(sql, params = []) {
        const operation = () => this.db.prepare(sql).run(...params);
        return this._executeWithRetries(operation);
    }
    transaction(action) {
        if (this.db.inTransaction) {
            return action();
        }
        const transaction = this.db.transaction(action);
        return transaction();
    }
    close() {
        try {
            this.db.close();
        }
        catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            throw new errors_1.DatabaseConnectionError(`Failed to close database: ${message}`);
        }
    }
}
exports.SQLiteAdapter = SQLiteAdapter;
//# sourceMappingURL=sqlite-adapter.js.map