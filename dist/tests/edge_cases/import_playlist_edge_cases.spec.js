"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
const test_1 = require("@playwright/test");
let electronApp;
let page;
test_1.test.beforeAll(async () => {
    electronApp = await test_1._electron.launch({ args: ['.'] });
    page = await electronApp.firstWindow();
});
test_1.test.afterAll(async () => {
    await electronApp.close();
});
const openAddPlaylistDialog = async () => {
    await page.click('#add-playlist-button'); // Assuming a button with this ID opens the dialog
    await (0, test_1.expect)(page.locator('#add-playlist-dialog')).toBeVisible();
};
test_1.test.describe('Edge Cases for Story 1.3: Import Public Playlist', () => {
    test_1.test.beforeEach(async () => {
        // Reset state before each test if necessary, e.g., clear DB
        await page.evaluate(() => window.ipc.invoke('test:reset-database'));
        await openAddPlaylistDialog();
    });
    test_1.test.describe('Invalid Input', () => {
        (0, test_1.test)('should show error for malformed URL', async () => {
            await page.fill('#playlist-url-input', 'not-a-valid-url');
            await (0, test_1.expect)(page.locator('.url-error-message')).toHaveText('Invalid URL format. Please enter a valid YouTube playlist URL.');
            await (0, test_1.expect)(page.locator('#import-playlist-button')).toBeDisabled();
        });
        (0, test_1.test)('should show error for non-YouTube URL', async () => {
            await page.fill('#playlist-url-input', 'https://www.vimeo.com/12345');
            await (0, test_1.expect)(page.locator('.url-error-message')).toHaveText('Invalid URL format. Please enter a valid YouTube playlist URL.');
            await (0, test_1.expect)(page.locator('#import-playlist-button')).toBeDisabled();
        });
        (0, test_1.test)('should show error for single video URL', async () => {
            // Mock the metadata fetch to identify it as a single video
            await page.route('**/api/youtube/metadata**', route => {
                route.fulfill({
                    status: 400,
                    json: { error: 'URL is for a single video, not a playlist.' },
                });
            });
            await page.fill('#playlist-url-input', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');
            await page.waitForResponse('**/api/youtube/metadata**');
            await (0, test_1.expect)(page.locator('.preview-error-message')).toHaveText('This is a URL for a single video, not a playlist. Please provide a playlist URL.');
            await (0, test_1.expect)(page.locator('#import-playlist-button')).toBeDisabled();
        });
    });
    test_1.test.describe('Playlist Issues', () => {
        (0, test_1.test)('should show error for a non-existent playlist', async () => {
            await page.route('**/api/youtube/metadata**', route => {
                route.fulfill({ status: 404, json: { error: 'Playlist not found.' } });
            });
            await page.fill('#playlist-url-input', 'https://www.youtube.com/playlist?list=NON_EXISTENT_PLAYLIST');
            await page.waitForResponse('**/api/youtube/metadata**');
            await (0, test_1.expect)(page.locator('.preview-error-message')).toHaveText('Could not fetch playlist. It may be private, deleted, or members-only.');
            await (0, test_1.expect)(page.locator('#import-playlist-button')).toBeDisabled();
        });
        (0, test_1.test)('should show error for an empty playlist', async () => {
            await page.route('**/api/youtube/metadata**', route => {
                route.fulfill({
                    status: 200,
                    json: { title: 'Empty Playlist', videoCount: 0, thumbnailUrl: 'http://example.com/thumb.jpg' },
                });
            });
            await page.fill('#playlist-url-input', 'https://www.youtube.com/playlist?list=EMPTY_PLAYLIST');
            await page.waitForResponse('**/api/youtube/metadata**');
            await (0, test_1.expect)(page.locator('.playlist-preview-title')).toHaveText('Empty Playlist');
            await (0, test_1.expect)(page.locator('.playlist-preview-count')).toHaveText('0 videos');
            await (0, test_1.expect)(page.locator('.preview-error-message')).toHaveText('Cannot import an empty playlist.');
            await (0, test_1.expect)(page.locator('#import-playlist-button')).toBeDisabled();
        });
    });
    test_1.test.describe('Network & Database Failures', () => {
        (0, test_1.test)('should show error on network failure during metadata fetch', async () => {
            await page.route('**/api/youtube/metadata**', route => route.abort());
            await page.fill('#playlist-url-input', 'https://www.youtube.com/playlist?list=ANY_PLAYLIST');
            await page.waitForResponse('**/api/youtube/metadata**').catch(() => { });
            await (0, test_1.expect)(page.locator('.preview-error-message')).toHaveText('Network error. Please check your connection and try again.');
            await (0, test_1.expect)(page.locator('#import-playlist-button')).toBeDisabled();
        });
        (0, test_1.test)('should show UI error if creating background task fails', async () => {
            // Mock the ipc.invoke call within the page to simulate a failure
            await page.evaluate(() => {
                const originalInvoke = window.ipc.invoke;
                window.ipc.invoke = (channel, ...args) => {
                    if (channel === 'task:create') {
                        return Promise.reject(new Error('Simulated database write failure'));
                    }
                    return originalInvoke(channel, ...args);
                };
            });
            // Mock a successful metadata fetch
            await page.route('**/api/youtube/metadata**', route => {
                route.fulfill({
                    status: 200,
                    json: { title: 'Test Playlist', videoCount: 5, thumbnailUrl: 'http://example.com/thumb.jpg' },
                });
            });
            await page.fill('#playlist-url-input', 'https://www.youtube.com/playlist?list=VALID_PLAYLIST');
            await page.waitForResponse('**/api/youtube/metadata**');
            await page.click('#import-playlist-button');
            await (0, test_1.expect)(page.locator('.dialog-error-message')).toHaveText('A database error occurred. Could not start the import task.');
        });
    });
    test_1.test.describe('User Actions', () => {
        (0, test_1.test)('should show error if importing an already imported playlist', async () => {
            // Pre-populate the DB with a playlist
            await page.evaluate(() => window.ipc.invoke('test:add-playlist', { youtubeId: 'ALREADY_IMPORTED_ID', title: 'Existing' }));
            // Mock the metadata fetch
            await page.route('**/api/youtube/metadata**', route => {
                route.fulfill({
                    status: 200,
                    json: { id: 'ALREADY_IMPORTED_ID', title: 'Existing Playlist', videoCount: 10 },
                });
            });
            await page.fill('#playlist-url-input', 'https://www.youtube.com/playlist?list=ALREADY_IMPORTED_ID');
            await page.waitForResponse('**/api/youtube/metadata**');
            await (0, test_1.expect)(page.locator('.preview-error-message')).toHaveText('This playlist has already been imported.');
            await (0, test_1.expect)(page.locator('#import-playlist-button')).toBeDisabled();
        });
    });
});
//# sourceMappingURL=import_playlist_edge_cases.spec.js.map