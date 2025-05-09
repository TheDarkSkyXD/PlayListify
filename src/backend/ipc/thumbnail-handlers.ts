import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '../../shared/constants/ipc-channels';
import {
  getThumbnailForVideo,
  getThumbnailForPlaylist,
  clearThumbnailCache,
} from '../services/thumbnailService'; // Assuming service file is named thumbnailService.ts
import type { IpcResponse } from '../../shared/types';

export function registerThumbnailHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.THUMBNAIL_GET_FOR_VIDEO, async (_event, videoId: string, videoUrl?: string): Promise<IpcResponse<{ thumbnailPathOrUrl: string | null }>> => {
    console.log('IPC: THUMBNAIL_GET_FOR_VIDEO received for video ID:', videoId);
    return getThumbnailForVideo(videoId, videoUrl);
  });

  ipcMain.handle(IPC_CHANNELS.THUMBNAIL_GET_FOR_PLAYLIST, async (_event, playlistId: string): Promise<IpcResponse<{ thumbnailPathOrUrl: string | null }>> => {
    console.log('IPC: THUMBNAIL_GET_FOR_PLAYLIST received for playlist ID:', playlistId);
    return getThumbnailForPlaylist(playlistId);
  });

  ipcMain.handle(IPC_CHANNELS.THUMBNAIL_CLEAR_CACHE, async (): Promise<IpcResponse<void>> => {
    console.log('IPC: THUMBNAIL_CLEAR_CACHE received');
    return clearThumbnailCache();
  });

  console.log('IPC thumbnail handlers registered and calling ThumbnailManager. ⚙️');
} 