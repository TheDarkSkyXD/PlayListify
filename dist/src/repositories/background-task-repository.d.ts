import { BackgroundTask } from '../shared/data-models';
import { SQLiteAdapter } from '../adapters/sqlite-adapter';
export declare class BackgroundTaskRepository {
    adapter: SQLiteAdapter;
    constructor(adapter: SQLiteAdapter);
    private toTaskObject;
    create(task: Partial<BackgroundTask>, adapter?: SQLiteAdapter): Promise<BackgroundTask>;
    getById(id: number, adapter?: SQLiteAdapter): Promise<BackgroundTask | null>;
    getByIdSync(id: number, adapter?: SQLiteAdapter): BackgroundTask | null;
    getUnfinishedTasks(adapter?: SQLiteAdapter): Promise<BackgroundTask[]>;
    update(id: number, updates: Partial<BackgroundTask>, adapter?: SQLiteAdapter): Promise<BackgroundTask | null>;
    updateSync(id: number, updates: Partial<BackgroundTask>, adapter?: SQLiteAdapter): BackgroundTask | null;
    getChildTasks(parentId: number, adapter?: SQLiteAdapter): Promise<BackgroundTask[]>;
    getChildTasksSync(parentId: number, adapter?: SQLiteAdapter): BackgroundTask[];
}
//# sourceMappingURL=background-task-repository.d.ts.map