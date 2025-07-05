# Race Condition Diagnosis & Remediation Plan

**ID:** RACE-CONDITION-2025-07-05-1
**Severity:** Medium
**Date:** 2025-07-05

## 1. Summary

A race condition vulnerability has been identified in the `BackgroundTaskService`. The non-atomic nature of task state updates can lead to data inconsistencies when multiple operations, such as `updateTaskStatus` and `updateTaskProgress`, are executed concurrently on the same task. This report provides an analysis of the root cause, a detailed remediation plan, and a new test case to verify the fix.

## 2. Vulnerability Analysis

### 2.1. Root Cause

The root cause of the race condition lies within the `updateTaskStatus` and `updateTaskProgress` methods in [`src/services/background_task_service.ts`](src/services/background_task_service.ts:1). These methods follow a "read-modify-write" pattern that is not atomic:

1.  **Read:** The current task data is fetched from the database (`await this.getTask(taskId)`).
2.  **Modify:** The in-memory task object is modified (e.g., changing the `status` or `progress`).
3.  **Write:** The modified data is written back to the database (`await this.repository.update(...)`).

If two concurrent requests execute these methods on the same task, the following scenario can occur:

-   **Thread A** reads Task 1 (`status: 'QUEUED'`).
-   **Thread B** reads Task 1 (`status: 'QUEUED'`).
-   **Thread A** updates the status to `'IN_PROGRESS'` and writes it to the database.
-   **Thread B**, unaware of the change made by Thread A, performs its own logic and writes its potentially stale data to the database, overwriting the changes made by Thread A.

### 2.2. Affected Code

The primary locations of the race condition are:

-   [`src/services/background_task_service.ts:69-103`](src/services/background_task_service.ts:69) (`updateTaskStatus` method)
-   [`src/services/background_task_service.ts:105-133`](src/services/background_task_service.ts:105) (`updateTaskProgress` method)

## 3. Remediation Plan

To resolve the race condition, all read-modify-write operations must be performed within a single atomic database transaction. This ensures that the operations are isolated and that the data remains consistent.

### 3.1. Step 1: Expose Transactional Logic in `SQLiteAdapter`

A `transaction` method needs to be added to the [`src/adapters/sqlite-adapter.ts`](src/adapters/sqlite-adapter.ts:1) to manage database transactions.

```typescript
// src/adapters/sqlite-adapter.ts

// ... existing code ...
    public transaction(action: (adapter: SQLiteAdapter) => Promise<T>): Promise<T> {
        return new Promise((resolve, reject) => {
            this.db.serialize(() => {
                this.db.run('BEGIN TRANSACTION');

                action(this)
                    .then(result => {
                        this.db.run('COMMIT', (err) => {
                            if (err) {
                                this.db.run('ROLLBACK');
                                reject(new DatabaseError(`Commit failed: ${err.message}`));
                            } else {
                                resolve(result);
                            }
                        });
                    })
                    .catch(error => {
                        this.db.run('ROLLBACK', () => {
                            reject(error); 
                        });
                    });
            });
        });
    }
// ... existing code ...
```

### 3.2. Step 2: Update `BackgroundTaskRepository` to Support Transactions

The repository methods must be able to accept an optional `SQLiteAdapter` instance to use within a transaction.

```typescript
// src/repositories/background-task-repository.ts

// ... existing code ...
    async getById(id: number, adapter?: SQLiteAdapter): Promise<BackgroundTask | null> {
        const db = adapter || this.adapter;
        // ... use db instead of this.adapter
    }
    
    async update(id: number, updates: Partial<BackgroundTask>, adapter?: SQLiteAdapter): Promise<boolean> {
        const db = adapter || this.adapter;
        // ... use db instead of this.adapter
    }
// ... existing code ...
```

### 3.3. Step 3: Refactor `BackgroundTaskService` to Use Transactions

The `updateTaskStatus` and `updateTaskProgress` methods will be refactored to use the new transaction mechanism.

```typescript
// src/services/background_task_service.ts

// ... existing code ...
    async updateTaskStatus(taskId: number, status: BackgroundTaskStatus): Promise<boolean> {
        return this.repository.adapter.transaction(async (tx) => {
            const task = await this.repository.getById(taskId, tx);
            // ... all logic inside the transaction
            // ... using the 'tx' adapter for all repository calls
            await this.repository.update(taskId, { status }, tx);
            // ...
            return true;
        });
    }

    async updateTaskProgress(taskId: number, progress: number): Promise<boolean> {
        return this.repository.adapter.transaction(async (tx) => {
            // ... all logic inside the transaction
            // ... using the 'tx' adapter for all repository calls
            return true;
        });
    }
// ... existing code ...
```

## 4. New Test Case for Verification

A new test case will be added to [`tests/edge_cases/task_management_edge_cases.test.ts`](tests/edge_cases/task_management_edge_cases.test.ts:1) to simulate the race condition. This test will attempt to update the status and progress of a task concurrently.

```typescript
// tests/edge_cases/task_management_edge_cases.test.ts

it('should handle concurrent updates to the same task without race conditions', async () => {
    const task = await service.createTask({ title: 'Concurrent Test', task_type: 'DOWNLOAD_VIDEO' });
    
    // Simulate concurrent updates
    const promise1 = service.updateTaskProgress(task.id, 0.5);
    const promise2 = service.updateTaskStatus(task.id, 'IN_PROGRESS');

    await Promise.all([promise1, promise2]);

    const updatedTask = await service.getTask(task.id);
    expect(updatedTask.status).toBe('IN_PROGRESS');
    expect(updatedTask.progress).toBe(0.5);
});
```

Without the fix, this test is likely to fail intermittently. With the transactional fix, it should pass consistently.