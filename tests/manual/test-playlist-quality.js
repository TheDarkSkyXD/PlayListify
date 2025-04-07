const { downloadVideo } = require('../../src/backend/services/ytDlp/video/download');
const { getPlaylistInfo } = require('../../src/backend/services/ytDlp/playlist/info');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);

// A playlist with known 1080p videos (YouTube Music's "Top 100 Music Videos Global" playlist)
const PLAYLIST_ID = 'PL4fGSI1pDJn6jXS_Tv_N9B8Z0HTRVJE0m';
const PLAYLIST_URL = `https://www.youtube.com/playlist?list=${PLAYLIST_ID}`;

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

async function testPlaylistQuality() {
  console.log(`\n=== Testing playlist video quality: ${QUALITY} ===`);

  // Create temp directory for this test
  const tempDir = path.join(os.tmpdir(), `playlist-quality-test-${QUALITY}`);
  await fs.ensureDir(tempDir);

  try {
    // Get playlist info to get the first video
    console.log('Getting playlist info...');
    const playlistInfo = await getPlaylistInfo(PLAYLIST_URL);

    if (!playlistInfo || !playlistInfo.videos || playlistInfo.videos.length === 0) {
      console.error('Failed to get playlist info or playlist has no videos');
      return;
    }

    // Get the first video from the playlist
    const firstVideo = playlistInfo.videos[0];
    console.log(`Testing with first video: "${firstVideo.title}" (${firstVideo.id})`);

    // Download the video
    console.log(`Downloading video with quality: ${QUALITY}`);
    const outputPath = await downloadVideo(
      firstVideo.url,
      tempDir,
      firstVideo.id,
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
    console.error(`Error testing playlist quality:`, error);
  }
}

testPlaylistQuality().catch(console.error);
