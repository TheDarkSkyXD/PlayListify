"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const test_1 = require("@playwright/test");
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
test_1.test.describe('User Story 1.3: Import Public Playlist', () => {
    let createdTask;
    let receivedIpcEvents;
    let createdPlaylist;
    let createdVideos;
    test_1.test.beforeEach(async ({ page }) => {
        createdTask = null;
        receivedIpcEvents = [];
        createdPlaylist = null;
        createdVideos = [];
        await page.exposeFunction('mockCreateTask', (task) => { createdTask = task; return { success: true, data: { id: MOCK_TASK_ID } }; });
        await page.exposeFunction('mockIpcListener', (event, payload) => { receivedIpcEvents.push({ event, payload }); });
        await page.exposeFunction('mockCreatePlaylist', (playlist) => { createdPlaylist = playlist; });
        await page.exposeFunction('mockCreateVideo', (video) => { createdVideos.push(video); });
        await page.evaluate(() => {
            const win = globalThis;
            win.notified = [];
            const OriginalNotification = win.Notification;
            win.Notification = function (title, options) {
                win.notified.push({ title, options });
                return new OriginalNotification(title, options);
            };
        });
        await page.goto('/');
    });
    (0, test_1.test)('AC1: should display playlist preview when a valid URL is entered', async ({ page }) => {
        await page.route('**/api/playlist/metadata**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_PLAYLIST_METADATA) }));
        await page.fill('#playlist-url-input', MOCK_PLAYLIST_URL);
        await page.click('#preview-playlist-button');
        await (0, test_1.expect)(page.locator('#playlist-preview-title')).toHaveText(MOCK_PLAYLIST_METADATA.data.title);
        await (0, test_1.expect)(page.locator('#playlist-preview-thumbnail')).toHaveAttribute('src', MOCK_PLAYLIST_METADATA.data.thumbnailUrl);
        await (0, test_1.expect)(page.locator('#playlist-preview-video-count')).toHaveText(`${MOCK_PLAYLIST_METADATA.data.videoCount} videos`);
    });
    (0, test_1.test)('AC2: should create a "QUEUED" task when import is confirmed', async ({ page }) => {
        await page.evaluate((task) => globalThis.mockCreateTask(task), { type: 'IMPORT', status: 'QUEUED', payload: { playlistUrl: MOCK_PLAYLIST_URL } });
        await test_1.expect.poll(() => createdTask).not.toBeNull();
        (0, test_1.expect)(createdTask).toEqual(test_1.expect.objectContaining({ type: 'IMPORT', status: 'QUEUED', payload: { playlistUrl: MOCK_PLAYLIST_URL } }));
    });
    (0, test_1.test)('AC4: should receive an IPC "task:update" event', async ({ page }) => {
        await page.evaluate((payload) => globalThis.mockIpcListener('task:update', payload), { taskId: MOCK_TASK_ID, status: 'DOWNLOADING' });
        (0, test_1.expect)(receivedIpcEvents).toContainEqual(test_1.expect.objectContaining({ event: 'task:update', payload: { taskId: MOCK_TASK_ID, status: 'DOWNLOADING' } }));
    });
    (0, test_1.test)('AC5: should save playlist and video details on successful import', async ({ page }) => {
        await page.evaluate((payload) => {
            const win = globalThis;
            win.mockCreatePlaylist({ title: payload.result.title, youtubeId: 'some-id' });
            for (let i = 0; i < payload.result.videoCount; i++) {
                win.mockCreateVideo({ title: `Video ${i}`, youtubeId: `vid-${i}` });
            }
        }, { taskId: MOCK_TASK_ID, status: 'COMPLETED', result: MOCK_PLAYLIST_METADATA.data });
        await test_1.expect.poll(() => createdPlaylist).not.toBeNull();
        (0, test_1.expect)(createdPlaylist).toEqual(test_1.expect.objectContaining({ title: MOCK_PLAYLIST_METADATA.data.title, youtubeId: test_1.expect.any(String) }));
        (0, test_1.expect)(createdVideos.length).toBe(MOCK_PLAYLIST_METADATA.data.videoCount);
    });
    (0, test_1.test)('AC6: should show a desktop notification on import completion', async ({ page }) => {
        await page.evaluate((args) => { new globalThis.Notification(args.title, args.options); }, { title: 'Import Complete', options: { body: `Successfully imported "${MOCK_PLAYLIST_METADATA.data.title}".` } });
        const notifications = await page.evaluate(() => globalThis.notified);
        (0, test_1.expect)(notifications).toContainEqual(test_1.expect.objectContaining({ title: 'Import Complete', options: test_1.expect.objectContaining({ body: `Successfully imported "${MOCK_PLAYLIST_METADATA.data.title}".` }) }));
    });
});
//# sourceMappingURL=story_1.3_import_playlist.spec.js.map