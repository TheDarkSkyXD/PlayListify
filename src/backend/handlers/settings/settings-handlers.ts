import { ipcMain } from 'electron';
import { SettingsService } from '../../services/settingsService';
import { createIPCHandler } from '../index';

// Initialize settings service
const settingsService = new SettingsService();

export function registerSettingsHandlers(): void {
  // Get a setting value
  ipcMain.handle(
    'settings:get',
    createIPCHandler(async (key: string) => {
      return settingsService.get(key as any);
    }),
  );

  // Set a setting value
  ipcMain.handle(
    'settings:set',
    createIPCHandler(async (key: string, value: any) => {
      settingsService.set(key as any, value);
      return { success: true };
    }),
  );

  // Get all settings
  ipcMain.handle(
    'settings:getAll',
    createIPCHandler(async () => {
      return settingsService.getAll();
    }),
  );

  // Reset settings to defaults
  ipcMain.handle(
    'settings:reset',
    createIPCHandler(async () => {
      settingsService.reset();
      return { success: true };
    }),
  );

  // Check if a setting has been customized
  ipcMain.handle(
    'settings:hasCustomValue',
    createIPCHandler(async (key: string) => {
      return settingsService.has(key as any);
    }),
  );

  // Get settings store path
  ipcMain.handle(
    'settings:getStorePath',
    createIPCHandler(async () => {
      return settingsService.getStorePath();
    }),
  );

  // Validate settings
  ipcMain.handle(
    'settings:validate',
    createIPCHandler(async () => {
      const validation = settingsService.validate();
      return validation.isValid;
    }),
  );

  // Export settings
  ipcMain.handle(
    'settings:export',
    createIPCHandler(async () => {
      const exportData = settingsService.export();
      return JSON.stringify(exportData);
    }),
  );

  // Import settings
  ipcMain.handle(
    'settings:import',
    createIPCHandler(async (jsonString: string) => {
      const importData = JSON.parse(jsonString);
      return settingsService.import(importData);
    }),
  );

  // Initialize download location (placeholder - will be implemented in later tasks)
  ipcMain.handle(
    'settings:initializeDownloadLocation',
    createIPCHandler(async () => {
      // Placeholder implementation
      return { success: true };
    }),
  );

  // Sanitize settings
  ipcMain.handle(
    'settings:sanitize',
    createIPCHandler(async () => {
      settingsService.sanitize();
      return { success: true };
    }),
  );

  // Create backup
  ipcMain.handle(
    'settings:createBackup',
    createIPCHandler(async () => {
      const backupPath = await settingsService.createBackup();
      return { backupPath };
    }),
  );

  // Restore from backup
  ipcMain.handle(
    'settings:restoreFromBackup',
    createIPCHandler(async (backupPath: string) => {
      await settingsService.restoreFromBackup(backupPath);
      return { success: true };
    }),
  );

  // Get settings version
  ipcMain.handle(
    'settings:getVersion',
    createIPCHandler(async () => {
      return settingsService.getVersion();
    }),
  );

  // Check if migration is needed
  ipcMain.handle(
    'settings:needsMigration',
    createIPCHandler(async (targetVersion: string) => {
      return settingsService.needsMigration(targetVersion);
    }),
  );

  // Migrate settings
  ipcMain.handle(
    'settings:migrate',
    createIPCHandler(async (targetVersion: string) => {
      await settingsService.migrate(targetVersion);
      return { success: true };
    }),
  );

  // List available backups
  ipcMain.handle(
    'settings:listBackups',
    createIPCHandler(async () => {
      return await settingsService.listBackups();
    }),
  );

  // Get detailed validation results
  ipcMain.handle(
    'settings:getValidationDetails',
    createIPCHandler(async () => {
      return settingsService.validate();
    }),
  );

  console.log('✅ Settings IPC handlers registered');
}
