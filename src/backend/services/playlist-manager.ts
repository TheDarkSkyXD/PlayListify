import { IpcResponse, Playlist, Video, PlaylistVideo, UpdatePlaylistPayload, VideoAddDetails } from '../../shared/types';
// import * as ytDlpManager from './ytDlpManager'; // ytDlpManager might not be needed here anymore if all its uses were in removed functions
import { getDB } from '../databases/db';
import { logger } from '../utils/logger';
// import { getPlaylistMetadata } from './ytDlpManager'; // No longer needed here
// import { v4 as uuidv4 } from 'uuid'; // No longer needed here

// Removed: createPlaylist
// Removed: addVideoToCustomPlaylistByUrl

// Remove the temporary global type definition as we are using a direct import now
// declare global {
//   var services: {
//     ytDlp: {
//       getPlaylistInfoWithEntries: (url: string) => Promise<any>; 
//     };
//   };
// }

export async function getAllPlaylists(): Promise<IpcResponse<Playlist[]>> {
  const db = getDB();
  logger.info('[PlaylistManager] getAllPlaylists called');
  try {
    const rows = db.prepare("SELECT id, name, description, thumbnail, source, item_count, created_at, updated_at, source_url, youtube_playlist_id FROM playlists").all() as any[];
    
    const playlists: Playlist[] = rows.map((row: any) => {
      let total_duration_seconds = 0;
      try {
        const durationResult = db.prepare(
          `SELECT SUM(v.duration) as total
           FROM videos v
           JOIN playlist_videos pv ON v.id = pv.video_id
           WHERE pv.playlist_id = ?`
        ).get(row.id) as { total: number | null } | undefined;
        
        if (durationResult && durationResult.total !== null) {
          total_duration_seconds = durationResult.total;
        }
      } catch (durationError: any) {
        logger.error(`[PlaylistManager] Error calculating total duration for playlist ID ${row.id}: ${durationError.message}`);
      }

      return {
        id: row.id,
        name: row.name,
        description: row.description === null ? undefined : row.description,
        thumbnail: row.thumbnail === null ? undefined : row.thumbnail,
        videos: [], 
        source_url: row.source_url === null ? undefined : row.source_url,
        source: row.source,
        item_count: row.item_count,
        total_duration_seconds: total_duration_seconds, 
        created_at: row.created_at,
        updated_at: row.updated_at,
        youtube_playlist_id: row.youtube_playlist_id === null ? undefined : row.youtube_playlist_id,
      };
    });
    return { success: true, data: playlists };
  } catch (error: any) {
    logger.error('[PlaylistManager] Error fetching all playlists:', error);
    return { success: false, error: error.message, data: [] };
  }
}

