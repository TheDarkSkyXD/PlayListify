# Pseudocode: SQLiteAdapter.constructor

This document outlines the pseudocode for the `constructor` of the `SQLiteAdapter` class.

## 1. Function Signature

```
CONSTRUCTOR(dbPath: string, schemaPath?: string, maxRetries?: integer, retryIntervalMs?: integer)
```

## 2. Class Properties

- `db`: Database connection object.
- `dbPath`: Path to the database file.
- `isConnected`: Boolean flag indicating connection status.
- `schemaPath`: Path to the schema file.
- `maxRetries`: Maximum number of connection retry attempts.
- `retryIntervalMs`: Time in milliseconds between retry attempts.

## 3. Pseudocode

```
CLASS SQLiteAdapter

  -- Properties
  PROPERTY db
  PROPERTY dbPath
  PROPERTY isConnected
  PROPERTY schemaPath
  PROPERTY maxRetries
  PROPERTY retryIntervalMs

  -- Constructor
  CONSTRUCTOR(dbPath: string, schemaPath?: string, maxRetries?: integer, retryIntervalMs?: integer)
    
    -- Step 1: Initialization & Default Values
    LOG("SQLiteAdapter: Initializing...", "INFO")
    this.dbPath = dbPath
    this.schemaPath = schemaPath OR "schema/database_schema.sql"
    this.maxRetries = maxRetries OR 5
    this.retryIntervalMs = retryIntervalMs OR 1000
    this.db = NULL
    this.isConnected = FALSE
    
    -- Step 2: Input Validation
    LOG("Validating constructor arguments.", "INFO")
    IF dbPath IS NULL OR dbPath IS EMPTY
      THROW NEW ArgumentException("Database path (dbPath) cannot be null or empty.")
    END IF

    IF IS_VALID_PATH(dbPath) IS FALSE
      THROW NEW ArgumentException("The provided dbPath is not a valid path: " + dbPath)
    END IF

    -- Step 3: Connection and Schema Application Logic
    TRY
      -- Step 3a: Database Connection with Retry Logic
      LOOP retries FROM 0 TO this.maxRetries - 1
        TRY
          LOG("Attempting to connect to database. Attempt " + (retries + 1) + " of " + this.maxRetries, "INFO")
          this.db = CONNECT_TO_DATABASE(this.dbPath)
          this.isConnected = TRUE
          LOG("Database connection successful to: " + this.dbPath, "INFO")
          BREAK LOOP -- Exit loop on successful connection
        CATCH ConnectionError as e
          LOG("Connection attempt " + (retries + 1) + " failed: " + e.message, "WARN")
          
          IF retries >= this.maxRetries - 1
            LOG("All connection retries failed for database: " + this.dbPath, "ERROR")
            THROW NEW DatabaseConnectionError("Failed to connect to the database after " + this.maxRetries + " attempts.")
          END IF

          -- Wait before the next retry
          wait_time = CALCULATE_BACKOFF_TIME(retries, this.retryIntervalMs)
          LOG("Waiting " + wait_time + "ms before next retry.", "INFO")
          MANAGE_TIMER(NULL, "wait", NULL, wait_time)
        END TRY
      END LOOP

      -- Step 3b: Schema Application
      IF this.isConnected IS TRUE AND this.schemaPath IS NOT NULL
        LOG("Applying database schema from: " + this.schemaPath, "INFO")
        TRY
          schemaSQL = READ_FILE(this.schemaPath)
          EXECUTE_SQL(this.db, schemaSQL)
          LOG("Schema applied successfully.", "INFO")
        CATCH FileReadError as e
          LOG("Failed to read schema file: " + e.message, "ERROR")
          THROW NEW SchemaExecutionError("Failed to read schema file at path: " + this.schemaPath)
        CATCH SQLExecutionError as e
          LOG("Failed to execute schema SQL: " + e.message, "ERROR")
          THROW NEW SchemaExecutionError("Failed to execute schema from file: " + this.schemaPath + ". Check for invalid SQL.")
        END TRY
      END IF

    CATCH Exception as main_error
      LOG("A critical error occurred during SQLiteAdapter initialization: " + main_error.message, "FATAL")
      this.isConnected = FALSE
      this.db = NULL
      -- Re-throw the original error to be handled by the caller
      THROW main_error
    END TRY

  END CONSTRUCTOR

END CLASS
