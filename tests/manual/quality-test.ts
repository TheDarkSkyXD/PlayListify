import { downloadVideo } from '../../src/backend/services/ytDlp';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';

// Known 1080p video (YouTube's "Introducing YouTube Premium" video)
const VIDEO_ID = 'uqZGsy3Ae_w';
const VIDEO_URL = `https://www.youtube.com/watch?v=${VIDEO_ID}`;

// Test quality
const QUALITY = '1080p';

async function testQualityDownload() {
  console.log(`\n=== Testing video download with quality: ${QUALITY} ===`);

  // Create temp directory for this test
  const tempDir = path.join(os.tmpdir(), `quality-test-${QUALITY}`);
  await fs.ensureDir(tempDir);

  try {
    console.log(`Downloading video with quality: ${QUALITY}`);

    const outputPath = await downloadVideo(
      VIDEO_URL,
      tempDir,
      VIDEO_ID,
      {
        format: 'mp4',
        quality: QUALITY
      }
    );

    console.log(`Download completed successfully: ${outputPath}`);

    // Check if file exists
    const exists = await fs.pathExists(outputPath);
    if (!exists) {
      throw new Error(`File does not exist: ${outputPath}`);
    }

    // Get file size
    const stats = await fs.stat(outputPath);
    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    console.log(`File size: ${fileSizeMB} MB`);

    console.log(`✅ Test passed: Successfully downloaded video with ${QUALITY} quality`);
    console.log(`File saved at: ${outputPath}`);
  } catch (error: any) {
    console.error(`❌ Test failed: Error downloading video with ${QUALITY} quality:`, error);
    throw error; // Re-throw to indicate test failure
  }
}

async function runTest() {
  console.log('Starting quality download test...');

  try {
    await testQualityDownload();
    console.log('\n=== Test Summary ===');
    console.log(`✅ Successfully downloaded video with ${QUALITY} quality`);
  } catch (error) {
    console.log('\n=== Test Summary ===');
    console.log(`❌ Failed to download video with ${QUALITY} quality`);
    process.exit(1); // Exit with error code
  }
}

runTest().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
