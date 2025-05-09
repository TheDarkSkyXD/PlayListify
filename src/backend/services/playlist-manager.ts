import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs'; // Using Node.js built-in fs module
import fsExtra from 'fs-extra'; // For ensureDirSync
import { app } from 'electron'; // Re-add app for getAppPath()
// app module is not needed here if we are not using app.getPath('userData') anymore for this path
import { IpcResponse, Playlist, Video, PlaylistVideo } from '../../shared/types';
// import { getSetting } from './settingsService'; // For db path if stored in settings

// Define types for parameters to match service functions & preload expectations
type PlaylistCreationDetails = Pick<Playlist, 'name' | 'description' | 'source' | 'youtubePlaylistId'>;
type PlaylistUpdateDetails = Partial<Pick<Playlist, 'name' | 'description'>>;
type VideoAddDetails = Pick<Video, 'id' | 'title' | 'thumbnailUrl' | 'url'>;

// --- Database Path Configuration ---
// Determine base path: In development, this will be the project root.
// In production, it will be the app's root directory (e.g., inside resources/app.asar)
const appBasePath = app.getAppPath();
const databasesDir = path.join(appBasePath, 'src', 'backend', 'databases');

// Ensure the databases directory exists
// For development, this will create src/backend/databases if it doesn't exist.
// For production, this path might be read-only if inside an asar. 
// User data should go to app.getPath('userData').
// We will use a DEV_MODE flag or similar for truly separate dev/prod db paths later if needed.
// For now, this setup aims to put the .db file in src/backend/databases as requested for dev.

let dbPath: string;
let schemaPath: string;

if (process.env.NODE_ENV === 'development') {
  // Development: Use src/backend/databases/
  dbPath = path.join(databasesDir, 'playlistify.db');
  schemaPath = path.join(databasesDir, 'schema.sql');
  try {
    fsExtra.ensureDirSync(databasesDir);
  } catch (e) {
    console.error(`[PlaylistManager] Failed to ensure development databases directory at ${databasesDir}:`, e);
    // Fallback or throw, depending on how critical this is for dev.
    // For now, we'll let it potentially fail if directory creation isn't possible.
  }
} else {
  // Production: Use userData path
  const userDataPath = app.getPath('userData');
  dbPath = path.join(userDataPath, 'playlistify.db');
  // Schema for production: could be copied on first run or bundled.
  // For now, assume schema.sql is bundled with the app resources.
  // This path assumes schema.sql is at the root of the app resources in production.
  schemaPath = path.join(appBasePath, 'schema.sql'); 
  // A more robust production setup would copy schema.sql to userData on first launch
  // if it doesn't exist, or if db needs initialization.
  // Or, have a migration system.
}

console.log(`[PlaylistManager] Database path set to: ${dbPath}`);
console.log(`[PlaylistManager] Schema path set to: ${schemaPath}`);

const db = new Database(dbPath, { verbose: console.log });

db.pragma('journal_mode = WAL');

function setupDatabase() {
  try {
    // Check if schema.sql exists before trying to read it
    if (!fs.existsSync(schemaPath)) {
      console.error(`[PlaylistManager] Schema file not found at: ${schemaPath}. Cannot initialize database tables.`);
      // If it's production and schema isn't found, this is a critical packaging/setup error.
      // If it's development, it means schema.sql is missing from src/backend/databases.
      // For now, we allow the DB to be created empty. Tables will be created if they don't exist by schema.sql.
      // But if schema.sql is the *only* source of truth, this means tables won't be made.
      // The CREATE TABLE IF NOT EXISTS in schema.sql *should* handle first run.
      // The key is that schema.sql must be found.
      throw new Error(`Schema file not found: ${schemaPath}`); 
    }
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    db.exec(schemaSql);
    console.log('[PlaylistManager] Database tables ensured using schema.sql.');
  } catch (error) {
    console.error('[PlaylistManager] Error setting up database from schema.sql:', error);
    throw error; 
  }
}

