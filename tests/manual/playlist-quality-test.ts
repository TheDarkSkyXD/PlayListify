import { downloadVideo, getPlaylistInfo, getPlaylistVideos } from '../../src/backend/services/ytDlp';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';

// A playlist with known 1080p videos (YouTube Music's "Top 100 Music Videos Global" playlist)
const PLAYLIST_ID = 'PL4fGSI1pDJn6jXS_Tv_N9B8Z0HTRVJE0m';
const PLAYLIST_URL = `https://www.youtube.com/playlist?list=${PLAYLIST_ID}`;

// Test quality
const QUALITY = '1080p';

async function testPlaylistVideoDownload() {
  console.log(`\n=== Testing playlist video download with quality: ${QUALITY} ===`);

  // Create temp directory for this test
  const tempDir = path.join(os.tmpdir(), `playlist-quality-test-${QUALITY}`);
  await fs.ensureDir(tempDir);

  try {
    // Get playlist info
    console.log('Getting playlist info...');
    const playlistInfo = await getPlaylistInfo(PLAYLIST_URL);

    if (!playlistInfo) {
      throw new Error('Failed to get playlist info');
    }

    console.log(`Found playlist: "${playlistInfo.title}" with ${playlistInfo.videoCount} videos`);

    // Get videos from the playlist
    console.log('Getting playlist videos...');
    const videos = await getPlaylistVideos(PLAYLIST_URL);

    if (!videos || videos.length === 0) {
      throw new Error('Failed to get playlist videos or playlist has no videos');
    }

    // Get the first video from the playlist
    const firstVideo = videos[0];
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

    console.log(`✅ Test passed: Successfully downloaded playlist video with ${QUALITY} quality`);
    console.log(`File saved at: ${outputPath}`);
  } catch (error: any) {
    console.error(`❌ Test failed: Error downloading playlist video with ${QUALITY} quality:`, error);
    throw error; // Re-throw to indicate test failure
  }
}

async function runTest() {
  console.log('Starting playlist video download test...');

  try {
    await testPlaylistVideoDownload();
    console.log('\n=== Test Summary ===');
    console.log(`✅ Successfully downloaded playlist video with ${QUALITY} quality`);
  } catch (error) {
    console.log('\n=== Test Summary ===');
    console.log(`❌ Failed to download playlist video with ${QUALITY} quality`);
    process.exit(1); // Exit with error code
  }
}

runTest().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
