// Query keys for React Query
export const QUERY_KEYS = {
  playlists: 'playlists',
  playlist: (id: string) => ['playlist', id],
  videos: 'videos',
  settings: 'settings'
};