setupDatabase(); 

// Prepared Statements
const stmtCreatePlaylist = db.prepare(`
  INSERT INTO playlists (id, name, description, source, youtubePlaylistId, createdAt, updatedAt, itemCount)
  VALUES (@id, @name, @description, @source, @youtubePlaylistId, @createdAt, @updatedAt, 0)
`);
const stmtGetAllPlaylists = db.prepare('SELECT * FROM playlists ORDER BY createdAt DESC');
const stmtGetPlaylistById = db.prepare('SELECT * FROM playlists WHERE id = ?');

const stmtUpsertVideo = db.prepare(`
  INSERT INTO videos (id, url, title, thumbnailUrl, addedAt, isAvailable, isDownloaded)
  VALUES (@id, @url, @title, @thumbnailUrl, @addedAt, TRUE, FALSE)
  ON CONFLICT(id) DO UPDATE SET
    title = excluded.title,
    url = excluded.url, 
    thumbnailUrl = excluded.thumbnailUrl,
    -- We might not want to overwrite addedAt or other fields if it already exists
    -- For now, let's assume if it's an upsert, we refresh these basic details.
    isAvailable = TRUE -- If we are adding it, assume it's available now.
  ON CONFLICT(url) DO UPDATE SET
    title = excluded.title,
    thumbnailUrl = excluded.thumbnailUrl,
    isAvailable = TRUE;
`);

const stmtGetPlaylistVideoCount = db.prepare('SELECT itemCount FROM playlists WHERE id = ?');
const stmtAddVideoToPlaylistJunction = db.prepare(`
  INSERT INTO playlist_videos (playlistId, videoId, position, addedToPlaylistAt)
  VALUES (@playlistId, @videoId, @position, @addedToPlaylistAt)
`);
const stmtIncrementPlaylistItems = db.prepare('UPDATE playlists SET itemCount = itemCount + 1, updatedAt = @updatedAt WHERE id = @id');

const stmtGetVideosByPlaylistId = db.prepare(`
  SELECT v.*, pv.position 
  FROM videos v
  JOIN playlist_videos pv ON v.id = pv.videoId
  WHERE pv.playlistId = ?
  ORDER BY pv.position ASC
`);

const stmtUpdatePlaylistDetails = db.prepare(`
  UPDATE playlists 
  SET 
    name = COALESCE(@name, name), 
    description = COALESCE(@description, description), 
    updatedAt = @updatedAt
  WHERE id = @id
`);

// For removeVideoFromPlaylist
const stmtGetVideoPosition = db.prepare('SELECT position FROM playlist_videos WHERE playlistId = ? AND videoId = ?');
const stmtDeleteVideoFromPlaylist = db.prepare('DELETE FROM playlist_videos WHERE playlistId = ? AND videoId = ?');
const stmtDecrementPlaylistItems = db.prepare('UPDATE playlists SET itemCount = itemCount - 1, updatedAt = @updatedAt WHERE id = @id');
const stmtShiftVideoPositions = db.prepare('UPDATE playlist_videos SET position = position - 1 WHERE playlistId = ? AND position > ?');

// For deletePlaylist
const stmtDeletePlaylistById = db.prepare('DELETE FROM playlists WHERE id = ?'); // Cascade should handle playlist_videos

// For reorderVideosInPlaylist
const stmtUpdateVideoPosition = db.prepare('UPDATE playlist_videos SET position = @position, addedToPlaylistAt = @now WHERE playlistId = @playlistId AND videoId = @videoId');
const stmtUpdatePlaylistTimestamp = db.prepare('UPDATE playlists SET updatedAt = @updatedAt WHERE id = @id');

