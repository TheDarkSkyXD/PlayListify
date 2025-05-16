import { ipcMain, IpcMainInvokeEvent } from 'electron';
import { IPC_CHANNELS } from '../../shared/constants/ipc-channels';
import {
  getThumbnailForVideo,
  getThumbnailForPlaylist,
  clearThumbnailCache,
} from '../services/thumbnail-manager'; // Corrected import path
import type { IpcResponse, YtDlpVideoInfoRaw } from '../../shared/types';
import { getVideoMetadata } from '../services/ytDlpManager'; // Correctly import from manager
import { logger } from '../utils/logger'; // Import logger

export function registerThumbnailHandlers(): void {
  /* 
  // Commenting out as previews now use direct URL from metadata
  // and caching logic is deferred until video download implementation.
  ipcMain.handle(
    IPC_CHANNELS.THUMBNAIL_GET_FOR_VIDEO,
    async (
      _event: IpcMainInvokeEvent, 
      videoId: string,
      thumbnailUrl?: string
    ): Promise<IpcResponse<{ thumbnailPathOrUrl: string | null }>> => {
      logger.info('[IPC:THUMBNAIL_GET_FOR_VIDEO] Received for video ID:', videoId, 'Thumbnail URL:', thumbnailUrl);

      if (!thumbnailUrl) {
        logger.warn('[IPC:THUMBNAIL_GET_FOR_VIDEO] No thumbnail URL provided for video ID:', videoId);
        return { success: false, error: 'No thumbnail URL provided from frontend.', data: { thumbnailPathOrUrl: null } };
      }

      const serviceResponse = await getThumbnailForVideo(videoId, thumbnailUrl === null ? undefined : thumbnailUrl);

      type ResponseDataType = { thumbnailPathOrUrl: string | null };

      if (serviceResponse.success) {
        const pathValue: string | null = serviceResponse.data ?? null;
        const responseData: ResponseDataType = { thumbnailPathOrUrl: pathValue };
        return {
          success: true,
          data: responseData
        };
      } else {
        const responseData: ResponseDataType = { thumbnailPathOrUrl: null };
        return {
          success: false,
          error: serviceResponse.error,
          data: responseData
        };
      }
    }
  );
  */

  ipcMain.handle(IPC_CHANNELS.THUMBNAIL_GET_FOR_PLAYLIST, async (_event, playlistId: string): Promise<IpcResponse<{ thumbnailPathOrUrl: string | null }>> => {
    logger.info('IPC: THUMBNAIL_GET_FOR_PLAYLIST received for playlist ID:', playlistId);
    const serviceResponse = await getThumbnailForPlaylist(playlistId);
    
    // Define the expected shape of the data part of the response
    type ResponseDataType = { thumbnailPathOrUrl: string | null };

    if (serviceResponse.success) {
       const pathValue: string | null = serviceResponse.data ?? null;
       const responseData: ResponseDataType = { thumbnailPathOrUrl: pathValue };
       return {
          success: true,
          data: responseData
        };
    } else {
      const responseData: ResponseDataType = { thumbnailPathOrUrl: null };
      return {
          success: false,
          error: serviceResponse.error,
          data: responseData
        };
    }
  });

  ipcMain.handle(IPC_CHANNELS.THUMBNAIL_CLEAR_CACHE, async (): Promise<IpcResponse<void>> => {
    console.log('IPC: THUMBNAIL_CLEAR_CACHE received');
    return clearThumbnailCache();
  });

  console.log('IPC thumbnail handlers registered and calling ThumbnailManager.');
} 