"use strict";
// src/shared/errors.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchemaExecutionError = exports.DatabaseConnectionError = exports.DiskFullError = exports.FileSystemReadOnlyError = exports.DatabaseError = exports.CircularDependencyError = exports.TaskNotFoundError = exports.InvalidStateTransitionError = exports.ParentTaskNotFoundError = exports.InvalidInputError = void 0;
class InvalidInputError extends Error {
    constructor(message) {
        super(message);
        this.name = 'InvalidInputError';
    }
}
exports.InvalidInputError = InvalidInputError;
class ParentTaskNotFoundError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ParentTaskNotFoundError';
    }
}
exports.ParentTaskNotFoundError = ParentTaskNotFoundError;
class InvalidStateTransitionError extends Error {
    constructor(message) {
        super(message);
        this.name = 'InvalidStateTransitionError';
    }
}
exports.InvalidStateTransitionError = InvalidStateTransitionError;
class TaskNotFoundError extends Error {
    constructor(message) {
        super(message);
        this.name = 'TaskNotFoundError';
    }
}
exports.TaskNotFoundError = TaskNotFoundError;
class CircularDependencyError extends Error {
    constructor(message) {
        super(message);
        this.name = 'CircularDependencyError';
    }
}
exports.CircularDependencyError = CircularDependencyError;
class DatabaseError extends Error {
    constructor(message) {
        super(message);
        this.name = 'DatabaseError';
    }
}
exports.DatabaseError = DatabaseError;
class FileSystemReadOnlyError extends Error {
    constructor(message) {
        super(message);
        this.name = 'FileSystemReadOnlyError';
    }
}
exports.FileSystemReadOnlyError = FileSystemReadOnlyError;
class DiskFullError extends Error {
    constructor(message) {
        super(message);
        this.name = 'DiskFullError';
    }
}
exports.DiskFullError = DiskFullError;
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
//# sourceMappingURL=errors.js.map