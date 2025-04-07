import { downloadVideo } from '../../src/backend/services/ytDlp';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';

// Known high-quality video (YouTube's "8K HDR 60FPS" demo video)
const VIDEO_ID = 'vX2vsvdq8nw';
const VIDEO_URL = `https://www.youtube.com/watch?v=${VIDEO_ID}`;

// Test quality options
const QUALITIES = ['1080p', 'best'] as const;
type Quality = typeof QUALITIES[number];

async function testQualityDownload(quality: Quality): Promise<void> {
  console.log(`\n=== Testing video download with quality: ${quality} ===`);

  // Create temp directory for this test
  const tempDir = path.join(os.tmpdir(), `quality-test-${quality}`);
  await fs.ensureDir(tempDir);

  try {
    console.log(`Downloading video with quality: ${quality}`);

    const outputPath = await downloadVideo(
      VIDEO_URL,
      tempDir,
      VIDEO_ID,
      {
        format: 'mp4',
        quality: quality
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

    console.log(`✅ Test passed: Successfully downloaded video with ${quality} quality`);
    console.log(`File saved at: ${outputPath}`);
  } catch (error: any) {
    console.error(`❌ Test failed: Error downloading video with ${quality} quality:`, error);
    throw error; // Re-throw to indicate test failure
  }
}

async function runTests() {
  console.log('Starting quality comparison tests...');

  let allPassed = true;
  const results: { quality: Quality; passed: boolean }[] = [];

  for (const quality of QUALITIES) {
    try {
      await testQualityDownload(quality);
      results.push({ quality, passed: true });
    } catch (error) {
      results.push({ quality, passed: false });
      allPassed = false;
    }
  }

  console.log('\n=== Test Summary ===');
  for (const result of results) {
    if (result.passed) {
      console.log(`✅ Successfully downloaded video with ${result.quality} quality`);
    } else {
      console.log(`❌ Failed to download video with ${result.quality} quality`);
    }
  }

  if (!allPassed) {
    process.exit(1); // Exit with error code if any test failed
  }
}

runTests().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