export async function getPlaylistById(id: string): Promise<IpcResponse<Playlist | null>> {
  const db = getDB();
  logger.info(`[PlaylistManager] getPlaylistById called with ID: ${id}`);
  try {
    const row = db.prepare("SELECT id, name, description, thumbnail, source, item_count, created_at, updated_at, source_url, youtube_playlist_id FROM playlists WHERE id = ?").get(id) as any;
    if (row) {
      logger.info(`[PlaylistManager] Found playlist row: ${JSON.stringify(row)}`);
      const videosStmt = db.prepare("SELECT v.*, pv.position as position_in_playlist, pv.added_to_playlist_at FROM videos v JOIN playlist_videos pv ON v.id = pv.video_id WHERE pv.playlist_id = ? ORDER BY pv.position ASC");
      const videoRows = videosStmt.all(id) as any[];
      logger.info(`[PlaylistManager] Found ${videoRows.length} video rows for playlist ID ${id}.`);
      if (videoRows.length > 0) {
        logger.debug(`[PlaylistManager] First video row data: ${JSON.stringify(videoRows[0])}`);
      }
      const videos: Video[] = videoRows.map((vRow: any) => ({
        id: vRow.id,
        title: vRow.title,
        url: vRow.url,
        thumbnail_url: vRow.thumbnail_url === null ? undefined : vRow.thumbnail_url,
        duration: vRow.duration === null ? undefined : vRow.duration,
        description: vRow.description === null ? undefined : vRow.description,
        channel_title: vRow.channel_title === null ? undefined : vRow.channel_title,
        upload_date: vRow.upload_date === null ? undefined : vRow.upload_date,
        added_to_playlist_at: vRow.added_to_playlist_at,
        position_in_playlist: vRow.position_in_playlist,
        is_available: vRow.is_available !== undefined ? vRow.is_available : undefined,
        is_downloaded: vRow.is_downloaded !== undefined ? vRow.is_downloaded : undefined,
        local_file_path: vRow.local_file_path === null ? undefined : vRow.local_file_path,
        download_status: vRow.download_status === null ? undefined : vRow.download_status,
        download_progress: vRow.download_progress === null ? undefined : vRow.download_progress,
        last_watched_at: vRow.last_watched_at === null ? undefined : vRow.last_watched_at,
        watch_progress: vRow.watch_progress === null ? undefined : vRow.watch_progress,
        added_at: vRow.added_at,
        channel_id: vRow.channel_id === null ? undefined : vRow.channel_id,
        uploader_id: vRow.uploader_id === null ? undefined : vRow.uploader_id,
      }));

      const total_duration_seconds = videos.reduce((acc, video) => acc + (video.duration || 0), 0);

      const playlist: Playlist = {
        id: row.id,
        name: row.name,
        description: row.description === null ? undefined : row.description,
        thumbnail: row.thumbnail === null ? undefined : row.thumbnail,
        videos: videos, 
        source_url: row.source_url === null ? undefined : row.source_url,
        source: row.source,
        item_count: videos.length, 
        total_duration_seconds: total_duration_seconds, 
        created_at: row.created_at,
        updated_at: row.updated_at,
        youtube_playlist_id: row.youtube_playlist_id === null ? undefined : row.youtube_playlist_id,
      };
      logger.debug(`[PlaylistManager] Constructed playlist object for ID ${id}: ${JSON.stringify(playlist)}`);
      if (row.item_count !== playlist.item_count) {
        db.prepare("UPDATE playlists SET item_count = ? WHERE id = ?").run(playlist.item_count, playlist.id);
      }
    return { success: true, data: playlist };
    } else {
      return { success: false, error: 'Playlist not found', data: null };
    }
  } catch (error: any) {
    logger.error(`[PlaylistManager] Error fetching playlist by ID ${id}:`, error);
    return { success: false, error: error.message, data: null };
  }
}

export async function updatePlaylistDetails(payload: UpdatePlaylistPayload): Promise<IpcResponse<Playlist | null>> {
  const db = getDB();
  logger.info('[PlaylistManager] updatePlaylistDetails called with payload:', payload);
  const now = new Date().toISOString();
  const setClauses: string[] = [];
  const params: any = { id: payload.id, updated_at: now };

  if (payload.name !== undefined) {
    setClauses.push('name = @name');
    params.name = payload.name;
  }
  if (payload.description !== undefined) {
    setClauses.push('description = @description');
    params.description = payload.description;
  }
  if (payload.thumbnail !== undefined) {
    setClauses.push('thumbnail = @thumbnail');
    params.thumbnail = payload.thumbnail;
  }

  if (setClauses.length === 0) {
    logger.warn('[PlaylistManager] No fields to update for playlist ID:', payload.id);
    return getPlaylistById(payload.id); 
  }

  const stmt = db.prepare(`UPDATE playlists SET ${setClauses.join(', ')}, updated_at = @updated_at WHERE id = @id`);
  
  try {
    const result = stmt.run(params);
    if (result.changes > 0) {
      logger.info(`[PlaylistManager] Playlist ID ${payload.id} updated successfully.`);
      return getPlaylistById(payload.id);
    } else {
      logger.warn(`[PlaylistManager] Playlist ID ${payload.id} not found for update.`);
      return { success: false, error: 'Playlist not found or no changes made', data: null };
    }
  } catch (error: any) {
    logger.error(`[PlaylistManager] Error updating playlist ID ${payload.id}:`, error);
    return { success: false, error: error.message, data: null };
  }
}

