"use strict";
// src/services/background-task-service.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.BackgroundTaskService = void 0;
const events_1 = require("events");
const errors_1 = require("../shared/errors");
const VALID_TASK_TYPES = ['IMPORT_PLAYLIST', 'DOWNLOAD_VIDEO', 'REFRESH_PLAYLIST'];
class BackgroundTaskService extends events_1.EventEmitter {
    constructor(repository) {
        super();
        this.repository = repository;
        this.unfinishedTasks = new Map();
    }
    async validateTaskInput(taskInput) {
        if (!taskInput.title || taskInput.title.trim().length === 0) {
            throw new errors_1.InvalidInputError('Task title cannot be null or empty.');
        }
        if (!taskInput.task_type || !VALID_TASK_TYPES.includes(taskInput.task_type)) {
            throw new errors_1.InvalidInputError(`Invalid task type: ${taskInput.task_type}`);
        }
        if (taskInput.parent_id) {
            const parent = await this.repository.getById(taskInput.parent_id);
            if (!parent) {
                throw new errors_1.ParentTaskNotFoundError(`Parent task with id ${taskInput.parent_id} not found.`);
            }
        }
    }
    handleParentTaskSync(parentId) {
        if (parentId === undefined)
            return;
        const childTasks = this.repository.getChildTasksSync(parentId);
        if (childTasks.length === 0)
            return;
        const totalChildren = childTasks.length;
        const finishedChildren = childTasks.filter(t => ['COMPLETED', 'FAILED', 'CANCELLED', 'COMPLETED_WITH_ERRORS'].includes(t.status));
        const progress = finishedChildren.length / totalChildren;
        this.repository.updateSync(parentId, { progress });
        if (finishedChildren.length === totalChildren) {
            const hasFailures = childTasks.some(t => t.status === 'FAILED' || t.status === 'CANCELLED' || t.status === 'COMPLETED_WITH_ERRORS');
            const newStatus = hasFailures ? 'COMPLETED_WITH_ERRORS' : 'COMPLETED';
            this.repository.updateSync(parentId, { status: newStatus });
        }
    }
    async createTask(taskInput) {
        await this.validateTaskInput(taskInput);
        const createdTask = await this.repository.create({
            ...taskInput,
            status: 'QUEUED',
            progress: 0.0,
        });
        this.unfinishedTasks.set(createdTask.id, createdTask);
        this.emit('task-update', createdTask);
        return createdTask;
    }
    updateTaskStatus(taskId, status) {
        return this.repository.adapter.transaction(() => {
            const task = this.repository.getByIdSync(taskId);
            if (!task) {
                throw new errors_1.TaskNotFoundError(`Task with id ${taskId} not found.`);
            }
            if (task.status === status) {
                return true;
            }
            const validTransitions = {
                QUEUED: ['IN_PROGRESS', 'CANCELLED', 'FAILED', 'COMPLETED'],
                IN_PROGRESS: ['COMPLETED', 'FAILED', 'CANCELLED', 'COMPLETED_WITH_ERRORS'],
                COMPLETED: [],
                FAILED: [],
                CANCELLED: [],
                COMPLETED_WITH_ERRORS: []
            };
            const allowedNextStates = validTransitions[task.status];
            if (!allowedNextStates || !allowedNextStates.includes(status)) {
                throw new errors_1.InvalidStateTransitionError(`Cannot transition task from ${task.status} to ${status}.`);
            }
            const updatedTask = this.repository.updateSync(taskId, { status });
            if (updatedTask) {
                if (updatedTask.status !== 'IN_PROGRESS' && updatedTask.status !== 'QUEUED') {
                    this.unfinishedTasks.delete(taskId);
                }
                else {
                    this.unfinishedTasks.set(taskId, updatedTask);
                }
                this.emit('task-update', updatedTask);
                this.handleParentTaskSync(updatedTask.parent_id);
                return true;
            }
            return false;
        });
    }
    updateTaskProgress(taskId, progress) {
        if (isNaN(progress) || progress < 0 || progress > 1) {
            throw new errors_1.InvalidInputError('Progress must be a number between 0 and 1.');
        }
        return this.repository.adapter.transaction(() => {
            let task = this.repository.getByIdSync(taskId);
            if (!task) {
                throw new errors_1.TaskNotFoundError(`Task with id ${taskId} not found.`);
            }
            if (task.status !== 'IN_PROGRESS' && task.status !== 'QUEUED' && progress < 1) {
                throw new errors_1.InvalidStateTransitionError(`Cannot update progress for task with status ${task.status}.`);
            }
            if (task.status === 'QUEUED' && progress > 0 && progress < 1) {
                const updatedTaskResult = this.repository.updateSync(taskId, { status: 'IN_PROGRESS' });
                if (!updatedTaskResult) {
                    throw new errors_1.TaskNotFoundError(`Task with id ${taskId} not found after status update.`);
                }
                task = updatedTaskResult;
            }
            const updatedTask = this.repository.updateSync(taskId, { progress });
            if (updatedTask) {
                this.unfinishedTasks.set(taskId, updatedTask);
                this.emit('task-update', updatedTask);
                this.handleParentTaskSync(updatedTask.parent_id);
                return true;
            }
            return false;
        });
    }
    async getTask(taskId) {
        if (this.unfinishedTasks.has(taskId)) {
            return this.unfinishedTasks.get(taskId);
        }
        const task = await this.repository.getById(taskId);
        if (task && (task.status === 'QUEUED' || task.status === 'IN_PROGRESS')) {
            this.unfinishedTasks.set(task.id, task);
        }
        return task;
    }
    async resumeUnfinishedTasks() {
        const tasks = await this.repository.getUnfinishedTasks();
        this.unfinishedTasks.clear();
        for (const task of tasks) {
            this.unfinishedTasks.set(task.id, task);
        }
    }
    getUnfinishedTasks() {
        return Array.from(this.unfinishedTasks.values());
    }
    async updateTaskParent(taskId, parentId) {
        if (taskId === parentId) {
            throw new errors_1.CircularDependencyError('A task cannot be its own parent.');
        }
        const task = await this.getTask(taskId);
        if (!task) {
            throw new errors_1.TaskNotFoundError(`Task with id ${taskId} not found.`);
        }
        const parentTask = await this.getTask(parentId);
        if (!parentTask) {
            throw new errors_1.ParentTaskNotFoundError(`Parent task with id ${parentId} not found.`);
        }
        let current = parentTask;
        while (current) {
            if (current.id === taskId) {
                throw new errors_1.CircularDependencyError('Circular dependency detected.');
            }
            current = current.parent_id ? await this.getTask(current.parent_id) : null;
        }
        await this.repository.update(taskId, { parent_id: parentId });
    }
}
exports.BackgroundTaskService = BackgroundTaskService;
//# sourceMappingURL=background-task-service.js.map