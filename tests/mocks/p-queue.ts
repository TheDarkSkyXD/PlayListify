/**
 * Mock implementation of p-queue for testing
 */
class PQueue {
  private concurrency: number;
  private queue: Array<() => Promise<any>>;
  private running: number;
  private events: Record<string, Array<(...args: any[]) => void>>;

  constructor(options: { concurrency?: number } = {}) {
    this.concurrency = options.concurrency || 1;
    this.queue = [];
    this.running = 0;
    this.events = {};
  }

  add(fn: () => Promise<any>): Promise<any> {
    const promise = new Promise<any>((resolve, reject) => {
      this.queue.push(async () => {
        try {
          this.running++;
          const result = await fn();
          this.running--;
          resolve(result);
          this._processQueue();
          return result;
        } catch (error) {
          this.running--;
          reject(error);
          this._processQueue();
          throw error;
        }
      });
    });

    this._processQueue();
    return promise;
  }

  private _processQueue(): void {
    if (this.running < this.concurrency && this.queue.length > 0) {
      const task = this.queue.shift();
      if (task) {
        task();
      }
    }
  }

  on(event: string, callback: (...args: any[]) => void): void {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  }

  off(event: string, callback: (...args: any[]) => void): void {
    if (this.events[event]) {
      this.events[event] = this.events[event].filter(cb => cb !== callback);
    }
  }

  emit(event: string, ...args: any[]): void {
    if (this.events[event]) {
      this.events[event].forEach(callback => callback(...args));
    }
  }

  get size(): number {
    return this.queue.length;
  }

  get pending(): number {
    return this.running;
  }

  pause(): void {
    // Do nothing in the mock
  }

  resume(): void {
    // Do nothing in the mock
  }

  clear(): void {
    this.queue = [];
  }
}

export default PQueue;
