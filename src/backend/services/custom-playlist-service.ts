import { IpcResponse, Video, CreatePlaylistPayload } from '../../shared/types';
import { YtDlpVideoInfoRaw } from '../../shared/types/yt-dlp';
import { getDB } from '../databases/db';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';
import * as ytDlpManager from './ytDlpManager';
import { cleanYouTubeVideoUrl } from './youtube-video-preview-service';

/**
 * Helper function to convert YYYYMMDD to MMDDYYYY format
 */
function convertYtDlpDateToMMDDYYYY(yyyymmdd?: string): string | undefined {
  if (!yyyymmdd || yyyymmdd.length !== 8) {
    return undefined;
  }
  try {
    // Ensure the input is purely numeric and 8 digits
    if (!/^\d{8}$/.test(yyyymmdd)) {
        logger.warn(`[CustomPlaylistService] Invalid characters in yyyymmdd string: ${yyyymmdd}`);
        return undefined;
    }
    const year = yyyymmdd.substring(0, 4);
    const month = yyyymmdd.substring(4, 6);
    const day = yyyymmdd.substring(6, 8);
    
    // Basic validation for month and day ranges
    const monthNum = parseInt(month, 10);
    const dayNum = parseInt(day, 10);
    if (monthNum < 1 || monthNum > 12 || dayNum < 1 || dayNum > 31) {
        logger.warn(`[CustomPlaylistService] Invalid month or day in yyyymmdd string: ${yyyymmdd}`);
        return undefined;
    }

    return `${month}${day}${year}`;
  } catch (error: any) {
    logger.error(`[CustomPlaylistService] Error parsing date string ${yyyymmdd} to MMDDYYYY: ${error.message}`);
    return undefined;
  }
}

/**
 * Creates a new, empty custom playlist.
 * @param details Payload containing name, description, and privacy status.
 * @returns An IpcResponse containing the new playlist ID or an error.
 */
export async function createNewCustomPlaylist(details: CreatePlaylistPayload): Promise<IpcResponse<{ playlistId: string }>> {
  const db = getDB();
  logger.info(`Attempting to create custom playlist: ${details.name}`);

  const newPlaylistId = uuidv4();
  const now = new Date().toISOString();
  const playlistForDb = {
    id: newPlaylistId,
    name: details.name,
    description: details.description || null,
    thumbnail: null, // Custom playlists start with no thumbnail initially
    source: 'custom' as const,
    item_count: 0,
    created_at: now,
    updated_at: now,
    source_url: null, // Custom playlists do not have a source URL
    youtube_playlist_id: null,
    total_duration_seconds: 0, // Added for completeness, though videos are empty initially
    videos: JSON.stringify([]) // Store videos as JSON string for custom playlists
  };

  try {
    const stmt = db.prepare(
      `INSERT INTO playlists (id, name, description, thumbnail, source, item_count, created_at, updated_at, source_url, youtube_playlist_id, total_duration_seconds, videos)
       VALUES (@id, @name, @description, @thumbnail, @source, @item_count, @created_at, @updated_at, @source_url, @youtube_playlist_id, @total_duration_seconds, @videos)`
    );
    stmt.run(playlistForDb);
    logger.info(`[CustomPlaylistService] Custom playlist "${details.name}" (ID: ${newPlaylistId}) created successfully.`);
    return { success: true, data: { playlistId: newPlaylistId } };
  } catch (error: any) {
    logger.error(`[CustomPlaylistService] Error creating custom playlist "${details.name}": ${error.message}`);
    return { success: false, error: error.message, data: { playlistId: newPlaylistId } };
  }
}

/**
 * Adds a video to a custom playlist by its URL.
 * Fetches video metadata, stores video in 'videos' table, and associates with playlist in 'playlist_videos'.
 * @param playlistId The ID of the custom playlist.
 * @param videoUrl The URL of the video to add.
 * @returns An IpcResponse containing the added video data or null if failed.
 */
