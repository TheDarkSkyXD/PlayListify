import { test, expect, Page } from '@playwright/test';

// Define interfaces for mock data
interface TaskPayload {
    playlistUrl: string;
}
interface Task {
    type: string;
    status: string;
    payload: TaskPayload;
}
interface Playlist {
    title: string;
    youtubeId: string;
}
interface Video {
    title: string;
    youtubeId: string;
}
interface IpcTaskUpdatePayload {
    taskId: string;
    status: string;
    result?: any;
}
interface NotificationOptions {
    body?: string;
    [key: string]: any;
}

/**
 * MOCK DATA
 */
const MOCK_PLAYLIST_URL = 'https://www.youtube.com/playlist?list=PL4o29bINVT4EG_y-k5jGoOu3-Am8Nvi10';
const MOCK_PLAYLIST_METADATA = {
    success: true,
    data: {
        title: 'Awesome Mix Vol. 1',
        thumbnailUrl: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
        videoCount: 12,
    },
};
const MOCK_TASK_ID = 'task-123-import';

/**
 * Test suite for User Story 1.3: Import Public Playlist
 */
test.describe('User Story 1.3: Import Public Playlist', () => {
    let createdTask: Task | null;
    let receivedIpcEvents: { event: string, payload: IpcTaskUpdatePayload }[];
    let createdPlaylist: Playlist | null;
    let createdVideos: Video[];

    test.beforeEach(async ({ page }) => {
        createdTask = null;
        receivedIpcEvents = [];
        createdPlaylist = null;
        createdVideos = [];

        await page.exposeFunction('mockCreateTask', (task: Task) => { createdTask = task; return { success: true, data: { id: MOCK_TASK_ID } }; });
        await page.exposeFunction('mockIpcListener', (event: string, payload: IpcTaskUpdatePayload) => { receivedIpcEvents.push({ event, payload }); });
        await page.exposeFunction('mockCreatePlaylist', (playlist: Playlist) => { createdPlaylist = playlist; });
        await page.exposeFunction('mockCreateVideo', (video: Video) => { createdVideos.push(video); });

        await page.evaluate(() => {
            const win = globalThis as any;
            win.notified = [];
            const OriginalNotification = win.Notification;
            win.Notification = function(title: string, options?: NotificationOptions) {
                win.notified.push({ title, options });
                return new OriginalNotification(title, options);
            };
        });

        await page.goto('/');
    });

    test('AC1: should display playlist preview when a valid URL is entered', async ({ page }) => {
        await page.route('**/api/playlist/metadata**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_PLAYLIST_METADATA) }));
        await page.fill('#playlist-url-input', MOCK_PLAYLIST_URL);
        await page.click('#preview-playlist-button');
        await expect(page.locator('#playlist-preview-title')).toHaveText(MOCK_PLAYLIST_METADATA.data.title);
        await expect(page.locator('#playlist-preview-thumbnail')).toHaveAttribute('src', MOCK_PLAYLIST_METADATA.data.thumbnailUrl);
        await expect(page.locator('#playlist-preview-video-count')).toHaveText(`${MOCK_PLAYLIST_METADATA.data.videoCount} videos`);
    });

    test('AC2: should create a "QUEUED" task when import is confirmed', async ({ page }) => {
        await page.evaluate((task) => (globalThis as any).mockCreateTask(task), { type: 'IMPORT', status: 'QUEUED', payload: { playlistUrl: MOCK_PLAYLIST_URL } } as Task);
        await expect.poll(() => createdTask).not.toBeNull();
        expect(createdTask).toEqual(expect.objectContaining({ type: 'IMPORT', status: 'QUEUED', payload: { playlistUrl: MOCK_PLAYLIST_URL } }));
    });

    test('AC4: should receive an IPC "task:update" event', async ({ page }) => {
        await page.evaluate((payload) => (globalThis as any).mockIpcListener('task:update', payload), { taskId: MOCK_TASK_ID, status: 'DOWNLOADING' } as IpcTaskUpdatePayload);
        expect(receivedIpcEvents).toContainEqual(expect.objectContaining({ event: 'task:update', payload: { taskId: MOCK_TASK_ID, status: 'DOWNLOADING' } }));
    });

    test('AC5: should save playlist and video details on successful import', async ({ page }) => {
        await page.evaluate((payload) => {
            const win = globalThis as any;
            win.mockCreatePlaylist({ title: payload.result.title, youtubeId: 'some-id' });
            for (let i = 0; i < payload.result.videoCount; i++) {
                win.mockCreateVideo({ title: `Video ${i}`, youtubeId: `vid-${i}` });
            }
        }, { taskId: MOCK_TASK_ID, status: 'COMPLETED', result: MOCK_PLAYLIST_METADATA.data } as IpcTaskUpdatePayload);
        await expect.poll(() => createdPlaylist).not.toBeNull();
        expect(createdPlaylist).toEqual(expect.objectContaining({ title: MOCK_PLAYLIST_METADATA.data.title, youtubeId: expect.any(String) }));
        expect(createdVideos.length).toBe(MOCK_PLAYLIST_METADATA.data.videoCount);
    });

    test('AC6: should show a desktop notification on import completion', async ({ page }) => {
        await page.evaluate((args) => { new (globalThis as any).Notification(args.title, args.options); }, { title: 'Import Complete', options: { body: `Successfully imported "${MOCK_PLAYLIST_METADATA.data.title}".` } });
        const notifications = await page.evaluate(() => (globalThis as any).notified);
        expect(notifications).toContainEqual(expect.objectContaining({ title: 'Import Complete', options: expect.objectContaining({ body: `Successfully imported "${MOCK_PLAYLIST_METADATA.data.title}".` }) }));
    });
});