export async function createPlaylist(details: PlaylistCreationDetails): Promise<IpcResponse<{ playlistId: string }>> {
  console.log('[PlaylistManager] createPlaylist called with:', details);
  const newPlaylistId = details.youtubePlaylistId || `custom-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  const now = new Date().toISOString();
  try {
    stmtCreatePlaylist.run({
      id: newPlaylistId,
      name: details.name,
      description: details.description || null,
      source: details.source,
      youtubePlaylistId: details.youtubePlaylistId || null,
      createdAt: now,
      updatedAt: now,
    });
    return { success: true, data: { playlistId: newPlaylistId } };
  } catch (error: any) {
    console.error('[PlaylistManager] Error creating playlist:', error);
    return { success: false, error: error.message };
  }
}

export async function getAllPlaylists(): Promise<IpcResponse<Playlist[]>> {
  console.log('[PlaylistManager] getAllPlaylists called');
   try {
    const playlists = stmtGetAllPlaylists.all() as Playlist[]; 
    return { success: true, data: playlists };
  } catch (error: any) {
    console.error('[PlaylistManager] Error fetching all playlists:', error);
    return { success: false, error: error.message, data: [] };
  }
}

export async function getPlaylistById(id: string): Promise<IpcResponse<Playlist | null>> {
  console.log('[PlaylistManager] getPlaylistById called with ID:', id);
  try {
    const playlist = stmtGetPlaylistById.get(id) as Playlist | null; 
    return { success: true, data: playlist };
  } catch (error: any) {
    console.error(`[PlaylistManager] Error fetching playlist ${id}:`, error);
    return { success: false, error: error.message, data: null };
  }
}

export async function updatePlaylistDetails(id: string, details: PlaylistUpdateDetails): Promise<IpcResponse<void>> {
  console.log('[PlaylistManager] updatePlaylistDetails called for ID:', id, 'with:', details);
  const now = new Date().toISOString();
  try {
    const result = stmtUpdatePlaylistDetails.run({
      id: id,
      name: details.name,
      description: details.description,
      updatedAt: now,
    });
    if (result.changes === 0) {
      return { success: false, error: `Playlist with ID ${id} not found or no changes made.` };
    }
    return { success: true };
  } catch (error: any) {
    console.error(`[PlaylistManager] Error updating playlist ${id}:`, error);
    return { success: false, error: error.message };
  }
}

export async function deletePlaylist(id: string): Promise<IpcResponse<void>> {
  console.log('[PlaylistManager] deletePlaylist called for ID:', id);
  try {
    const result = stmtDeletePlaylistById.run(id);
    if (result.changes === 0) {
      return { success: false, error: `Playlist with ID ${id} not found.` };
    }
    // Note: Videos in the 'videos' table that were only part of this playlist are now orphaned.
    // A separate cleanup mechanism might be needed for them if desired.
    return { success: true };
  } catch (error: any) {
    console.error(`[PlaylistManager] Error deleting playlist ${id}:`, error);
    return { success: false, error: error.message };
  }
}

// Transaction function for adding a video to a playlist
const addVideoToPlaylistTransaction = db.transaction((playlistId: string, videoDetails: VideoAddDetails) => {
  const now = new Date().toISOString();

  // 1. Upsert video into videos table
  stmtUpsertVideo.run({
    id: videoDetails.id,
    url: videoDetails.url,
    title: videoDetails.title,
    thumbnailUrl: videoDetails.thumbnailUrl || null,
    addedAt: now,
  });

  // 2. Get current item count to determine new position
  const playlistInfo = stmtGetPlaylistVideoCount.get(playlistId) as Pick<Playlist, 'itemCount'> | undefined;
  if (!playlistInfo) {
    throw new Error(`Playlist with ID ${playlistId} not found.`);
  }
  const newPosition = playlistInfo.itemCount; // Position is 0-indexed, itemCount is 1-based count before adding

  // 3. Add to playlist_videos junction table
  stmtAddVideoToPlaylistJunction.run({
    playlistId: playlistId,
    videoId: videoDetails.id,
    position: newPosition, 
    addedToPlaylistAt: now,
  });

  // 4. Increment itemCount in playlists table and update timestamp
  stmtIncrementPlaylistItems.run({ id: playlistId, updatedAt: now });
  
  return { playlistId, videoId: videoDetails.id, position: newPosition };
});

export async function addVideoToPlaylist(playlistId: string, videoDetails: VideoAddDetails): Promise<IpcResponse<void>> {
  console.log('[PlaylistManager] addVideoToPlaylist called for playlist ID:', playlistId, 'with video:', videoDetails);
  try {
    addVideoToPlaylistTransaction(playlistId, videoDetails);
    return { success: true };
  } catch (error: any) {
    console.error(`[PlaylistManager] Error adding video ${videoDetails.id} to playlist ${playlistId}:`, error);
    if (error.code === 'SQLITE_CONSTRAINT_PRIMARYKEY') {
        return { success: false, error: `Video '${videoDetails.title}' is already in this playlist.` };
    }
    return { success: false, error: error.message };
  }
}

export async function getVideosByPlaylistId(playlistId: string): Promise<IpcResponse<PlaylistVideo[]>> {
  console.log('[PlaylistManager] getVideosByPlaylistId called for playlist ID:', playlistId);
  try {
    const videos = stmtGetVideosByPlaylistId.all(playlistId) as PlaylistVideo[];
    return { success: true, data: videos };
  } catch (error: any) {
    console.error(`[PlaylistManager] Error fetching videos for playlist ${playlistId}:`, error);
    return { success: false, error: error.message, data: [] };
  }
}

// Transaction for removing a video from a playlist
const removeVideoFromPlaylistTransaction = db.transaction((playlistId: string, videoId: string) => {
  const videoPosInfo = stmtGetVideoPosition.get(playlistId, videoId) as { position: number } | undefined;
  if (!videoPosInfo) {
    throw new Error(`Video with ID ${videoId} not found in playlist ${playlistId}.`);
  }
  const removedPosition = videoPosInfo.position;

  // 1. Delete the video from playlist_videos
  const deleteResult = stmtDeleteVideoFromPlaylist.run(playlistId, videoId);
  if (deleteResult.changes === 0) {
    // Should not happen if stmtGetVideoPosition found it, but good to check
    throw new Error(`Failed to delete video ${videoId} from playlist ${playlistId}.`);
  }

  // 2. Decrement itemCount in playlists and update timestamp
  const now = new Date().toISOString();
  stmtDecrementPlaylistItems.run({ id: playlistId, updatedAt: now });

  // 3. Shift positions of subsequent videos
  stmtShiftVideoPositions.run(playlistId, removedPosition);
  
  return { playlistId, videoId, removedPosition };
});

export async function removeVideoFromPlaylist(playlistId: string, videoId: string): Promise<IpcResponse<void>> {
  console.log('[PlaylistManager] removeVideoFromPlaylist called for playlist ID:', playlistId, 'video ID:', videoId);
  try {
    removeVideoFromPlaylistTransaction(playlistId, videoId);
    return { success: true };
  } catch (error: any) {
    console.error(`[PlaylistManager] Error removing video ${videoId} from playlist ${playlistId}:`, error);
    return { success: false, error: error.message };
  }
}

// Transaction for reordering videos in a playlist
const reorderVideosTransaction = db.transaction((playlistId: string, videoIdsInOrder: string[]) => {
  const now = new Date().toISOString();
  for (let i = 0; i < videoIdsInOrder.length; i++) {
    stmtUpdateVideoPosition.run({
      playlistId: playlistId,
      videoId: videoIdsInOrder[i],
      position: i,
      now: now // Using 'now' for addedToPlaylistAt to refresh it, or use existing if preferred
    });
  }
  // Update the playlist's own updatedAt timestamp
  stmtUpdatePlaylistTimestamp.run({ id: playlistId, updatedAt: now });
  return { count: videoIdsInOrder.length }; 
});

export async function reorderVideosInPlaylist(playlistId: string, videoIdsInOrder: string[]): Promise<IpcResponse<void>> {
  console.log('[PlaylistManager] reorderVideosInPlaylist called for playlist ID:', playlistId, 'with order:', videoIdsInOrder);
  try {
    if (!videoIdsInOrder || videoIdsInOrder.length === 0) {
      // If an empty array is passed, we might just update the timestamp or do nothing.
      // For now, let's consider it a success if there's nothing to reorder.
      // Alternatively, could update just the timestamp if that makes sense.
      // stmtUpdatePlaylistTimestamp.run({ id: playlistId, updatedAt: new Date().toISOString() });
      return { success: true }; 
    }
    reorderVideosTransaction(playlistId, videoIdsInOrder);
    return { success: true };
  } catch (error: any) {
    console.error(`[PlaylistManager] Error reordering videos in playlist ${playlistId}:`, error);
    return { success: false, error: error.message };
  }
}

// Placeholder for a function that would use yt-dlp to fetch playlist details
async function fetchPlaylistDetailsFromYouTube(url: string): Promise<{ title: string; description?: string; youtubePlaylistId: string; videos: VideoAddDetails[] }> {
  // Simulate fetching data. In a real scenario, this would call yt-dlp.
  console.log(`[PlaylistManager] Simulating fetch for YouTube playlist URL: ${url}`)
  // Extract a potential YouTube Playlist ID from the URL for simulation
  const playlistIdMatch = url.match(/[?&]list=([^&]+)/);
  const extractedId = playlistIdMatch ? playlistIdMatch[1] : `yt-sim-${Date.now()}`;

  // Simulate some delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // Mocked data
  return {
    title: `Simulated YouTube Playlist - ${extractedId}`,
    description: "This is a simulated playlist imported from YouTube.",
    youtubePlaylistId: extractedId,
    videos: [
      { id: `sim-vid-1-${extractedId}`, url: `https://www.youtube.com/watch?v=sim-vid-1-${extractedId}`, title: "Simulated Video 1" , thumbnailUrl: `https://i.ytimg.com/vi/sim-vid-1-${extractedId}/hqdefault.jpg` },
      { id: `sim-vid-2-${extractedId}`, url: `https://www.youtube.com/watch?v=sim-vid-2-${extractedId}`, title: "Simulated Video 2" , thumbnailUrl: `https://i.ytimg.com/vi/sim-vid-2-${extractedId}/hqdefault.jpg` },
    ],
  };
}