export async function addVideoToCustomPlaylistByUrl(playlistId: string, videoUrl: string): Promise<IpcResponse<Video | null>> {
  const db = getDB();
  logger.info(`[CustomPlaylistService] addVideoToCustomPlaylistByUrl called for playlist ID: ${playlistId}, RAW URL: ${videoUrl}`);
  try {
    const playlistRow = db.prepare("SELECT id, name, source FROM playlists WHERE id = ?").get(playlistId) as { id: string; name: string; source: string; } | undefined;

    if (!playlistRow) {
      return { success: false, error: 'Playlist not found.', data: null };
    }
    if (playlistRow.source !== 'custom') {
      return { success: false, error: 'This function can only add videos to custom playlists.', data: null };
    }

    const cleanedVideoUrl = cleanYouTubeVideoUrl(videoUrl);
    logger.info(`[CustomPlaylistService] Cleaned video URL for metadata fetch: ${cleanedVideoUrl}`);

    const rawVideoMetadata: YtDlpVideoInfoRaw | null = await ytDlpManager.getVideoMetadata(cleanedVideoUrl);
    if (!rawVideoMetadata || !rawVideoMetadata.id) {
      return { success: false, error: 'Failed to fetch video metadata.', data: null };
    }

    const videoId = rawVideoMetadata.id;
    const now = new Date().toISOString();

    const existingEntryStmt = db.prepare("SELECT video_id FROM playlist_videos WHERE playlist_id = ? AND video_id =?");
    const existingEntry = existingEntryStmt.get(playlistId, videoId);
    if (existingEntry) {
      logger.warn(`[CustomPlaylistService] Video ${videoId} already exists in playlist ${playlistId}.`);
      const existingVideoDataFromDb = db.prepare("SELECT * FROM videos WHERE id = ?").get(videoId) as Video | undefined;
      let finalVideoObject: Video | null = null;

      if (existingVideoDataFromDb) {
        // Ensure we have a base object of type Video
        const videoBase: Video = { ...existingVideoDataFromDb };
        
        const playlistContext = db.prepare("SELECT position, added_to_playlist_at FROM playlist_videos WHERE playlist_id = ? AND video_id =?").get(playlistId, videoId) as { position: number; added_to_playlist_at: string } | undefined;

        if (playlistContext) {
          videoBase.position_in_playlist = playlistContext.position;
          videoBase.added_to_playlist_at = playlistContext.added_to_playlist_at;
        }
        finalVideoObject = videoBase;
      }
      return { success: false, error: 'Video already exists in this playlist.', data: finalVideoObject };
    }
    
    // --- Robust videoForDb construction ---
    let duration: number | null = null;
    if (typeof rawVideoMetadata.duration === 'number') {
      duration = rawVideoMetadata.duration;
    } else if (typeof rawVideoMetadata.duration === 'string') {
      const parsedDuration = parseFloat(rawVideoMetadata.duration);
      duration = isNaN(parsedDuration) ? null : parsedDuration;
    }

    let thumbnail_url: string | null = null;
    if (typeof rawVideoMetadata.thumbnail === 'string') {
      thumbnail_url = rawVideoMetadata.thumbnail;
    } else if (Array.isArray(rawVideoMetadata.thumbnails) && rawVideoMetadata.thumbnails.length > 0) {
      const bestThumb = rawVideoMetadata.thumbnails[rawVideoMetadata.thumbnails.length - 1];
      if (bestThumb && typeof bestThumb.url === 'string') {
        thumbnail_url = bestThumb.url;
      }
    }
    if (!thumbnail_url && Array.isArray(rawVideoMetadata.thumbnails) && rawVideoMetadata.thumbnails.length > 0 && typeof rawVideoMetadata.thumbnails[0]?.url === 'string') {
      thumbnail_url = rawVideoMetadata.thumbnails[0].url;
    }

    const videoForDb = {
        id: videoId,
        url: typeof rawVideoMetadata.webpage_url === 'string' ? rawVideoMetadata.webpage_url : (typeof rawVideoMetadata.original_url === 'string' ? rawVideoMetadata.original_url : videoUrl),
        title: typeof rawVideoMetadata.title === 'string' ? rawVideoMetadata.title : 'Untitled Video',
        channel: typeof rawVideoMetadata.uploader === 'string' ? rawVideoMetadata.uploader : (typeof rawVideoMetadata.channel === 'string' ? rawVideoMetadata.channel : null),
        duration: duration,
        thumbnail_url: thumbnail_url,
        is_available: 1,
        is_downloaded: 0,
        local_file_path: null,
        download_status: null,
        download_progress: null,
        last_watched_at: null,
        watch_progress: null,
        added_at: now,
        channel_title: typeof rawVideoMetadata.uploader === 'string' ? rawVideoMetadata.uploader : (typeof rawVideoMetadata.channel === 'string' ? rawVideoMetadata.channel : null),
        upload_date: typeof rawVideoMetadata.upload_date === 'string' ? rawVideoMetadata.upload_date : null,
        description: typeof rawVideoMetadata.description === 'string' ? rawVideoMetadata.description : null,
        channel_id: rawVideoMetadata.channel_id || null,
        uploader_id: rawVideoMetadata.uploader_id || null,
    };
    // --- End robust videoForDb construction ---

    const insertVideoQuery = `INSERT INTO videos (
      id, url, title, channel, duration, thumbnail_url, 
      is_available, is_downloaded, local_file_path, download_status, download_progress, 
      last_watched_at, watch_progress, added_at, 
      channel_title, upload_date, description, channel_id, uploader_id
    ) VALUES (
      @id, @url, @title, @channel, @duration, @thumbnail_url, 
      @is_available, @is_downloaded, @local_file_path, @download_status, @download_progress, 
      @last_watched_at, @watch_progress, @added_at, 
      @channel_title, @upload_date, @description, @channel_id, @uploader_id
    ) ON CONFLICT(id) DO UPDATE SET 
        title = excluded.title,
        channel = excluded.channel,
        duration = excluded.duration,
        thumbnail_url = excluded.thumbnail_url,
        is_available = excluded.is_available,
        channel_title = excluded.channel_title,
        upload_date = excluded.upload_date,
        description = excluded.description,
        channel_id = excluded.channel_id,
        uploader_id = excluded.uploader_id
    `;
    const insertVideoStmt = db.prepare(insertVideoQuery);
    insertVideoStmt.run(videoForDb);
    
    // Add to playlist_videos junction table
    const orderQuery = db.prepare("SELECT MAX(position) as max_order FROM playlist_videos WHERE playlist_id = ?");
    const result = orderQuery.get(playlistId) as { max_order: number | null };
    const nextOrder = (result && typeof result.max_order === 'number') ? result.max_order + 1 : 0;

    db.prepare("INSERT INTO playlist_videos (playlist_id, video_id, position, added_to_playlist_at) VALUES (?, ?, ?, ?)")
      .run(playlistId, videoId, nextOrder, now);
    
    // Determine the new playlist thumbnail based on the video at position 0
    const firstVideoThumbnailStmt = db.prepare(
      `SELECT v.thumbnail_url 
       FROM videos v
       JOIN playlist_videos pv ON v.id = pv.video_id
       WHERE pv.playlist_id = ? AND pv.position = 0
       LIMIT 1`
    );
    const firstVideoResult = firstVideoThumbnailStmt.get(playlistId) as { thumbnail_url: string | null } | undefined;
    const newPlaylistThumbnail = firstVideoResult ? firstVideoResult.thumbnail_url : null;
    logger.info(`[CustomPlaylistService] Determined new playlist thumbnail for ${playlistId}: ${newPlaylistThumbnail}`);

    const playlistUpdateStmt = db.prepare(
        "UPDATE playlists SET item_count = (SELECT COUNT(*) FROM playlist_videos WHERE playlist_id = @id), updated_at = @updated_at, thumbnail = @newThumbnail WHERE id = @id"
    );
    playlistUpdateStmt.run({
        id: playlistId,
        updated_at: now,
        newThumbnail: newPlaylistThumbnail // Use the thumbnail of the video at position 0
    });

    // After updating itemCount and thumbnail, now update total_duration_seconds
    let total_duration_for_playlist = 0;
    try {
      const durationResult = db.prepare(
        `SELECT SUM(v.duration) as total
         FROM videos v
         JOIN playlist_videos pv ON v.id = pv.video_id
         WHERE pv.playlist_id = ?`
      ).get(playlistId) as { total: number | null } | undefined;
      
      if (durationResult && durationResult.total !== null) {
        total_duration_for_playlist = durationResult.total;
      }
      db.prepare("UPDATE playlists SET total_duration_seconds = ? WHERE id = ?").run(total_duration_for_playlist, playlistId);
      logger.info(`[CustomPlaylistService] Updated total_duration_seconds for playlist ${playlistId} to ${total_duration_for_playlist}`);
    } catch (durationError: any) {
      logger.error(`[CustomPlaylistService] Error updating total_duration_seconds for playlist ${playlistId}: ${durationError.message}`);
      // Continue without failing the whole operation if duration update fails
    }
    
    logger.info(`[CustomPlaylistService] Successfully added video ${videoId} to custom playlist ${playlistId} at position ${nextOrder}.`);

    // Construct the Video object to return for the IPC response
    const addedVideo: Video = {
        id: videoId,
        url: typeof rawVideoMetadata.webpage_url === 'string' ? rawVideoMetadata.webpage_url : cleanedVideoUrl,
        title: typeof rawVideoMetadata.title === 'string' ? rawVideoMetadata.title : 'Untitled Video',
        channel: (rawVideoMetadata.uploader || rawVideoMetadata.channel || null) || undefined,
        duration: duration === null ? undefined : duration,
        thumbnail_url: thumbnail_url || undefined,
        description: (rawVideoMetadata.description || null) || undefined,
        channel_title: (rawVideoMetadata.uploader || rawVideoMetadata.channel || null) || undefined,
        upload_date: (rawVideoMetadata.upload_date || null) || undefined,
        added_to_playlist_at: now,
        position_in_playlist: nextOrder,
        is_available: true,
        is_downloaded: false,
        local_file_path: undefined,
        download_status: undefined,
        download_progress: undefined,
        last_watched_at: undefined,
        watch_progress: undefined,
        added_at: now,
        channel_id: (rawVideoMetadata.channel_id || null) || undefined,
        uploader_id: (rawVideoMetadata.uploader_id || null) || undefined,
    };

    return { success: true, data: addedVideo };

  } catch (error: any) {
    logger.error(`[CustomPlaylistService] Error in addVideoToCustomPlaylistByUrl for playlist ${playlistId}: ${error.message}`);
    logger.error(`[CustomPlaylistService] Full error object: ${JSON.stringify(error, Object.getOwnPropertyNames(error))}`);
    return { success: false, error: error.message, data: null };
  }
}
