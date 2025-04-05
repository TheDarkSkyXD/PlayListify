import * as dbManager from '../services/databaseManager';
import { Playlist, Video } from '../../shared/types/appTypes';
import { app } from 'electron';
import { v4 as uuidv4 } from 'uuid';

/**
 * Test the database manager by performing CRUD operations
 */
async function testDatabaseManager() {
  console.log('=== Testing Database Manager ===');

  try {
    // Initialize the database
    console.log('Initializing database...');
    dbManager.initDatabase();

    // Test creating a playlist
    console.log('\nTesting playlist creation...');
    const playlistId = uuidv4();
    const currentDate = new Date().toISOString();

    const testPlaylist: Playlist = {
      id: playlistId,
      name: 'Test Playlist',
      description: 'A test playlist created by the database test script',
      videos: [],
      source: 'local',
      createdAt: currentDate,
      updatedAt: currentDate,
      tags: ['test', 'database']
    };

    dbManager.createPlaylist(testPlaylist);
    console.log('Playlist created successfully.');

    // Test retrieving the playlist
    console.log('\nTesting playlist retrieval...');
    const retrievedPlaylist = dbManager.getPlaylistById(playlistId);

    if (!retrievedPlaylist) {
      throw new Error('Failed to retrieve playlist');
    }

    console.log('Playlist retrieved successfully:');
    console.log(`- ID: ${retrievedPlaylist.id}`);
    console.log(`- Name: ${retrievedPlaylist.name}`);
    console.log(`- Description: ${retrievedPlaylist.description}`);
    console.log(`- Tags: ${retrievedPlaylist.tags?.join(', ')}`);

    // Test updating the playlist
    console.log('\nTesting playlist update...');
    const updatedPlaylist = dbManager.updatePlaylist(playlistId, {
      name: 'Updated Test Playlist',
      description: 'This playlist has been updated',
      tags: ['test', 'database', 'updated']
    });

    if (!updatedPlaylist) {
      throw new Error('Failed to update playlist');
    }

    console.log('Playlist updated successfully:');
    console.log(`- Name: ${updatedPlaylist.name}`);
    console.log(`- Description: ${updatedPlaylist.description}`);
    console.log(`- Tags: ${updatedPlaylist.tags?.join(', ')}`);

    // Test adding videos to the playlist
    console.log('\nTesting video addition...');
    const testVideos: Video[] = [
      {
        id: uuidv4(),
        title: 'Test Video 1',
        url: 'https://example.com/video1',
        downloaded: false,
        addedAt: currentDate
      },
      {
        id: uuidv4(),
        title: 'Test Video 2',
        url: 'https://example.com/video2',
        downloaded: true,
        downloadPath: '/path/to/video2.mp4',
        fileSize: 1024 * 1024 * 10, // 10MB
        format: 'mp4',
        addedAt: currentDate
      }
    ];

    for (const video of testVideos) {
      dbManager.addVideo(playlistId, video);
    }

    // Test retrieving the playlist with videos
    console.log('\nTesting playlist retrieval with videos...');
    const playlistWithVideos = dbManager.getPlaylistById(playlistId);

    if (!playlistWithVideos) {
      throw new Error('Failed to retrieve playlist with videos');
    }

    console.log('Playlist with videos retrieved successfully:');
    console.log(`- Video count: ${playlistWithVideos.videos?.length}`);

    if (playlistWithVideos.videos && playlistWithVideos.videos.length > 0) {
      console.log('- Videos:');
      playlistWithVideos.videos.forEach((video, index) => {
        console.log(`  ${index + 1}. ${video.title} (${video.downloaded ? 'Downloaded' : 'Not Downloaded'})`);
      });
    }

    // Test updating a video
    console.log('\nTesting video update...');
    if (playlistWithVideos.videos && playlistWithVideos.videos.length > 0) {
      const videoToUpdate = playlistWithVideos.videos[0];
      const updatedVideo = dbManager.updateVideo(videoToUpdate.id, {
        title: 'Updated Video Title',
        downloaded: true,
        downloadPath: '/path/to/updated/video.mp4',
        fileSize: 1024 * 1024 * 20 // 20MB
      });

      if (!updatedVideo) {
        throw new Error('Failed to update video');
      }

      console.log('Video updated successfully:');
      console.log(`- Title: ${updatedVideo.title}`);
      console.log(`- Downloaded: ${updatedVideo.downloaded}`);
      console.log(`- File Size: ${updatedVideo.fileSize} bytes`);
    }

    // Test searching for playlists
    console.log('\nTesting playlist search...');
    const searchResults = dbManager.searchPlaylists('test');

    console.log(`Found ${searchResults.length} playlists matching 'test':`);
    searchResults.forEach((playlist, index) => {
      console.log(`${index + 1}. ${playlist.name} (${playlist.videos?.length || 0} videos)`);
    });

    // Test getting database stats
    console.log('\nTesting database statistics...');
    const stats = dbManager.getDatabaseStats();

    console.log('Database statistics:');
    console.log(`- Playlist count: ${stats.playlistCount}`);
    console.log(`- Video count: ${stats.videoCount}`);
    console.log(`- Downloaded video count: ${stats.downloadedVideoCount}`);
    console.log(`- Total video size: ${(stats.totalVideoSize / (1024 * 1024)).toFixed(2)} MB`);

    // Test deleting a video
    console.log('\nTesting video deletion...');
    if (playlistWithVideos.videos && playlistWithVideos.videos.length > 1) {
      const videoToDelete = playlistWithVideos.videos[1];
      const deleted = dbManager.deleteVideo(videoToDelete.id, playlistId);

      console.log(`Video deletion ${deleted ? 'successful' : 'failed'}`);

      // Verify video was deleted
      const playlistAfterDeletion = dbManager.getPlaylistById(playlistId);
      console.log(`Playlist now has ${playlistAfterDeletion?.videos?.length || 0} videos`);
    }

    // Test deleting the playlist
    console.log('\nTesting playlist deletion...');
    const deleted = dbManager.deletePlaylist(playlistId);

    console.log(`Playlist deletion ${deleted ? 'successful' : 'failed'}`);

    // Verify playlist was deleted
    const deletedPlaylist = dbManager.getPlaylistById(playlistId);
    console.log(`Playlist retrieval after deletion: ${deletedPlaylist ? 'Still exists' : 'Successfully deleted'}`);

    // Close the database
    dbManager.closeDatabase();

    console.log('\n=== Database Manager Test Completed Successfully ===');
  } catch (error: any) {
    console.error('Test failed:', error);

    // Close the database
    try {
      dbManager.closeDatabase();
    } catch (e) {
      // Ignore
    }

    throw error;
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  // Wait for app to be ready
  if (app.isReady()) {
    testDatabaseManager()
      .then(() => {
        console.log('Test completed successfully.');
        process.exit(0);
      })
      .catch((error) => {
        console.error('Test failed:', error);
        process.exit(1);
      });
  } else {
    app.on('ready', () => {
      testDatabaseManager()
        .then(() => {
          console.log('Test completed successfully.');
          process.exit(0);
        })
        .catch((error) => {
          console.error('Test failed:', error);
          process.exit(1);
        });
    });
  }
}

export { testDatabaseManager };
