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
    const rows = db.prepare("SELECT id, name, description, thumbnail, source, itemCount, createdAt, updatedAt, sourceUrl, youtubePlaylistId FROM playlists").all() as any[];
    
    const playlists: Playlist[] = rows.map(row => {
      // Calculate total duration for each playlist
      let totalDuration = 0;
      try {
        const durationResult = db.prepare(
          `SELECT SUM(v.duration) as total
           FROM videos v
           JOIN playlist_videos pv ON v.id = pv.videoId
           WHERE pv.playlistId = ?`
        ).get(row.id) as { total: number | null } | undefined;
        
        if (durationResult && durationResult.total !== null) {
          totalDuration = durationResult.total;
        }
      } catch (durationError: any) {
        logger.error(`[PlaylistManager] Error calculating total duration for playlist ID ${row.id}: ${durationError.message}`);
        // Keep totalDuration as 0 in case of error
      }

      return {
        id: row.id,
        name: row.name,
        description: row.description === null ? undefined : row.description,
        thumbnail: row.thumbnail === null ? undefined : row.thumbnail,
        videos: [], // Videos usually fetched on demand or via separate query
        sourceUrl: row.sourceUrl === null ? undefined : row.sourceUrl,
        source: row.source,
        itemCount: row.itemCount,
        totalDurationSeconds: totalDuration, // Added total duration
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        youtubePlaylistId: row.youtubePlaylistId === null ? undefined : row.youtubePlaylistId,
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
    const row = db.prepare("SELECT id, name, description, thumbnail, source, itemCount, createdAt, updatedAt, sourceUrl, youtubePlaylistId FROM playlists WHERE id = ?").get(id) as any;
    if (row) {
      logger.info(`[PlaylistManager] Found playlist row: ${JSON.stringify(row)}`);
      // Fetch videos for this playlist
      const videosStmt = db.prepare("SELECT v.*, pv.position as positionInPlaylist, pv.addedToPlaylistAt FROM videos v JOIN playlist_videos pv ON v.id = pv.videoId WHERE pv.playlistId = ? ORDER BY pv.position ASC");
      const videoRows = videosStmt.all(id) as any[];
      logger.info(`[PlaylistManager] Found ${videoRows.length} video rows for playlist ID ${id}.`);
      if (videoRows.length > 0) {
        logger.debug(`[PlaylistManager] First video row data: ${JSON.stringify(videoRows[0])}`);
      }
      const videos: Video[] = videoRows.map(vRow => ({
        id: vRow.id,
        title: vRow.title,
        url: vRow.url,
        thumbnail: vRow.thumbnailUrl === null ? undefined : vRow.thumbnailUrl,
        duration: vRow.duration === null ? undefined : vRow.duration,
        description: vRow.description === null ? undefined : vRow.description,
        channelTitle: vRow.channelTitle === null ? undefined : vRow.channelTitle,
        uploadDate: vRow.uploadDate === null ? undefined : vRow.uploadDate,
        addedToPlaylistAt: vRow.addedToPlaylistAt,
        positionInPlaylist: vRow.positionInPlaylist,
      }));

      // Calculate total duration from the fetched videos array
      const totalDurationSeconds = videos.reduce((acc, video) => acc + (video.duration || 0), 0);

      const playlist: Playlist = {
        id: row.id,
        name: row.name,
        description: row.description === null ? undefined : row.description,
        thumbnail: row.thumbnail === null ? undefined : row.thumbnail,
        videos: videos, 
        sourceUrl: row.sourceUrl === null ? undefined : row.sourceUrl,
        source: row.source,
        itemCount: videos.length, // Update item count based on actual videos fetched
        totalDurationSeconds: totalDurationSeconds, // Added calculated total duration
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        youtubePlaylistId: row.youtubePlaylistId === null ? undefined : row.youtubePlaylistId,
      };
      logger.debug(`[PlaylistManager] Constructed playlist object for ID ${id}: ${JSON.stringify(playlist)}`);
      // Update itemCount in DB if it differs
      if (row.itemCount !== playlist.itemCount) {
        db.prepare("UPDATE playlists SET itemCount = ? WHERE id = ?").run(playlist.itemCount, playlist.id);
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
  const params: any = { id: payload.id, updatedAt: now };

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

  const stmt = db.prepare(`UPDATE playlists SET ${setClauses.join(', ')}, updatedAt = @updatedAt WHERE id = @id`);
  
  try {
    const result = stmt.run(params);
    if (result.changes > 0) {
      logger.info(`[PlaylistManager] Playlist ID ${payload.id} updated successfully.`);
      return getPlaylistById(payload.id); // Return the updated playlist
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
      db.prepare("DELETE FROM playlist_videos WHERE playlistId = ?").run(id);
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
    const existingEntryStmt = db.prepare("SELECT videoId FROM playlist_videos WHERE playlistId = ? AND videoId = ?");
    const existingEntry = existingEntryStmt.get(playlistId, videoDetails.id);
    
    if (existingEntry) {
      logger.warn(`[PlaylistManager] addVideoToPlaylist: Video ${videoDetails.id} already exists in playlist ${playlistId}. No action taken.`);
      return { success: false, error: 'Video already exists in this playlist.' };
    }
    logger.debug(`[PlaylistManager] addVideoToPlaylist: Video ${videoDetails.id} does not exist in playlist ${playlistId}. Proceeding to add.`);

    const orderQuery = db.prepare("SELECT MAX(position) as max_order FROM playlist_videos WHERE playlistId = ?");
    const resultOrder = orderQuery.get(playlistId) as { max_order: number | null };
    const nextOrder = (resultOrder && typeof resultOrder.max_order === 'number') ? resultOrder.max_order + 1 : 0;
    logger.debug(`[PlaylistManager] addVideoToPlaylist: Calculated nextOrder for video ${videoDetails.id} in playlist ${playlistId}: ${nextOrder}`);
    
  const now = new Date().toISOString();

    const videoForDb = {
    id: videoDetails.id,
        title: videoDetails.title,
    url: videoDetails.url,
        thumbnail: videoDetails.thumbnailUrl || null, 
        duration: null, 
        description: null, 
        channelTitle: videoDetails.channelName || null,
    uploadDate: videoDetails.uploadDate || null,
    addedAt: now,
    };
    logger.debug(`[PlaylistManager] addVideoToPlaylist: Video object for 'videos' table (videoForDb): ${JSON.stringify(videoForDb)}`);
    
    const insertVideoStmt = db.prepare("INSERT OR IGNORE INTO videos (id, title, url, thumbnailUrl, duration, description, channelTitle, uploadDate, addedAt) VALUES (@id, @title, @url, @thumbnail, @duration, @description, @channelTitle, @uploadDate, @addedAt)");
    const insertVideoResult = insertVideoStmt.run(videoForDb);
    logger.info(`[PlaylistManager] addVideoToPlaylist: 'INSERT OR IGNORE INTO videos' for video ID ${videoDetails.id}. Changes: ${insertVideoResult.changes}`);

    logger.debug(`[PlaylistManager] addVideoToPlaylist: Preparing to insert into 'playlist_videos'. PlaylistID: ${playlistId}, VideoID: ${videoDetails.id}, Position: ${nextOrder}, AddedAt: ${now}`);
    const insertJunctionStmt = db.prepare("INSERT INTO playlist_videos (playlistId, videoId, position, addedToPlaylistAt) VALUES (?, ?, ?, ?)");
    const insertJunctionResult = insertJunctionStmt.run(playlistId, videoDetails.id, nextOrder, now);
    logger.info(`[PlaylistManager] addVideoToPlaylist: 'INSERT INTO playlist_videos' for video ID ${videoDetails.id} into playlist ${playlistId}. Changes: ${insertJunctionResult.changes}`);
    
    // Update playlist's itemCount and updated_at
    const countResult = db.prepare("SELECT COUNT(*) as count FROM playlist_videos WHERE playlistId = ?").get(playlistId) as { count: number };
    const currentItemCountInJunction = countResult ? countResult.count : 0;
    logger.info(`[PlaylistManager] addVideoToPlaylist: Current item count from 'playlist_videos' for playlist ${playlistId} is ${currentItemCountInJunction}.`);

    logger.debug(`[PlaylistManager] addVideoToPlaylist: Preparing to update 'playlists' table. itemCount: ${currentItemCountInJunction}, updatedAt: ${now}, playlistId: ${playlistId}`);
    const updatePlaylistStmt = db.prepare("UPDATE playlists SET itemCount = ?, updatedAt = ? WHERE id = ?");
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
    const result = db.prepare("DELETE FROM playlist_videos WHERE playlistId = ? AND videoId = ?").run(playlistId, videoId);
    
    if (result.changes > 0) {
      // Re-index positions for the remaining videos in the playlist
      const remainingVideos = db.prepare(
        "SELECT videoId FROM playlist_videos WHERE playlistId = ? ORDER BY position ASC"
      ).all(playlistId) as Array<{ videoId: string }>;

      db.transaction(() => {
        for (let i = 0; i < remainingVideos.length; i++) {
          db.prepare(
            "UPDATE playlist_videos SET position = ? WHERE playlistId = ? AND videoId = ?"
          ).run(i, playlistId, remainingVideos[i].videoId);
        }
      })();
      logger.info(`[PlaylistManager] Re-indexed positions for playlist ID: ${playlistId} after deleting video ID: ${videoId}`);

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
      logger.info(`[PlaylistManager] Determined new playlist thumbnail for ${playlistId} after deletion: ${newPlaylistThumbnail}`);
      
      // Calculate new total duration
      let newTotalDuration = 0;
      try {
        const durationResult = db.prepare(
          `SELECT SUM(v.duration) as total
           FROM videos v
           JOIN playlist_videos pv ON v.id = pv.videoId
           WHERE pv.playlistId = ?`
        ).get(playlistId) as { total: number | null } | undefined;
        
        if (durationResult && durationResult.total !== null) {
          newTotalDuration = durationResult.total;
        }
      } catch (durationError: any) {
        logger.error(`[PlaylistManager] Error calculating total duration for playlist ID ${playlistId} after deletion: ${durationError.message}`);
      }

      // Update playlist's itemCount, thumbnail, and totalDurationSeconds
      db.prepare(
        "UPDATE playlists SET itemCount = (SELECT COUNT(*) FROM playlist_videos WHERE playlistId = ?), updatedAt = ?, thumbnail = ?, totalDurationSeconds = ? WHERE id = ?"
      ).run(playlistId, now, newPlaylistThumbnail, newTotalDuration, playlistId);
      
      logger.info(`[PlaylistManager] Video ${videoId} removed from playlist ${playlistId} successfully. Playlist itemCount, thumbnail, and totalDurationSeconds updated.`);
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
        db.prepare("UPDATE playlist_videos SET position = ? WHERE playlistId = ? AND videoId = ?").run(i, playlistId, videoIdsInOrder[i]);
      }
      db.prepare("UPDATE playlists SET updatedAt = ? WHERE id = ?").run(now, playlistId);
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
  logger.info('[PlaylistManager] getAllVideosForPlaylist called for playlist ID:', playlistId);
  try {
    const playlistRow = db.prepare("SELECT id, source FROM playlists WHERE id = ?").get(playlistId) as { id: string; source: 'custom' | 'youtube'; } | null;

    if (!playlistRow) {
      logger.warn(`[PlaylistManager] Playlist not found in getAllVideosForPlaylist for ID: ${playlistId}`);
      return null;
    }

    // All playlist types will now fetch from the playlist_videos junction table
    const videoRows = db.prepare("SELECT v.*, pv.position as position, pv.addedToPlaylistAt FROM videos v JOIN playlist_videos pv ON v.id = pv.videoId WHERE pv.playlistId = ? ORDER BY pv.position ASC").all(playlistId) as any[];
    logger.info(`[PlaylistManager] getAllVideosForPlaylist - Fetched ${videoRows.length} video rows from playlist_videos for playlist ID: ${playlistId}`);
    
    const videos: PlaylistVideo[] = videoRows.map((vRow, index) => {
      logger.debug(`[PlaylistManager] getAllVideosForPlaylist - Processing vRow[${index}] for playlist ${playlistId}: ${JSON.stringify(vRow)}`);
      const video: PlaylistVideo = {
        id: vRow.id,
        title: vRow.title,
        url: vRow.url,
        thumbnail: vRow.thumbnailUrl === null ? undefined : vRow.thumbnailUrl,
        duration: vRow.duration === null ? undefined : vRow.duration,
        description: vRow.description === null ? undefined : vRow.description,
        channelTitle: vRow.channelTitle === null ? undefined : vRow.channelTitle,
        uploadDate: vRow.uploadDate === null ? undefined : vRow.uploadDate,
        position: vRow.position,
        addedToPlaylistAt: vRow.addedToPlaylistAt,
      };
      logger.debug(`[PlaylistManager] getAllVideosForPlaylist - Mapped video[${index}] for playlist ${playlistId}: ${JSON.stringify(video)}`);
      return video;
    });
      return videos;

  } catch (error: any) {
    logger.error(`[PlaylistManager] Error fetching videos for playlist ${playlistId} in getAllVideosForPlaylist: ${error.message}`);
    return null;
  }
}

// REMOVED importPlaylistFromUrl function as it's now in youtube-playlist-service.ts 