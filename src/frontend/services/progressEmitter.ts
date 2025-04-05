/**
 * A simple event emitter for progress updates
 */

type ProgressListener = (data: ProgressData) => void;

export interface ProgressData {
  status: string;
  count: number;
  total: number;
}

class ProgressEmitter {
  private listeners: ProgressListener[] = [];
  private lastUpdate: ProgressData | null = null;

  constructor() {
    console.log('Initializing ProgressEmitter');

    // Set up the listener for progress updates from the main process
    if (window.api) {
      console.log('Setting up yt:importProgress listener in ProgressEmitter');

      // Set up the real listener
      window.api.receive('yt:importProgress', (data: any) => {
        console.log('Progress emitter received real update:', data);
        if (data && typeof data === 'object') {
          const progressData: ProgressData = {
            status: data.status || 'Processing...',
            count: typeof data.count === 'number' ? data.count : 0,
            total: typeof data.total === 'number' ? data.total : 0
          };

          // Store the last update
          this.lastUpdate = progressData;

          // Notify all listeners
          this.notifyListeners(progressData);
        }
      });

      console.log('Progress emitter initialized');
    } else {
      console.error('window.api not available for progress emitter');
    }
  }

  /**
   * Add a listener for progress updates
   */
  public addListener(listener: ProgressListener): () => void {
    this.listeners.push(listener);
    console.log(`Added progress listener, now have ${this.listeners.length} listeners`);

    // If we have a last update, send it to the new listener immediately
    if (this.lastUpdate) {
      listener(this.lastUpdate);
    }

    // Return a function to remove the listener
    return () => {
      this.removeListener(listener);
    };
  }

  /**
   * Remove a listener
   */
  public removeListener(listener: ProgressListener): void {
    const index = this.listeners.indexOf(listener);
    if (index !== -1) {
      this.listeners.splice(index, 1);
      console.log(`Removed progress listener, now have ${this.listeners.length} listeners`);
    }
  }

  /**
   * Notify all listeners of a progress update
   */
  private notifyListeners(data: ProgressData): void {
    console.log(`Notifying ${this.listeners.length} progress listeners`);
    this.listeners.forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        console.error('Error in progress listener:', error);
      }
    });
  }
}

// Create a singleton instance
export const progressEmitter = new ProgressEmitter();
