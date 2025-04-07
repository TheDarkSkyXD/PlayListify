const { downloadVideo } = require('../../src/backend/services/ytDlp/video/download');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);

// Known 1080p video (YouTube's "Introducing YouTube Premium" video)
const VIDEO_ID = 'uqZGsy3Ae_w';
const VIDEO_URL = `https://www.youtube.com/watch?v=${VIDEO_ID}`;

// Test different quality settings
const QUALITIES = ['360p', '720p', '1080p', 'best'];

async function getVideoResolution(filePath) {
  try {
    // Use ffprobe to get video resolution
    const { stdout } = await exec(`ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=s=x:p=0 "${filePath}"`);
    return stdout.trim();
  } catch (error) {
    console.error('Error getting video resolution:', error);
    return 'unknown';
  }
}

async function testQuality(quality) {
  console.log(`\n=== Testing quality: ${quality} ===`);
  
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
    
    console.log(`Download completed: ${outputPath}`);
    
    // Check if file exists
    const exists = await fs.pathExists(outputPath);
    if (!exists) {
      console.error(`File does not exist: ${outputPath}`);
      return;
    }
    
    // Get file size
    const stats = await fs.stat(outputPath);
    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    console.log(`File size: ${fileSizeMB} MB`);
    
    // Get video resolution
    const resolution = await getVideoResolution(outputPath);
    console.log(`Video resolution: ${resolution}`);
    
    // Analyze if the resolution matches the requested quality
    const [width, height] = resolution.split('x').map(Number);
    
    let expectedMinHeight = 0;
    if (quality === '360p') expectedMinHeight = 360;
    else if (quality === '480p') expectedMinHeight = 480;
    else if (quality === '720p') expectedMinHeight = 720;
    else if (quality === '1080p') expectedMinHeight = 1080;
    else if (quality === '1440p') expectedMinHeight = 1440;
    else if (quality === '2160p') expectedMinHeight = 2160;
    else if (quality === '4320p') expectedMinHeight = 4320;
    
    if (quality === 'best') {
      console.log(`✅ Quality test passed: 'best' quality selected, got ${height}p resolution`);
    } else if (height >= expectedMinHeight) {
      console.log(`✅ Quality test passed: Requested ${quality}, got ${height}p resolution`);
    } else {
      console.log(`❌ Quality test failed: Requested ${quality}, but got ${height}p resolution`);
    }
    
    return {
      quality,
      resolution,
      fileSizeMB,
      passed: quality === 'best' || height >= expectedMinHeight
    };
  } catch (error) {
    console.error(`Error testing quality ${quality}:`, error);
    return {
      quality,
      error: error.message,
      passed: false
    };
  } finally {
    // Clean up
    try {
      await fs.remove(tempDir);
    } catch (cleanupError) {
      console.error('Error cleaning up:', cleanupError);
    }
  }
}

async function runTests() {
  console.log('Starting quality tests...');
  
  const results = [];
  for (const quality of QUALITIES) {
    const result = await testQuality(quality);
    if (result) results.push(result);
  }
  
  console.log('\n=== Test Summary ===');
  for (const result of results) {
    if (result.passed) {
      console.log(`✅ ${result.quality}: ${result.resolution} (${result.fileSizeMB} MB)`);
    } else {
      console.log(`❌ ${result.quality}: ${result.error || 'Failed'}`);
    }
  }
}

runTests().catch(console.error);
