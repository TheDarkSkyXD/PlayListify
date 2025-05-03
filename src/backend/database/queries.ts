// Export all database query functions from a central file

// Playlist queries
export * from './playlistQueries';

// Video queries
export * from './videoQueries';

// PlaylistVideo queries
export * from './playlistVideoQueries';

// History queries
export * from './historyQueries';

/**
 * This file serves as a central export point for all database queries.
 * It allows consumers to import from a single location:
 * 
 * import { createPlaylist, getVideoById, addVideoToPlaylist } from './database/queries';
 * 
 * Instead of having to import from multiple files:
 * 
 * import { createPlaylist } from './database/playlistQueries';
 * import { getVideoById } from './database/videoQueries';
 * import { addVideoToPlaylist } from './database/playlistVideoQueries';
 */ 