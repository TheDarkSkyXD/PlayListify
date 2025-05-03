import { getDatabase } from '../database';
import { 
  Playlist, 
  createPlaylist, 
  getPlaylistById,
  updatePlaylistStats 
} from '../database/playlistQueries';
import { Video, createOrUpdateVideo } from '../database/videoQueries';
import { 
  addVideoToPlaylist, 
  getPlaylistVideos, 
  PlaylistVideoWithDetails 
} from '../database/playlistVideoQueries';
import logger from './logService';

// Export a playlist to JSON
export const exportPlaylistToJson = async (
  playlistId: number
): Promise<string> => {
  try {
    const db = await getDatabase();
    
    // Get playlist info
    const playlist = await getPlaylistById(db, playlistId);
    if (!playlist) {
      throw new Error(`Playlist with ID ${playlistId} not found`);
    }
    
    // Get playlist videos
    const videos = await getPlaylistVideos(db, playlistId);
    
    // Create export object
    const exportData = {
      playlist: {
        name: playlist.name,
        description: playlist.description,
        source: playlist.source,
        source_id: playlist.source_id,
        exported_at: new Date().toISOString()
      },
      videos: videos.map(v => ({
        video_id: v.video_external_id,
        title: v.title,
        thumbnail: v.thumbnail,
        duration_seconds: v.duration_seconds,
        author: v.author,
        position: v.position
      }))
    };
    
    return JSON.stringify(exportData, null, 2);
  } catch (error) {
    logger.error(`Failed to export playlist ID ${playlistId}:`, error);
    throw error;
  }
};

// Import a playlist from JSON
export const importPlaylistFromJson = async (
  jsonData: string
): Promise<number> => {
  try {
    const data = JSON.parse(jsonData);
    
    // Validate basic structure
    if (!data.playlist || !data.playlist.name || !Array.isArray(data.videos)) {
      throw new Error('Invalid playlist JSON format');
    }
    
    // Create the playlist
    const db = await getDatabase();
    const now = Math.floor(Date.now() / 1000);
    
    const playlist: Playlist = {
      name: data.playlist.name,
      description: data.playlist.description,
      source: 'custom',
      created_at: now,
      updated_at: now,
      video_count: 0,
      duration_seconds: 0
    };
    
    const playlistId = await createPlaylist(db, playlist);
    
    // Add videos to the playlist
    for (let i = 0; i < data.videos.length; i++) {
      const videoData = data.videos[i];
      
      // Create or update the video
      const video: Video = {
        video_id: videoData.video_id,
        title: videoData.title || 'Unknown Title',
        duration_seconds: videoData.duration_seconds,
        thumbnail: videoData.thumbnail,
        author: videoData.author,
        created_at: now,
        updated_at: now,
        download_status: 'not_downloaded'
      };
      
      const videoId = await createOrUpdateVideo(db, video);
      
      // Add to playlist
      await addVideoToPlaylist(db, playlistId, videoId, videoData.position || i + 1);
    }
    
    // Update playlist stats
    await updatePlaylistStats(db, playlistId);
    
    return playlistId;
  } catch (error) {
    logger.error('Failed to import playlist from JSON:', error);
    throw error;
  }
};

export default {
  exportPlaylistToJson,
  importPlaylistFromJson
}; 