"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchemaExecutionError = exports.DatabaseConnectionError = exports.ArgumentException = void 0;
class ArgumentException extends Error {
    constructor(message) {
        super(message);
        this.name = 'ArgumentException';
    }
}
exports.ArgumentException = ArgumentException;
class DatabaseConnectionError extends Error {
    constructor(message) {
        super(message);
        this.name = 'DatabaseConnectionError';
    }
}
exports.DatabaseConnectionError = DatabaseConnectionError;
class SchemaExecutionError extends Error {
    constructor(message) {
        super(message);
        this.name = 'SchemaExecutionError';
    }
}
exports.SchemaExecutionError = SchemaExecutionError;
//# sourceMappingURL=exceptions.js.map