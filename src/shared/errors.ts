// src/shared/errors.ts

export class InvalidInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidInputError';
  }
}

export class ParentTaskNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ParentTaskNotFoundError';
  }
}

export class InvalidStateTransitionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidStateTransitionError';
  }
}

export class TaskNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TaskNotFoundError';
  }
}

export class CircularDependencyError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'CircularDependencyError';
    }
}

export class DatabaseError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'DatabaseError';
    }
}

export class FileSystemReadOnlyError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'FileSystemReadOnlyError';
    }
}

export class DiskFullError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'DiskFullError';
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

// Dependency Management Errors
export class DependencyError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'DependencyError';
    }
}

export class DependencyInstallationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'DependencyInstallationError';
    }
}

export class DependencyValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'DependencyValidationError';
    }
}

export class DependencyDownloadError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'DependencyDownloadError';
    }
}
