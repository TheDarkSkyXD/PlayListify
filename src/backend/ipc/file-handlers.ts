import { ipcMain, dialog } from 'electron';
import {
    createPlaylistDir,
    writePlaylistMetadata,
    readPlaylistMetadata,
    deletePlaylistDir,
    getVideoPath,
    videoFileExists,
    deleteVideoFile
} from '../utils/fileUtils'; // Assuming fileUtils.ts exists and is correct
import { Playlist } from '../../shared/types/playlist'; // Assuming this type path is correct
import { IPC_CHANNELS } from '../../shared/constants/ipc-channels';

export function registerFileHandlers(): void {
    ipcMain.handle(IPC_CHANNELS.CREATE_PLAYLIST_DIR, async (event, playlistName: string) => {
        return createPlaylistDir(playlistName);
    });

    ipcMain.handle(IPC_CHANNELS.WRITE_PLAYLIST_METADATA, async (event, playlistName: string, playlistData: Playlist) => {
        await writePlaylistMetadata(playlistName, playlistData);
    });

    ipcMain.handle(IPC_CHANNELS.READ_PLAYLIST_METADATA, async (event, playlistName: string) => {
        return readPlaylistMetadata(playlistName);
    });

    ipcMain.handle(IPC_CHANNELS.DELETE_PLAYLIST_DIR, async (event, playlistName: string) => {
        return deletePlaylistDir(playlistName);
    });

    ipcMain.handle(IPC_CHANNELS.GET_VIDEO_PATH, async (event, playlistName: string, videoId: string, format: string = 'mp4') => {
        return getVideoPath(playlistName, videoId, format);
    });

    ipcMain.handle(IPC_CHANNELS.VIDEO_FILE_EXISTS, async (event, playlistName: string, videoId: string, format: string = 'mp4') => {
        return videoFileExists(playlistName, videoId, format);
    });

    ipcMain.handle(IPC_CHANNELS.DELETE_VIDEO_FILE, async (event, playlistName: string, videoId: string, format: string = 'mp4') => {
        await deleteVideoFile(playlistName, videoId, format);
    });

    ipcMain.handle(IPC_CHANNELS.OPEN_DIRECTORY_DIALOG, async (event, options: Electron.OpenDialogOptions) => {
        const result = await dialog.showOpenDialog(options);
        return result;
    });

    console.log('IPC file handlers registered. ⚙️'); // Updated log message
} 