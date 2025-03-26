import { Playlist, Video } from '../../shared/types/appTypes';

// Temporary mock data for development purposes
const MOCK_PLAYLISTS: Playlist[] = [
  {
    id: 'pl1',
    name: 'Favorite Music',
    description: 'My favorite music collection',
    videos: [
      {
        id: 'vid1',
        title: 'Awesome Song 1',
        url: 'https://youtube.com/watch?v=abcdef1',
        thumbnail: 'https://i.ytimg.com/vi/abcdef1/hqdefault.jpg',
        duration: 245,
        status: 'available',
        downloaded: false,
        addedAt: '2025-03-20T00:00:00.000Z'
      },
      {
        id: 'vid2',
        title: 'Awesome Song 2',
        url: 'https://youtube.com/watch?v=abcdef2',
        thumbnail: 'https://i.ytimg.com/vi/abcdef2/hqdefault.jpg',
        duration: 198,
        status: 'available',
        downloaded: false,
        addedAt: '2025-03-20T00:00:00.000Z'
      }
    ],
    createdAt: '2025-03-20T00:00:00.000Z',
    updatedAt: '2025-03-22T00:00:00.000Z',
    thumbnail: 'https://i.ytimg.com/vi/abcdef1/hqdefault.jpg',
  },
  {
    id: 'pl2',
    name: 'Programming Tutorials',
    description: 'Helpful programming tutorials',
    videos: [
      {
        id: 'vid3',
        title: 'Learn React in 1 Hour',
        url: 'https://youtube.com/watch?v=abcdef3',
        thumbnail: 'https://i.ytimg.com/vi/abcdef3/hqdefault.jpg',
        duration: 3600,
        status: 'available',
        downloaded: false,
        addedAt: '2025-03-15T00:00:00.000Z'
      }
    ],
    createdAt: '2025-03-15T00:00:00.000Z',
    updatedAt: '2025-03-15T00:00:00.000Z',
    thumbnail: 'https://i.ytimg.com/vi/abcdef3/hqdefault.jpg',
  }
];

// Simulate API request delay
const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Fetches all playlists
 */
export const fetchPlaylists = async (): Promise<Playlist[]> => {
  // Simulate network request
  await delay(800);
  return [...MOCK_PLAYLISTS];
};

/**
 * Fetches a single playlist by ID
 */
export const fetchPlaylistById = async (id: string): Promise<Playlist | null> => {
  await delay(500);
  const playlist = MOCK_PLAYLISTS.find(pl => pl.id === id);
  return playlist ? { ...playlist } : null;
};

/**
 * Creates a new playlist
 */
export const createPlaylist = async (playlist: Omit<Playlist, 'id' | 'createdAt' | 'updatedAt'>): Promise<Playlist> => {
  await delay(600);
  const newPlaylist: Playlist = {
    ...playlist,
    id: `pl${Math.random().toString(36).substring(2, 9)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  // In a real app, we would save this to the backend
  // For now we'll just return the new playlist
  return newPlaylist;
};

/**
 * Updates an existing playlist
 */
export const updatePlaylist = async (id: string, playlist: Partial<Playlist>): Promise<Playlist> => {
  await delay(600);
  const existingPlaylist = MOCK_PLAYLISTS.find(pl => pl.id === id);
  
  if (!existingPlaylist) {
    throw new Error(`Playlist with ID ${id} not found`);
  }
  
  const updatedPlaylist: Playlist = {
    ...existingPlaylist,
    ...playlist,
    updatedAt: new Date().toISOString(),
  };
  
  // In a real app, we would update the backend
  return updatedPlaylist;
};

/**
 * Deletes a playlist
 */
export const deletePlaylist = async (id: string): Promise<void> => {
  await delay(500);
  // In a real app, we would delete from the backend
};

/**
 * Imports a playlist from YouTube
 */
export const importPlaylist = async (url: string): Promise<Playlist> => {
  await delay(1000);
  // In a real app, we would call the backend to import from YouTube
  // For now, just return a mock playlist
  const now = new Date().toISOString();
  return {
    id: `pl${Math.random().toString(36).substring(2, 9)}`,
    name: `Imported Playlist ${new Date().toLocaleString()}`,
    description: 'Imported from YouTube',
    videos: [],
    createdAt: now,
    updatedAt: now,
    source: 'youtube',
    sourceUrl: url,
  };
}; 