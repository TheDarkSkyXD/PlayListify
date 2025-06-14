// src/backend/services/playlistService.ts
import { Playlist, Video, PlaylistCreateInput, PlaylistUpdateInput } from '../../shared/types';
import YtDlpWrap from 'yt-dlp-wrap';
import crypto from 'crypto'; // For generating local IDs

// Configure yt-dlp path if necessary (this might be handled globally or via config)
// const ytDlpWrap = new YtDlpWrap('/path/to/yt-dlp'); // Example, actual path needs to be determined

let playlistsDB: Playlist[] = []; // In-memory database for now

// --- Helper Functions ---
function generateId(): string {
  return crypto.randomUUID();
}

// --- Service Functions ---

/**
 * Creates a new playlist.
 */
export async function createPlaylist(playlistData: PlaylistCreateInput): Promise<Playlist> {
  const newPlaylist: Playlist = {
    id: playlistData.youtubePlaylistId || generateId(), // Use YouTube ID if available, else generate
    name: playlistData.name,
    description: playlistData.description,
    videos: playlistData.videos || [],
    videoCount: playlistData.videos?.length || 0,
    source: playlistData.source,
    youtubePlaylistId: playlistData.youtubePlaylistId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  playlistsDB.push(newPlaylist);
  console.log('[playlistService] Created playlist:', newPlaylist);
  return newPlaylist;
}

/**
 * Retrieves all playlists.
 */
export async function getPlaylists(): Promise<Playlist[]> {
  console.log('[playlistService] Fetching all playlists');
  return [...playlistsDB]; // Return a copy
}

/**
 * Retrieves a playlist by its ID.
 */
export async function getPlaylistById(id: string): Promise<Playlist | null> {
  console.log(`[playlistService] Fetching playlist by ID: ${id}`);
  const playlist = playlistsDB.find(p => p.id === id);
  return playlist || null;
}

/**
 * Updates an existing playlist.
 */
export async function updatePlaylist(id: string, playlistUpdateData: PlaylistUpdateInput): Promise<Playlist | null> {
  console.log(`[playlistService] Updating playlist ID: ${id}`);
  const playlistIndex = playlistsDB.findIndex(p => p.id === id);
  if (playlistIndex === -1) {
    console.warn(`[playlistService] Playlist with ID ${id} not found for update.`);
    return null;
  }

  const existingPlaylist = playlistsDB[playlistIndex];
  const updatedPlaylist: Playlist = {
    ...existingPlaylist,
    ...playlistUpdateData,
    videos: playlistUpdateData.videos !== undefined ? playlistUpdateData.videos : existingPlaylist.videos, // Handle videos update carefully
    videoCount: playlistUpdateData.videos !== undefined ? playlistUpdateData.videos.length : existingPlaylist.videoCount,
    updatedAt: new Date().toISOString(),
  };

  playlistsDB[playlistIndex] = updatedPlaylist;
  console.log('[playlistService] Updated playlist:', updatedPlaylist);
  return updatedPlaylist;
}

/**
 * Deletes a playlist by its ID.
 */
export async function deletePlaylist(id: string): Promise<boolean> {
  console.log(`[playlistService] Deleting playlist ID: ${id}`);
  const initialLength = playlistsDB.length;
  playlistsDB = playlistsDB.filter(p => p.id !== id);
  const success = playlistsDB.length < initialLength;
  if (success) {
    console.log(`[playlistService] Playlist with ID ${id} deleted.`);
  } else {
    console.warn(`[playlistService] Playlist with ID ${id} not found for deletion.`);
  }
  return success;
}

/**
 * Imports a playlist from a YouTube URL.
 * This is a placeholder and will need actual yt-dlp integration.
 * The path to yt-dlp executable needs to be correctly configured.
 */
export async function importYouTubePlaylist(youtubeUrl: string): Promise<Playlist> {
  console.log(`[playlistService] Importing YouTube playlist from URL: ${youtubeUrl}`);
  
  // Initialize YtDlpWrap - path needs to be dynamic or configurable
  // This is a critical part that depends on how yt-dlp is packaged/located
  // For now, let's assume it's in a known location or use a placeholder path.
  // A robust solution would involve getting the path from a config or environment variable.
  // Or using the pathUtils if yt-dlp is bundled within the app.
  
  // const ytDlpPath = await getElectronYtDlpPath(); // Example: if pathUtils provides it
  // const ytDlpWrap = new YtDlpWrap(ytDlpPath);
  
  // For demonstration, we'll use a hardcoded path. THIS IS NOT PRODUCTION READY.
  // You MUST replace this with a proper path resolution mechanism.
  // e.g. from environment variable process.env.YT_DLP_PATH or a configuration file.
  // Or, if yt-dlp-wrap is bundled with a binary, it might find it automatically.
  // Check yt-dlp-wrap documentation for how it resolves the binary path.
  
  let ytDlpWrapInstance: YtDlpWrap;
  try {
    // Attempt to initialize without a path, relying on yt-dlp-wrap's internal resolution
    // or system PATH. This is often problematic in packaged Electron apps.
    ytDlpWrapInstance = new YtDlpWrap(); 
    // A better approach would be to get the path explicitly, e.g., from `pathUtils.ts`
    // if `pathUtils.ts` is designed to provide the path to the bundled yt-dlp executable.
    // For example:
    // import { getYtDlpPath } from '../utils/pathUtils'; // Assuming pathUtils offers this
    // const DYNAMIC_YT_DLP_PATH = getYtDlpPath();
    // ytDlpWrapInstance = new YtDlpWrap(DYNAMIC_YT_DLP_PATH);

  } catch (error) {
    console.error('[playlistService] Failed to initialize YtDlpWrap. yt-dlp executable might not be found.', error);
    throw new Error('Failed to initialize YouTube downloader. Please ensure yt-dlp is configured correctly.');
  }

  try {
    const metadata = await ytDlpWrapInstance.getVideoInfo(youtubeUrl);
    
    // Type cast metadata if necessary, as yt-dlp-wrap might return a generic object
    const playlistInfo = metadata as any; // Adjust this cast based on actual yt-dlp-wrap output structure

    if (!playlistInfo.title || !playlistInfo.id) {
        throw new Error('Could not extract playlist title or ID from YouTube metadata.');
    }
    
    const videos: Video[] = (playlistInfo.entries || []).map((entry: any) => ({
      id: entry.id,
      title: entry.title || 'Unknown Title',
      url: entry.webpage_url || `https://www.youtube.com/watch?v=${entry.id}`,
      thumbnailUrl: entry.thumbnail,
      duration: entry.duration,
      // Add other relevant fields if available from yt-dlp output
    }));

    const playlistCreateData: PlaylistCreateInput = {
      name: playlistInfo.title,
      description: playlistInfo.description || '',
      videos: videos,
      source: 'youtube',
      youtubePlaylistId: playlistInfo.id,
    };

    // Check if playlist already exists by youtubePlaylistId
    const existingPlaylist = playlistsDB.find(p => p.youtubePlaylistId === playlistInfo.id);
    if (existingPlaylist) {
      console.log(`[playlistService] YouTube playlist ${playlistInfo.id} already exists. Updating it.`);
      // Optionally, update the existing playlist instead of throwing an error or creating a duplicate
      // For now, let's just return the existing one or update it.
      // This part of the logic (update vs. error vs. new) should be clarified by requirements.
      // Let's assume an update if found.
      const updatedPlaylist = await updatePlaylist(existingPlaylist.id, {
        name: playlistInfo.title,
        description: playlistInfo.description || '',
        videos: videos, // This replaces all videos
      });
      if (!updatedPlaylist) {
        // This case should ideally not be reached if existingPlaylist.id was valid
        console.error(`[playlistService] Failed to update existing playlist with ID: ${existingPlaylist.id} during import.`);
        throw new Error(`Failed to update existing playlist during import: ${existingPlaylist.name}`);
      }
      return updatedPlaylist;
    }

    const importedPlaylist = await createPlaylist(playlistCreateData);
    console.log('[playlistService] Successfully imported YouTube playlist:', importedPlaylist);
    return importedPlaylist;

  } catch (error) {
    console.error(`[playlistService] Error importing YouTube playlist: ${youtubeUrl}`, error);
    // Provide a more user-friendly error or re-throw a custom error
    if (error instanceof Error) {
        throw new Error(`Failed to import YouTube playlist: ${error.message}`);
    }
    throw new Error('An unknown error occurred while importing the YouTube playlist.');
  }
}

// TODO:
// 1. Implement proper yt-dlp path configuration for YtDlpWrap.
//    - This is CRITICAL. The current hardcoded/default path approach is unreliable.
//    - Consider using `pathUtils.ts` or an environment variable.
// 2. Refine the structure of data returned by yt-dlp-wrap and map it robustly to `Video` and `Playlist` types.
//    - The `as any` cast for `playlistInfo` and `entry` is a temporary measure.
// 3. Implement more sophisticated error handling.
// 4. If using `better-sqlite3` later, replace the in-memory `playlistsDB` array
//    with database interaction logic.
// 5. Add JSDoc comments to all exported functions for better clarity.