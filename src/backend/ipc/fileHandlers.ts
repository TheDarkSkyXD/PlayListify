import { ipcMain, dialog } from 'electron';
import {
    createPlaylistDir,
    writePlaylistMetadata,
    readPlaylistMetadata,
    deletePlaylistDir,
    getVideoPath,
    videoFileExists,
    deleteVideoFile
} from '../utils/fileUtils';
import { Playlist } from '../../shared/types/playlist';

export function registerFileHandlers(): void {
    ipcMain.handle('fs:createPlaylistDir', async (event, playlistName: string) => {
        return createPlaylistDir(playlistName);
    });

    ipcMain.handle('fs:writePlaylistMetadata', async (event, playlistName: string, playlistData: Playlist) => {
        await writePlaylistMetadata(playlistName, playlistData);
    });

    ipcMain.handle('fs:readPlaylistMetadata', async (event, playlistName: string) => {
        return readPlaylistMetadata(playlistName);
    });

    ipcMain.handle('fs:deletePlaylistDir', async (event, playlistName: string) => {
        return deletePlaylistDir(playlistName);
    });

    ipcMain.handle('fs:getVideoPath', async (event, playlistName: string, videoId: string, format: string = 'mp4') => {
        return getVideoPath(playlistName, videoId, format);
    });

    ipcMain.handle('fs:videoFileExists', async (event, playlistName: string, videoId: string, format: string = 'mp4') => {
        return videoFileExists(playlistName, videoId, format);
    });

    ipcMain.handle('fs:deleteVideoFile', async (event, playlistName: string, videoId: string, format: string = 'mp4') => {
        await deleteVideoFile(playlistName, videoId, format);
    });

    ipcMain.handle('fs:openDialog', async (event, options: Electron.OpenDialogOptions) => {
        const result = await dialog.showOpenDialog(options);
        return result;
    });

    console.log('IPC file handlers registered.');
} 