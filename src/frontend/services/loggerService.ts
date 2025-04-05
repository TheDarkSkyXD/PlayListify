import { ipcRenderer } from 'electron';

/**
 * Service for interacting with the logger in the main process
 */
export const loggerService = {
  /**
   * Get the path to the console log file
   */
  async getConsoleLogFilePath(): Promise<string> {
    return await ipcRenderer.invoke('logger:getConsoleLogFilePath');
  },

  /**
   * Read the console log file
   */
  async readConsoleLog(): Promise<string> {
    return await ipcRenderer.invoke('logger:readConsoleLog');
  },

  /**
   * Clear the console log file
   */
  async clearConsoleLog(): Promise<boolean> {
    return await ipcRenderer.invoke('logger:clearConsoleLog');
  },

  /**
   * Open the console log file in the default text editor
   */
  async openConsoleLogFile(): Promise<void> {
    const filePath = await this.getConsoleLogFilePath();
    window.open(`file://${filePath}`, '_blank');
  }
};
