const { execSync } = require('child_process');

// Run database tests one by one with controlled execution
try {
  console.log('Running database tests with controlled execution...');

  // Run tests one by one
  const tests = [
    'tests/backend/services/databaseManager.simplified.test.ts',
    'tests/backend/utils/migrationUtils.simplified.test.ts'
  ];

  let allPassed = true;

  for (const test of tests) {
    console.log(`\nRunning test: ${test}`);
    try {
      execSync(`node --max-old-space-size=4096 node_modules/jest/bin/jest.js --runInBand ${test}`, {
        stdio: 'inherit',
        env: { ...process.env, NODE_OPTIONS: '--max-old-space-size=4096' }
      });
      console.log(`✅ Test passed: ${test}`);
    } catch (error) {
      console.error(`❌ Test failed: ${test} with exit code: ${error.status}`);
      allPassed = false;
      // Continue with next test even if this one fails
    }
  }

  if (!allPassed) {
    process.exit(1);
  }
} catch (error) {
  console.error('Script execution failed:', error);
  process.exit(1);
}
