export class ArgumentException extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ArgumentException';
    }
}

export class DatabaseConnectionError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'DatabaseConnectionError';
    }
}

export class SchemaExecutionError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'SchemaExecutionError';
    }
}