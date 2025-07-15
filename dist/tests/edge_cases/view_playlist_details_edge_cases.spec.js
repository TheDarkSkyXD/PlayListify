"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
const test_1 = require("@playwright/test");
test_1.test.describe('Edge Cases for User Story 1.4: View Playlist Details', () => {
    const MOCK_PLAYLIST_ID = 'pl_mock_123';
    // DE-01: Playlist with zero videos
    (0, test_1.test)('DE-01: should display an empty state message when a playlist has no videos', async ({ page }) => {
        await page.exposeFunction('mockGetPlaylistDetails', () => ({
            playlist: { id: MOCK_PLAYLIST_ID, title: 'Empty Playlist', videoCount: 0 },
            videos: [],
        }));
        await page.addInitScript(() => {
            window.api.getPlaylistDetails = () => window.mockGetPlaylistDetails();
        });
        await page.goto('/');
        await page.click(`.playlist-link[data-playlist-id="1"]`);
        await (0, test_1.expect)(page.getByRole('heading', { name: 'Empty Playlist' })).toBeVisible();
        await (0, test_1.expect)(page.getByText('0 videos')).toBeVisible();
        await (0, test_1.expect)(page.getByText('This playlist has no videos')).toBeVisible();
    });
    // DE-02: Playlist ID does not exist
    (0, test_1.test)('DE-02: should display a "Playlist not found" message for a non-existent playlist ID', async ({ page }) => {
        await page.exposeFunction('mockGetPlaylistDetails', () => {
            throw new Error('404');
        });
        await page.addInitScript(() => {
            window.api.getPlaylistDetails = () => window.mockGetPlaylistDetails();
        });
        await page.goto('/');
        await page.click(`.playlist-link[data-playlist-id="1"]`);
        await (0, test_1.expect)(page.getByText('Playlist not found')).toBeVisible();
        await (0, test_1.expect)(page.getByRole('heading')).not.toContainText('Empty Playlist');
    });
    // DE-03: Video metadata with unusually long strings
    (0, test_1.test)('DE-03: should handle long text gracefully without breaking the UI layout', async ({ page }) => {
        const longTitle = 'a'.repeat(200);
        const longChannel = 'b'.repeat(100);
        await page.exposeFunction('mockGetPlaylistDetails', () => ({
            playlist: { id: MOCK_PLAYLIST_ID, title: 'Playlist With Long Text', videoCount: 1 },
            videos: [{ id: 'vid_1', title: longTitle, thumbnailUrl: '/placeholder.jpg', channelTitle: longChannel, duration: '10:00' }],
        }));
        await page.addInitScript(() => {
            window.api.getPlaylistDetails = () => window.mockGetPlaylistDetails();
        });
        await page.goto('/');
        await page.click(`.playlist-link[data-playlist-id="1"]`);
        const videoItem = page.locator('.video-item').first();
        // Check if the title element has text-overflow: ellipsis or similar style
        const titleElement = videoItem.locator('.video-title');
        await (0, test_1.expect)(titleElement).toHaveCSS('text-overflow', 'ellipsis');
        await (0, test_1.expect)(titleElement).toHaveCSS('overflow', 'hidden');
    });
    // DE-04: Video metadata with missing properties
    (0, test_1.test)('DE-04: should display placeholders for missing video metadata', async ({ page }) => {
        await page.exposeFunction('mockGetPlaylistDetails', () => ({
            playlist: { id: MOCK_PLAYLIST_ID, title: 'Playlist With Missing Data', videoCount: 1 },
            videos: [{ id: 'vid_1', title: 'Video with Missing Thumbnail and Duration', channelTitle: 'Test Channel' }],
        }));
        await page.addInitScript(() => {
            window.api.getPlaylistDetails = () => window.mockGetPlaylistDetails();
        });
        await page.goto('/');
        await page.click(`.playlist-link[data-playlist-id="1"]`);
        const videoItem = page.locator('.video-item').first();
        // Check for default thumbnail
        await (0, test_1.expect)(videoItem.locator('img')).toHaveAttribute('src', /default-thumbnail.png/);
        // Check for default/hidden duration
        await (0, test_1.expect)(videoItem.locator('.video-duration')).toHaveText('--:--');
    });
    // FE-01: Network request to fetch video data fails
    (0, test_1.test)('FE-01: should show a user-friendly error if fetching videos fails', async ({ page }) => {
        await page.exposeFunction('mockGetPlaylistDetails', () => {
            throw new Error('Internal Server Error');
        });
        await page.addInitScript(() => {
            window.api.getPlaylistDetails = () => window.mockGetPlaylistDetails();
        });
        await page.goto('/');
        await page.click(`.playlist-link[data-playlist-id="1"]`);
        // The skeleton loader should disappear
        await (0, test_1.expect)(page.locator('.skeleton-loader')).not.toBeVisible();
        // A friendly error message should be shown
        await (0, test_1.expect)(page.getByText('Failed to load videos. Please try again.')).toBeVisible();
    });
});
//# sourceMappingURL=view_playlist_details_edge_cases.spec.js.map