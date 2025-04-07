const { downloadVideo } = require('../../src/backend/services/ytDlp/video/download');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);

// Known 1080p video (YouTube's "Introducing YouTube Premium" video)
const VIDEO_ID = 'uqZGsy3Ae_w';
const VIDEO_URL = `https://www.youtube.com/watch?v=${VIDEO_ID}`;

// Test quality
const QUALITY = '1080p';

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

async function testQuality() {
  console.log(`\n=== Testing quality: ${QUALITY} ===`);
  
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
    
    let expectedMinHeight = 1080; // We're testing 1080p
    
    if (height >= expectedMinHeight) {
      console.log(`✅ Quality test passed: Requested ${QUALITY}, got ${height}p resolution`);
    } else {
      console.log(`❌ Quality test failed: Requested ${QUALITY}, but got ${height}p resolution`);
    }
    
    // Don't delete the file so we can inspect it
    console.log(`File saved at: ${outputPath}`);
  } catch (error) {
    console.error(`Error testing quality ${QUALITY}:`, error);
  }
}

testQuality().catch(console.error);
