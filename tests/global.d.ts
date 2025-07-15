interface Window {
  api: {
    getPlaylistDetails: (playlistId: string) => Promise<{ playlist: any; videos: any[] }>;
    [key: string]: any;
  };
}