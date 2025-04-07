import * as fileUtils from '../../../utils/fileUtils/index';
import { logToFile } from '../../logger';
import { Playlist, Video } from '../../../../shared/types/appTypes';
import { getPlaylistInfo } from './info';
import { getPlaylistVideos } from './videos';
import { PlaylistProgressCallback } from './types';

/**
 * Imports a YouTube playlist
 */
export async function importYoutubePlaylist(
  playlistUrl: string,
  onProgress?: PlaylistProgressCallback
): Promise<Playlist> {
  logToFile('INFO', `Importing YouTube playlist: ${playlistUrl}`);

  try {
    // Get playlist info
    if (onProgress) {
      onProgress('Getting playlist info');
    }

    const playlistInfo = await getPlaylistInfo(playlistUrl);
    
    // Create a unique ID for the playlist
    const playlistId = fileUtils.createPlaylistId();

    // Create the playlist object
    const playlist: Playlist = {
      id: playlistId,
      name: playlistInfo.title,
      description: playlistInfo.description,
      thumbnail: playlistInfo.thumbnailUrl,
      videos: [],
      source: 'youtube',
      sourceUrl: playlistUrl,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Get videos from the playlist
    if (onProgress) {
      onProgress('Getting videos', 0, playlistInfo.videoCount);
    }

    const videos = await getPlaylistVideos(playlistUrl, onProgress);
    
    // Add videos to the playlist
    playlist.videos = videos;

    // Create the playlist directory
    if (onProgress) {
      onProgress('Creating playlist directory');
    }

    await fileUtils.createPlaylistDir(playlistId, playlistInfo.title);

    // Write playlist metadata
    if (onProgress) {
      onProgress('Writing playlist metadata');
    }

    await fileUtils.writePlaylistMetadata(playlistId, playlistInfo.title, playlist);

    // Call onProgress with "completed" status
    if (onProgress) {
      onProgress('completed', videos.length, videos.length);
    }

    logToFile('INFO', `Successfully imported YouTube playlist: ${playlistInfo.title} (${playlistId})`);
    return playlist;
  } catch (error) {
    logToFile('ERROR', `Failed to import YouTube playlist: ${error}`);
    throw error;
  }
}
