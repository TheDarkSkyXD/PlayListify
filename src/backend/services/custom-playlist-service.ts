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
    itemCount: 0,
    createdAt: now,
    updatedAt: now,
    sourceUrl: null, // Custom playlists do not have a source URL
    youtubePlaylistId: null,
    videos: JSON.stringify([]) // Store videos as JSON string for custom playlists
  };

  try {
    const stmt = db.prepare(
      `INSERT INTO playlists (id, name, description, thumbnail, source, itemCount, createdAt, updatedAt, sourceUrl, youtubePlaylistId, videos)
       VALUES (@id, @name, @description, @thumbnail, @source, @itemCount, @createdAt, @updatedAt, @sourceUrl, @youtubePlaylistId, @videos)`
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

    const existingEntryStmt = db.prepare("SELECT videoId FROM playlist_videos WHERE playlistId = ? AND videoId =?");
    const existingEntry = existingEntryStmt.get(playlistId, videoId);
    if (existingEntry) {
      logger.warn(`[CustomPlaylistService] Video ${videoId} already exists in playlist ${playlistId}.`);
      const existingVideoDataFromDb = db.prepare("SELECT * FROM videos WHERE id = ?").get(videoId) as Video | undefined;
      let finalVideoObject: Video | null = null;

      if (existingVideoDataFromDb) {
        // Ensure we have a base object of type Video
        const videoBase: Video = { ...existingVideoDataFromDb };
        
        const playlistContext = db.prepare("SELECT position, addedToPlaylistAt FROM playlist_videos WHERE playlistId = ? AND videoId = ?").get(playlistId, videoId) as { position: number; addedToPlaylistAt: string } | undefined;

        if (playlistContext) {
          videoBase.positionInPlaylist = playlistContext.position;
          videoBase.addedToPlaylistAt = playlistContext.addedToPlaylistAt;
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

    let thumbnailUrl: string | null = null;
    if (typeof rawVideoMetadata.thumbnail === 'string') {
      thumbnailUrl = rawVideoMetadata.thumbnail;
    } else if (Array.isArray(rawVideoMetadata.thumbnails) && rawVideoMetadata.thumbnails.length > 0) {
      // Attempt to get a URL from the thumbnails array (e.g., the last one which is often highest quality)
      const bestThumb = rawVideoMetadata.thumbnails[rawVideoMetadata.thumbnails.length - 1];
      if (bestThumb && typeof bestThumb.url === 'string') {
        thumbnailUrl = bestThumb.url;
      }
    }
    if (!thumbnailUrl && Array.isArray(rawVideoMetadata.thumbnails) && rawVideoMetadata.thumbnails.length > 0 && typeof rawVideoMetadata.thumbnails[0]?.url === 'string') {
      thumbnailUrl = rawVideoMetadata.thumbnails[0].url; // Fallback to first if last didn't work
    }


    const videoForDb = {
        id: videoId,
        url: typeof rawVideoMetadata.webpage_url === 'string' ? rawVideoMetadata.webpage_url : (typeof rawVideoMetadata.original_url === 'string' ? rawVideoMetadata.original_url : videoUrl),
        title: typeof rawVideoMetadata.title === 'string' ? rawVideoMetadata.title : 'Untitled Video',
        channel: typeof rawVideoMetadata.uploader === 'string' ? rawVideoMetadata.uploader : (typeof rawVideoMetadata.channel === 'string' ? rawVideoMetadata.channel : null),
        duration: duration,
        thumbnailUrl: thumbnailUrl,
        isAvailable: 1,
        isDownloaded: 0,
        localFilePath: null,
        downloadStatus: null,
        downloadProgress: null,
        lastWatchedAt: null,
        watchProgress: null,
        addedAt: now,
        channelTitle: typeof rawVideoMetadata.uploader === 'string' ? rawVideoMetadata.uploader : (typeof rawVideoMetadata.channel === 'string' ? rawVideoMetadata.channel : null),
        uploadDate: typeof rawVideoMetadata.upload_date === 'string' ? rawVideoMetadata.upload_date : null,
        description: typeof rawVideoMetadata.description === 'string' ? rawVideoMetadata.description : null,
    };
    // --- End robust videoForDb construction ---

    const insertVideoQuery = `INSERT INTO videos (
      id, url, title, channel, duration, thumbnailUrl, 
      isAvailable, isDownloaded, localFilePath, downloadStatus, downloadProgress, 
      lastWatchedAt, watchProgress, addedAt, 
      channelTitle, 
      uploadDate, 
      description
    ) VALUES (
      @id, @url, @title, @channel, @duration, @thumbnailUrl, 
      @isAvailable, @isDownloaded, @localFilePath, @downloadStatus, @downloadProgress, 
      @lastWatchedAt, @watchProgress, @addedAt, 
      @channelTitle, 
      @uploadDate, 
      @description
    )`;
    const insertVideoStmt = db.prepare(insertVideoQuery);
    insertVideoStmt.run(videoForDb);
    
    // Add to playlist_videos junction table
    const orderQuery = db.prepare("SELECT MAX(position) as max_order FROM playlist_videos WHERE playlistId = ?");
    const result = orderQuery.get(playlistId) as { max_order: number | null };
    const nextOrder = (result && typeof result.max_order === 'number') ? result.max_order + 1 : 0;

    db.prepare("INSERT INTO playlist_videos (playlistId, videoId, position, addedToPlaylistAt) VALUES (?, ?, ?, ?)")
      .run(playlistId, videoId, nextOrder, now);
    
    // Determine the new playlist thumbnail based on the video at position 0
    const firstVideoThumbnailStmt = db.prepare(
      `SELECT v.thumbnailUrl 
       FROM videos v
       JOIN playlist_videos pv ON v.id = pv.videoId
       WHERE pv.playlistId = ? AND pv.position = 0
       LIMIT 1`
    );
    const firstVideoResult = firstVideoThumbnailStmt.get(playlistId) as { thumbnailUrl: string | null } | undefined;
    const newPlaylistThumbnail = firstVideoResult ? firstVideoResult.thumbnailUrl : null;
    logger.info(`[CustomPlaylistService] Determined new playlist thumbnail for ${playlistId}: ${newPlaylistThumbnail}`);

    const playlistUpdateStmt = db.prepare(
        "UPDATE playlists SET itemCount = (SELECT COUNT(*) FROM playlist_videos WHERE playlistId = @id), updatedAt = @updatedAt, thumbnail = @newThumbnail WHERE id = @id"
    );
    playlistUpdateStmt.run({
        id: playlistId,
        updatedAt: now,
        newThumbnail: newPlaylistThumbnail // Use the thumbnail of the video at position 0
    });

    // After updating itemCount and thumbnail, now update totalDurationSeconds
    let totalDurationForPlaylist = 0;
    try {
      const durationResult = db.prepare(
        `SELECT SUM(v.duration) as total
         FROM videos v
         JOIN playlist_videos pv ON v.id = pv.videoId
         WHERE pv.playlistId = ?`
      ).get(playlistId) as { total: number | null } | undefined;
      
      if (durationResult && durationResult.total !== null) {
        totalDurationForPlaylist = durationResult.total;
      }
      db.prepare("UPDATE playlists SET totalDurationSeconds = ? WHERE id = ?").run(totalDurationForPlaylist, playlistId);
      logger.info(`[CustomPlaylistService] Updated totalDurationSeconds for playlist ${playlistId} to ${totalDurationForPlaylist}`);
    } catch (durationError: any) {
      logger.error(`[CustomPlaylistService] Error updating totalDurationSeconds for playlist ${playlistId}: ${durationError.message}`);
      // Continue without failing the whole operation if duration update fails
    }
    
    logger.info(`[CustomPlaylistService] Successfully added video ${videoId} to custom playlist ${playlistId} at position ${nextOrder}.`);

    // Construct the Video object to return for the IPC response
    const addedVideo: Video = {
        id: videoId,
        url: typeof rawVideoMetadata.webpage_url === 'string' ? rawVideoMetadata.webpage_url : cleanedVideoUrl,
        title: typeof rawVideoMetadata.title === 'string' ? rawVideoMetadata.title : 'Untitled Video',
        channel: typeof rawVideoMetadata.uploader === 'string' ? rawVideoMetadata.uploader : (typeof rawVideoMetadata.channel === 'string' ? rawVideoMetadata.channel : undefined),
        duration: duration === null ? undefined : duration,
        thumbnail: thumbnailUrl === null ? undefined : thumbnailUrl,
        description: typeof rawVideoMetadata.description === 'string' ? rawVideoMetadata.description : undefined,
        channelTitle: typeof rawVideoMetadata.uploader === 'string' ? rawVideoMetadata.uploader : (typeof rawVideoMetadata.channel === 'string' ? rawVideoMetadata.channel : undefined),
        uploadDate: convertYtDlpDateToMMDDYYYY(typeof rawVideoMetadata.upload_date === 'string' ? rawVideoMetadata.upload_date : undefined),
        addedAt: now, // When added to our system's 'videos' table
        // Playlist specific fields
        addedToPlaylistAt: now, 
        positionInPlaylist: nextOrder, 
        // Defaultable fields from Video type
        isAvailable: true, // This should be 1 if reflecting videoForDb, but Video type expects boolean. Assuming Video type is the source of truth for response.
        isDownloaded: false, // This should be 0 if reflecting videoForDb. Assuming Video type is the source of truth for response.
        localFilePath: undefined, 
        downloadStatus: undefined,
        downloadProgress: undefined,
        lastWatchedAt: undefined,
        watchProgress: undefined,
    };

    return { success: true, data: addedVideo };

  } catch (error: any) {
    logger.error(`[CustomPlaylistService] Error in addVideoToCustomPlaylistByUrl for playlist ${playlistId}: ${error.message}`);
    logger.error(`[CustomPlaylistService] Full error object: ${JSON.stringify(error, Object.getOwnPropertyNames(error))}`);
    return { success: false, error: error.message, data: null };
  }
}