export async function importPlaylistFromUrl(url: string): Promise<IpcResponse<{ playlistId: string }>> {
  console.log('[PlaylistManager] importPlaylistFromUrl called with URL:', url);
  try {
    // 1. Fetch playlist details from YouTube (simulated)
    const fetchedDetails = await fetchPlaylistDetailsFromYouTube(url);

    // 2. Create the new playlist in the database
    const createResponse = await createPlaylist({
      name: fetchedDetails.title,
      description: fetchedDetails.description,
      source: 'youtube',
      youtubePlaylistId: fetchedDetails.youtubePlaylistId,
    });

    if (!createResponse.success || !createResponse.data?.playlistId) {
      throw new Error(createResponse.error || 'Failed to create playlist entry in database.');
    }
    const newPlaylistId = createResponse.data.playlistId;

    // 3. Add videos to the newly created playlist (if any)
    if (fetchedDetails.videos && fetchedDetails.videos.length > 0) {
      // It's important that addVideoToPlaylistTransaction (or a similar bulk version) is robust.
      // For simplicity, calling addVideoToPlaylist in a loop.
      // A bulk transaction here would be more performant for many videos.
      for (const video of fetchedDetails.videos) {
        await addVideoToPlaylist(newPlaylistId, video); 
      }
    }

    return { success: true, data: { playlistId: newPlaylistId } };
  } catch (error: any) {
    console.error(`[PlaylistManager] Error importing playlist from URL ${url}:`, error);
    return { success: false, error: error.message };
  }
} 