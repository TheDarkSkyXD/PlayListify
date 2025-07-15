import { EventEmitter } from 'events';
import { BackgroundTaskRepository } from '../repositories/background-task-repository';
import { BackgroundTask, BackgroundTaskStatus } from '../shared/data-models';
export declare class BackgroundTaskService extends EventEmitter {
    private repository;
    private unfinishedTasks;
    constructor(repository: BackgroundTaskRepository);
    private validateTaskInput;
    private handleParentTaskSync;
    createTask(taskInput: Partial<BackgroundTask>): Promise<BackgroundTask>;
    updateTaskStatus(taskId: number, status: BackgroundTaskStatus): boolean;
    updateTaskProgress(taskId: number, progress: number): boolean;
    getTask(taskId: number): Promise<BackgroundTask | null>;
    resumeUnfinishedTasks(): Promise<void>;
    getUnfinishedTasks(): BackgroundTask[];
    updateTaskParent(taskId: number, parentId: number): Promise<void>;
}
//# sourceMappingURL=background-task-service.d.ts.map