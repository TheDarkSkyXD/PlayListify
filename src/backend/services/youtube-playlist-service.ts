import { IpcResponse, Playlist, VideoAddDetails } from '../../shared/types';
import { getDB } from '../databases/db';
import { logger } from '../utils/logger';
import { getPlaylistMetadata } from './ytDlpManager';
import { v4 as uuidv4 } from 'uuid';

export async function importPlaylistFromUrl(playlistUrl: string): Promise<IpcResponse<Playlist | null>> {
  const db = getDB();
  logger.info(`[YouTubePlaylistService] importPlaylistFromUrl CALLED with URL: ${playlistUrl}`);
  
  try {
    const playlistMetadata = await getPlaylistMetadata(playlistUrl);

    if (!playlistMetadata || !playlistMetadata.entries) {
      logger.error(`[YouTubePlaylistService] CRITICAL ERROR: Failed to fetch or process playlist metadata from URL: ${playlistUrl}. Metadata or entries missing.`);
      return { success: false, error: 'Failed to fetch or process playlist metadata. Metadata or entries missing.', data: null };
    }

    const videosToInsert = playlistMetadata.entries as VideoAddDetails[];

    if (!videosToInsert) {
        logger.error(`[YouTubePlaylistService] CRITICAL ERROR: Essential videosToInsert missing after processing for URL: ${playlistUrl}`);
        return { success: false, error: 'Incomplete playlist data (videos missing) after processing metadata', data: null };
    }
    
    logger.info(`[YouTubePlaylistService] Fetched ${videosToInsert.length} videos for playlist "${playlistMetadata.title}" from URL.`);

    // Calculate total duration from videosToInsert
    const totalDurationSeconds = videosToInsert.reduce((acc: number, video: VideoAddDetails) => acc + (video.duration || 0), 0);
    logger.info(`[YouTubePlaylistService] Calculated totalDurationSeconds: ${totalDurationSeconds}`);

    const playlistUrlToStore = playlistMetadata.webpage_url || playlistUrl;
    
    let playlistThumbnail = playlistMetadata.thumbnail;
    if (!playlistThumbnail && videosToInsert.length > 0) {
        const firstVideoWithThumbnail = videosToInsert.find((v: VideoAddDetails) => v.thumbnailUrl);
        if (firstVideoWithThumbnail) {
            playlistThumbnail = firstVideoWithThumbnail.thumbnailUrl;
        }
    }
    logger.info(`[YouTubePlaylistService] Final playlistThumbnail for import: ${playlistThumbnail}`);

    const newPlaylistId = uuidv4();
    const now = new Date().toISOString();

    const insertPlaylistStmt = db.prepare(
      `INSERT INTO playlists (id, name, description, thumbnailUrl, source, itemCount, sourceUrl, createdAt, updatedAt, youtubePlaylistId, totalDurationSeconds)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );

    const valuesToInsertForPlaylist = [
      newPlaylistId,
      playlistMetadata.title || 'Untitled YouTube Playlist',
      playlistMetadata.description,
      playlistThumbnail, 
      'youtube',
      videosToInsert.length, 
      playlistUrlToStore,    
      now,
      now,
      playlistMetadata.id,
      totalDurationSeconds
    ];
    
    insertPlaylistStmt.run(...valuesToInsertForPlaylist);

    logger.info(`[YouTubePlaylistService] Successfully inserted new playlist "${playlistMetadata.title || 'Untitled'}" with ID ${newPlaylistId} from URL import.`);

    // Add videos to the playlist_videos junction table
    if (videosToInsert.length > 0) {
      const addVideoToJunctionStmt = db.prepare(
        "INSERT INTO playlist_videos (playlistId, videoId, position, addedAt) VALUES (?, ?, ?, ?)"
      );
      const insertVideoStmt = db.prepare(
        `INSERT INTO videos (id, title, url, thumbnailUrl, duration, description, channelTitle, uploadDate, addedAt)
        VALUES (@id, @title, @url, @thumbnailUrl, @duration, @description, @channelTitle, @uploadDate, @addedAt)
        ON CONFLICT(id) DO UPDATE SET
          title = excluded.title,
          thumbnailUrl = excluded.thumbnailUrl,
          duration = excluded.duration,
          description = excluded.description,
          channelTitle = excluded.channelTitle,
          uploadDate = excluded.uploadDate`
      );

      db.transaction(() => {
        videosToInsert.forEach((videoDetails: VideoAddDetails, index: number) => {
          insertVideoStmt.run({
            id: videoDetails.id,
            title: videoDetails.title,
            url: videoDetails.url,
            thumbnailUrl: videoDetails.thumbnailUrl || null,
            duration: videoDetails.duration || null,
            description: null,
            channelTitle: videoDetails.channelName || null,
            uploadDate: videoDetails.uploadDate || null,
            addedAt: now
          });
          addVideoToJunctionStmt.run(newPlaylistId, videoDetails.id, index, now);
        });
      })();
      logger.info(`[YouTubePlaylistService] Added ${videosToInsert.length} videos to junction table for playlist ID ${newPlaylistId}.`);
    }

    const newPlaylist = db.prepare("SELECT id, name, description, thumbnailUrl, source, itemCount, sourceUrl, createdAt, updatedAt, youtubePlaylistId, totalDurationSeconds FROM playlists WHERE id = ?").get(newPlaylistId) as Omit<Playlist, 'videos'> | null;
    if (newPlaylist) {
      logger.info(`[YouTubePlaylistService] Successfully imported playlist: ${newPlaylist.name}`); 
      return { 
        success: true, 
        data: { 
            ...newPlaylist, 
            videos: videosToInsert.map((v: VideoAddDetails) => ({
                id: v.id,
                title: v.title,
                url: v.url,
                thumbnail: v.thumbnailUrl,
                duration: v.duration,
                channelTitle: v.channelName,
                uploadDate: v.uploadDate,
            })),
            totalDurationSeconds: newPlaylist.totalDurationSeconds, // Ensure this is included from the DB record
        } as Playlist
      };
    } else {
      logger.error(`[YouTubePlaylistService] Failed to retrieve newly imported playlist with ID: ${newPlaylistId}`);
      return { success: false, error: 'Failed to retrieve playlist after import', data: null };
    }

  } catch (error: any) {
    logger.error(`[YouTubePlaylistService] Error importing playlist from URL ${playlistUrl}:`, error);
    return { success: false, error: error.message, data: null };
  }
} 