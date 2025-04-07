/**
 * This script tests the SQLite database manager
 */

import { app } from 'electron';

// Wait for Electron app to be ready
if (app) {
  app.whenReady().then(async () => {
    try {
      console.log('Starting database manager test...');

      // Import the test script
      const { testDatabaseManager } = require('../../.webpack/main/backend/scripts/testDatabaseManager');

      // Run the test
      await testDatabaseManager();

      console.log('Test completed successfully.');
      process.exit(0);
    } catch (error) {
      console.error('Test failed:', error);
      process.exit(1);
    }
  });
} else {
  console.error('Electron app not available. This script must be run in an Electron context.');
  process.exit(1);
}
