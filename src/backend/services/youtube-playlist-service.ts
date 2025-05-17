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
    const total_duration_seconds = videosToInsert.reduce((acc: number, video: VideoAddDetails) => acc + (video.duration || 0), 0);
    logger.info(`[YouTubePlaylistService] Calculated total_duration_seconds: ${total_duration_seconds}`);

    const playlistUrlToStore = playlistMetadata.webpage_url || playlistUrl;
    
    let playlistThumbnail = playlistMetadata.thumbnail;
    if (!playlistThumbnail && videosToInsert.length > 0) {
        const firstVideoWithThumbnail = videosToInsert.find((v: VideoAddDetails) => v.thumbnail_url);
        if (firstVideoWithThumbnail) {
            playlistThumbnail = firstVideoWithThumbnail.thumbnail_url;
        }
    }
    logger.info(`[YouTubePlaylistService] Final playlistThumbnail for import: ${playlistThumbnail}`);

    const newPlaylistId = uuidv4();
    const now = new Date().toISOString();

    const insertPlaylistStmt = db.prepare(
      `INSERT INTO playlists (id, name, description, thumbnail, source, item_count, source_url, created_at, updated_at, youtube_playlist_id, total_duration_seconds)
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
      total_duration_seconds
    ];
    
    insertPlaylistStmt.run(...valuesToInsertForPlaylist);

    logger.info(`[YouTubePlaylistService] Successfully inserted new playlist "${playlistMetadata.title || 'Untitled'}" with ID ${newPlaylistId} from URL import.`);

    // Add videos to the playlist_videos junction table
    if (videosToInsert.length > 0) {
      const addVideoToJunctionStmt = db.prepare(
        "INSERT INTO playlist_videos (playlistId, videoId, position, addedAt) VALUES (?, ?, ?, ?)"
      );
      const insertVideoStmt = db.prepare(
        `INSERT INTO videos (id, title, url, thumbnail_url, duration, description, channel_title, upload_date, added_at)
        VALUES (@id, @title, @url, @thumbnail_url, @duration, @description, @channel_title, @upload_date, @added_at)
        ON CONFLICT(id) DO UPDATE SET
          title = excluded.title,
          thumbnail_url = excluded.thumbnail_url,
          duration = excluded.duration,
          description = excluded.description,
          channel_title = excluded.channel_title,
          upload_date = excluded.upload_date`
      );

      db.transaction(() => {
        videosToInsert.forEach((videoDetails: VideoAddDetails, index: number) => {
          insertVideoStmt.run({
            id: videoDetails.id,
            title: videoDetails.title,
            url: videoDetails.url,
            thumbnail_url: videoDetails.thumbnail_url || null,
            duration: videoDetails.duration || null,
            description: null,
            channel_title: videoDetails.channel_name || null,
            upload_date: videoDetails.upload_date || null,
            added_at: now
          });
          addVideoToJunctionStmt.run(newPlaylistId, videoDetails.id, index, now);
        });
      })();
      logger.info(`[YouTubePlaylistService] Added ${videosToInsert.length} videos to junction table for playlist ID ${newPlaylistId}.`);
    }

    const newPlaylist = db.prepare("SELECT id, name, description, thumbnail, source, item_count, source_url, created_at, updated_at, youtube_playlist_id, total_duration_seconds FROM playlists WHERE id = ?").get(newPlaylistId) as Omit<Playlist, 'videos'> | null;
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
                thumbnail_url: v.thumbnail_url,
                duration: v.duration,
                channel_title: v.channel_name,
                upload_date: v.upload_date,
            })),
            total_duration_seconds: newPlaylist.total_duration_seconds, // Ensure this is included from the DB record
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