export async function deletePlaylist(id: string): Promise<IpcResponse<void>> {
  const db = getDB();
  logger.info(`[PlaylistManager] deletePlaylist called for ID: ${id}`);
  try {
    db.transaction(() => {
      db.prepare("DELETE FROM playlist_videos WHERE playlist_id = ?").run(id);
      db.prepare("DELETE FROM playlists WHERE id = ?").run(id);
    })(); 
    logger.info(`[PlaylistManager] Playlist ID ${id} and its video associations deleted successfully (if it existed).`);
    return { success: true };
  } catch (error: any) {
    logger.error(`[PlaylistManager] Error deleting playlist ID ${id}:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Adds a video to a playlist's junction table (playlist_videos) for imported playlists.
 * Assumes the video already exists in the main 'videos' table.
 */
export async function addVideoToPlaylist(playlistId: string, videoDetails: VideoAddDetails): Promise<IpcResponse<void>> {
  const db = getDB();
  logger.info(`[PlaylistManager] addVideoToPlaylist ENTERED for playlist ID: ${playlistId}, video ID: ${videoDetails.id}, title: ${videoDetails.title}`);
  try {
    logger.debug(`[PlaylistManager] addVideoToPlaylist: Checking if video ${videoDetails.id} already exists in playlist ${playlistId}`);
    const existingEntryStmt = db.prepare("SELECT video_id FROM playlist_videos WHERE playlist_id = ? AND video_id = ?");
    const existingEntry = existingEntryStmt.get(playlistId, videoDetails.id);
    
    if (existingEntry) {
      logger.warn(`[PlaylistManager] addVideoToPlaylist: Video ${videoDetails.id} already exists in playlist ${playlistId}. No action taken.`);
      return { success: false, error: 'Video already exists in this playlist.' };
    }
    logger.debug(`[PlaylistManager] addVideoToPlaylist: Video ${videoDetails.id} does not exist in playlist ${playlistId}. Proceeding to add.`);

    const orderQuery = db.prepare("SELECT MAX(position) as max_order FROM playlist_videos WHERE playlist_id = ?");
    const resultOrder = orderQuery.get(playlistId) as { max_order: number | null };
    const nextOrder = (resultOrder && typeof resultOrder.max_order === 'number') ? resultOrder.max_order + 1 : 0;
    logger.debug(`[PlaylistManager] addVideoToPlaylist: Calculated nextOrder for video ${videoDetails.id} in playlist ${playlistId}: ${nextOrder}`);
    
  const now = new Date().toISOString();

    const videoForDb = {
      id: videoDetails.id,
      title: videoDetails.title,
      url: videoDetails.url,
      thumbnail_url: videoDetails.thumbnail_url || null, 
      duration: null, 
      description: null, 
      channel_title: videoDetails.channel_name || null,
      upload_date: videoDetails.upload_date || null,
      added_at: now,
      is_available: true, 
      is_downloaded: false, 
      local_file_path: null,
      download_status: null,
      download_progress: null,
      last_watched_at: null,
      watch_progress: null,
      channel_id: null, 
      uploader_id: null, 
    };
    logger.debug(`[PlaylistManager] addVideoToPlaylist: Video object for 'videos' table (videoForDb): ${JSON.stringify(videoForDb)}`);
    
    const insertVideoStmt = db.prepare("INSERT OR IGNORE INTO videos (id, title, url, thumbnail_url, duration, description, channel_title, upload_date, added_at, is_available, is_downloaded, local_file_path, download_status, download_progress, last_watched_at, watch_progress, channel_id, uploader_id) VALUES (@id, @title, @url, @thumbnail_url, @duration, @description, @channel_title, @upload_date, @added_at, @is_available, @is_downloaded, @local_file_path, @download_status, @download_progress, @last_watched_at, @watch_progress, @channel_id, @uploader_id)");
    const insertVideoResult = insertVideoStmt.run(videoForDb);
    logger.info(`[PlaylistManager] addVideoToPlaylist: 'INSERT OR IGNORE INTO videos' for video ID ${videoDetails.id}. Changes: ${insertVideoResult.changes}`);

    logger.debug(`[PlaylistManager] addVideoToPlaylist: Preparing to insert into 'playlist_videos'. PlaylistID: ${playlistId}, VideoID: ${videoDetails.id}, Position: ${nextOrder}, AddedAt: ${now}`);
    const insertJunctionStmt = db.prepare("INSERT INTO playlist_videos (playlist_id, video_id, position, added_to_playlist_at) VALUES (?, ?, ?, ?)");
    const insertJunctionResult = insertJunctionStmt.run(playlistId, videoDetails.id, nextOrder, now);
    logger.info(`[PlaylistManager] addVideoToPlaylist: 'INSERT INTO playlist_videos' for video ID ${videoDetails.id} into playlist ${playlistId}. Changes: ${insertJunctionResult.changes}`);
    
    const countResult = db.prepare("SELECT COUNT(*) as count FROM playlist_videos WHERE playlist_id = ?").get(playlistId) as { count: number };
    const currentItemCountInJunction = countResult ? countResult.count : 0;
    logger.info(`[PlaylistManager] addVideoToPlaylist: Current item count from 'playlist_videos' for playlist ${playlistId} is ${currentItemCountInJunction}.`);

    logger.debug(`[PlaylistManager] addVideoToPlaylist: Preparing to update 'playlists' table. item_count: ${currentItemCountInJunction}, updated_at: ${now}, playlist_id: ${playlistId}`);
    const updatePlaylistStmt = db.prepare("UPDATE playlists SET item_count = ?, updated_at = ? WHERE id = ?");
    const updatePlaylistResult = updatePlaylistStmt.run(currentItemCountInJunction, now, playlistId);
    logger.info(`[PlaylistManager] addVideoToPlaylist: 'UPDATE playlists' for playlist ${playlistId}. Changes: ${updatePlaylistResult.changes}`);

    logger.info(`[PlaylistManager] addVideoToPlaylist SUCCESS for video ${videoDetails.id} added to playlist ${playlistId}.`);
    return { success: true };
  } catch (error: any) {
    logger.error(`[PlaylistManager] addVideoToPlaylist ERROR for video ${videoDetails.id} to playlist ${playlistId}: ${error.message}`, error);
    return { success: false, error: error.message };
  }
}

export async function removeVideoFromPlaylist(playlistId: string, videoId: string): Promise<IpcResponse<void>> {
  const db = getDB();
  logger.info(`[PlaylistManager] removeVideoFromPlaylist called for playlist ID: ${playlistId}, video ID: ${videoId}`);
  const now = new Date().toISOString();
  try {
    const result = db.prepare("DELETE FROM playlist_videos WHERE playlist_id = ? AND video_id = ?").run(playlistId, videoId);
    
    if (result.changes > 0) {
      // Re-index positions for the remaining videos in the playlist
      const remainingVideos = db.prepare(
        "SELECT video_id FROM playlist_videos WHERE playlist_id = ? ORDER BY position ASC"
      ).all(playlistId) as Array<{ video_id: string }>;

      db.transaction(() => {
        for (let i = 0; i < remainingVideos.length; i++) {
          db.prepare(
            "UPDATE playlist_videos SET position = ? WHERE playlist_id = ? AND video_id = ?"
          ).run(i, playlistId, remainingVideos[i].video_id);
        }
      })();
      logger.info(`[PlaylistManager] Re-indexed positions for playlist ID: ${playlistId} after deleting video ID: ${videoId}`);

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
      logger.info(`[PlaylistManager] Determined new playlist thumbnail for ${playlistId} after deletion: ${newPlaylistThumbnail}`);
      
      // Calculate new total duration
      let newTotalDuration = 0;
      try {
        const durationResult = db.prepare(
          `SELECT SUM(v.duration) as total
           FROM videos v
           JOIN playlist_videos pv ON v.id = pv.video_id
           WHERE pv.playlist_id = ?`
        ).get(playlistId) as { total: number | null } | undefined;
        
        if (durationResult && durationResult.total !== null) {
          newTotalDuration = durationResult.total;
        }
      } catch (durationError: any) {
        logger.error(`[PlaylistManager] Error calculating total duration for playlist ID ${playlistId} after deletion: ${durationError.message}`);
      }

      // Update playlist's item_count, thumbnail, and total_duration_seconds
      db.prepare(
        "UPDATE playlists SET item_count = (SELECT COUNT(*) FROM playlist_videos WHERE playlist_id = ?), updated_at = ?, thumbnail = ?, total_duration_seconds = ? WHERE id = ?"
      ).run(playlistId, now, newPlaylistThumbnail, newTotalDuration, playlistId);
      
      logger.info(`[PlaylistManager] Video ${videoId} removed from playlist ${playlistId} successfully. Playlist item_count, thumbnail, and total_duration_seconds updated.`);
    return { success: true };
    } else {
      logger.warn(`[PlaylistManager] Video ${videoId} not found in playlist ${playlistId}, or playlist does not exist.`);
      return { success: false, error: 'Video not found in playlist.' };
    }
  } catch (error: any) {
    logger.error(`[PlaylistManager] Error removing video ${videoId} from playlist ${playlistId}:`, error);
    return { success: false, error: error.message };
  }
}

export async function reorderVideosInPlaylist(playlistId: string, videoIdsInOrder: string[]): Promise<IpcResponse<void>> {
  const db = getDB();
  logger.info('[PlaylistManager] reorderVideosInPlaylist called for playlist ID:', playlistId, 'with order:', videoIdsInOrder);
  const now = new Date().toISOString();
  try {
    db.transaction(() => {
      for (let i = 0; i < videoIdsInOrder.length; i++) {
        db.prepare("UPDATE playlist_videos SET position = ? WHERE playlist_id = ? AND video_id = ?").run(i, playlistId, videoIdsInOrder[i]);
      }
      db.prepare("UPDATE playlists SET updated_at = ? WHERE id = ?").run(now, playlistId);
    })();
    logger.info(`[PlaylistManager] Videos reordered successfully for playlist ID: ${playlistId}`);
    return { success: true };
  } catch (error: any) {
    logger.error(`[PlaylistManager] Error reordering videos for playlist ${playlistId}:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Retrieves all videos for a given playlist, handling both custom (JSON) and imported (junction table) playlists.
 */
export async function getAllVideosForPlaylist(playlistId: string): Promise<PlaylistVideo[] | null> {
  const db = getDB();
  logger.info(`[PlaylistManager] getAllVideosForPlaylist called for playlist ID: ${playlistId}`);
  try {
    // Check if the playlist exists first
    const playlistExists = db.prepare("SELECT id FROM playlists WHERE id = ?").get(playlistId);
    if (!playlistExists) {
      logger.warn(`[PlaylistManager] getAllVideosForPlaylist - Playlist with ID ${playlistId} not found.`);
      return null;
    }

    // All playlist types will now fetch from the playlist_videos junction table
    const videoRows = db.prepare("SELECT v.*, pv.position as position, pv.added_to_playlist_at FROM videos v JOIN playlist_videos pv ON v.id = pv.video_id WHERE pv.playlist_id = ? ORDER BY pv.position ASC").all(playlistId) as any[];
    logger.info(`[PlaylistManager] getAllVideosForPlaylist - Fetched ${videoRows.length} video rows from playlist_videos for playlist ID: ${playlistId}`);
    
    const videos: PlaylistVideo[] = videoRows.map((vRow: any) => ({
      // Map all properties from vRow (which are snake_case from DB) to PlaylistVideo (snake_case type)
      id: vRow.id,
      url: vRow.url,
      title: vRow.title,
      channel: vRow.channel === null ? undefined : vRow.channel,
      duration: vRow.duration === null ? undefined : vRow.duration,
      thumbnail_url: vRow.thumbnail_url === null ? undefined : vRow.thumbnail_url, // Corrected: use thumbnail_url from vRow
      description: vRow.description === null ? undefined : vRow.description,
      channel_title: vRow.channel_title === null ? undefined : vRow.channel_title,
      upload_date: vRow.upload_date === null ? undefined : vRow.upload_date,
      is_available: vRow.is_available !== undefined ? vRow.is_available : undefined, // Ensure boolean or undefined
      is_downloaded: vRow.is_downloaded !== undefined ? vRow.is_downloaded : undefined,
      local_file_path: vRow.local_file_path === null ? undefined : vRow.local_file_path,
      download_status: vRow.download_status === null ? undefined : vRow.download_status,
      download_progress: vRow.download_progress === null ? undefined : vRow.download_progress,
      last_watched_at: vRow.last_watched_at === null ? undefined : vRow.last_watched_at,
      watch_progress: vRow.watch_progress === null ? undefined : vRow.watch_progress,
      added_at: vRow.added_at, // from videos table
      channel_id: vRow.channel_id === null ? undefined : vRow.channel_id,
      uploader_id: vRow.uploader_id === null ? undefined : vRow.uploader_id,
      // PlaylistVideo specific fields from playlist_videos table
      position: vRow.position, 
      added_to_playlist_at: vRow.added_to_playlist_at,
    }));

    return videos;
  } catch (error: any) {
    logger.error(`[PlaylistManager] Error fetching videos for playlist ${playlistId}:`, error);
    return null; // Return null or handle error as appropriate
  }
}

