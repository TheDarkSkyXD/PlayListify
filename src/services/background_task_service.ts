// src/services/background_task-service.ts

import { EventEmitter } from 'events';
import { BackgroundTaskRepository } from '../repositories/background-task-repository';
import { BackgroundTask, BackgroundTaskStatus, BackgroundTaskType } from '../shared/data-models';
import {
    InvalidInputError,
    ParentTaskNotFoundError,
    InvalidStateTransitionError,
    TaskNotFoundError,
    CircularDependencyError,
} from '../shared/errors';

const VALID_TASK_TYPES: BackgroundTaskType[] = ['IMPORT_PLAYLIST', 'DOWNLOAD_VIDEO', 'REFRESH_PLAYLIST'];

export class BackgroundTaskService extends EventEmitter {
    private unfinishedTasks: Map<number, BackgroundTask> = new Map();

    constructor(private repository: BackgroundTaskRepository) {
        super();
    }

    private async validateTaskInput(taskInput: Partial<BackgroundTask>) {
        if (!taskInput.title || taskInput.title.trim().length === 0) {
            throw new InvalidInputError('Task title cannot be null or empty.');
        }
        if (!taskInput.task_type || !VALID_TASK_TYPES.includes(taskInput.task_type)) {
            throw new InvalidInputError(`Invalid task type: ${taskInput.task_type}`);
        }
        if (taskInput.parent_id) {
            const parent = await this.repository.getById(taskInput.parent_id);
            if (!parent) {
                throw new ParentTaskNotFoundError(`Parent task with id ${taskInput.parent_id} not found.`);
            }
        }
    }

    private async handleParentTask(parentId: number | undefined) {
        if (parentId === undefined) return;

        const childTasks = await this.repository.getChildTasks(parentId);
        if (childTasks.length === 0) return;

        const totalChildren = childTasks.length;
        const finishedChildren = childTasks.filter(t => ['COMPLETED', 'FAILED', 'CANCELLED', 'COMPLETED_WITH_ERRORS'].includes(t.status));
        
        const progress = finishedChildren.length / totalChildren;
        await this.updateTaskProgress(parentId, progress);

        if (finishedChildren.length === totalChildren) {
            const hasFailures = childTasks.some(t => t.status === 'FAILED' || t.status === 'CANCELLED' || t.status === 'COMPLETED_WITH_ERRORS');
            const newStatus = hasFailures ? 'COMPLETED_WITH_ERRORS' : 'COMPLETED';
            await this.updateTaskStatus(parentId, newStatus);
        }
    }

    async createTask(taskInput: Partial<BackgroundTask>): Promise<BackgroundTask> {
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

    async updateTaskStatus(taskId: number, status: BackgroundTaskStatus): Promise<boolean> {
        const task = await this.getTask(taskId);
        if (!task) {
            throw new TaskNotFoundError(`Task with id ${taskId} not found.`);
        }

        const validTransitions: { [key in BackgroundTaskStatus]?: BackgroundTaskStatus[] } = {
            QUEUED: ['IN_PROGRESS', 'CANCELLED', 'FAILED', 'COMPLETED'],
            IN_PROGRESS: ['COMPLETED', 'FAILED', 'CANCELLED', 'COMPLETED_WITH_ERRORS'],
            COMPLETED: [],
            FAILED: [],
            CANCELLED: [],
            COMPLETED_WITH_ERRORS: []
        };

        const allowedNextStates = validTransitions[task.status];
        if (!allowedNextStates || !allowedNextStates.includes(status)) {
            throw new InvalidStateTransitionError(`Cannot transition task from ${task.status} to ${status}.`);
        }

        const updated = await this.repository.update(taskId, { status });
        if (updated) {
            const updatedTask = await this.repository.getById(taskId);
            if(updatedTask){
                if (updatedTask.status !== 'IN_PROGRESS' && updatedTask.status !== 'QUEUED') {
                    this.unfinishedTasks.delete(taskId);
                } else {
                    this.unfinishedTasks.set(taskId, updatedTask);
                }
                this.emit('task-update', updatedTask);
                await this.handleParentTask(updatedTask.parent_id);
            }
        }
        return updated;
    }

    async updateTaskProgress(taskId: number, progress: number): Promise<boolean> {
        if (isNaN(progress) || progress < 0 || progress > 1) {
            throw new InvalidInputError('Progress must be a number between 0 and 1.');
        }

        const task = await this.getTask(taskId);
        if (!task) {
            throw new TaskNotFoundError(`Task with id ${taskId} not found.`);
        }

        if (task.status !== 'IN_PROGRESS' && task.status !== 'QUEUED' && progress < 1) {
            throw new InvalidStateTransitionError(`Cannot update progress for task with status ${task.status}.`);
        }
        
        if (task.status === 'QUEUED' && progress > 0 && progress < 1) {
            await this.updateTaskStatus(taskId, 'IN_PROGRESS');
        }

        const updated = await this.repository.update(taskId, { progress });
        if (updated) {
            const updatedTask = await this.repository.getById(taskId);
            if (updatedTask) {
                this.unfinishedTasks.set(taskId, updatedTask);
                this.emit('task-update', updatedTask);
                await this.handleParentTask(updatedTask.parent_id);
            }
        }
        return updated;
    }

    async getTask(taskId: number): Promise<BackgroundTask | null> {
        if (this.unfinishedTasks.has(taskId)) {
            return this.unfinishedTasks.get(taskId)!;
        }
        const task = await this.repository.getById(taskId);
        if(task && (task.status === 'QUEUED' || task.status === 'IN_PROGRESS')){
            this.unfinishedTasks.set(task.id, task);
        }
        return task;
    }

    async resumeUnfinishedTasks(): Promise<void> {
        const tasks = await this.repository.getUnfinishedTasks();
        this.unfinishedTasks.clear();
        for (const task of tasks) {
            this.unfinishedTasks.set(task.id, task);
        }
    }

    async getUnfinishedTasks(): Promise<BackgroundTask[]> {
        return Array.from(this.unfinishedTasks.values());
    }

    async updateTaskParent(taskId: number, parentId: number): Promise<void> {
        if (taskId === parentId) {
            throw new CircularDependencyError('A task cannot be its own parent.');
        }
        const task = await this.getTask(taskId);
        if (!task) {
            throw new TaskNotFoundError(`Task with id ${taskId} not found.`);
        }
        const parentTask = await this.getTask(parentId);
        if (!parentTask) {
            throw new ParentTaskNotFoundError(`Parent task with id ${parentId} not found.`);
        }

        let current: BackgroundTask | null = parentTask;
        while (current) {
            if (current.id === taskId) {
                throw new CircularDependencyError('Circular dependency detected.');
            }
            current = current.parent_id ? await this.getTask(current.parent_id) : null;
        }

        await this.repository.update(taskId, { parent_id: parentId });
    }
}