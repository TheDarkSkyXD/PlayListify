"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
const test_1 = require("@playwright/test");
// Mock Data
const MOCK_PLAYLIST = {
    id: 1,
    name: 'Tech Talks',
    videoCount: 2,
};
const MOCK_VIDEOS = [
    {
        id: 101,
        playlistId: 1,
        title: 'The Future of Web Development',
        thumbnailUrl: 'https://i.ytimg.com/vi/mock_thumbnail_1.jpg',
        channelName: 'Dev Channel',
        duration: '15:30',
    },
    {
        id: 102,
        playlistId: 1,
        title: 'AI in 2025',
        thumbnailUrl: 'https://i.ytimg.com/vi/mock_thumbnail_2.jpg',
        channelName: 'AI Insights',
        duration: '22:05',
    },
];
test_1.test.describe('User Story 1.4: View Playlist Details', () => {
    test_1.test.beforeEach(async ({ page }) => {
        // Mock the IPC call for getPlaylistDetails
        await page.exposeFunction('mockGetPlaylistDetails', () => {
            return {
                playlist: MOCK_PLAYLIST,
                videos: MOCK_VIDEOS,
            };
        });
        // Override the window.api.getPlaylistDetails to use our mock
        await page.addInitScript(() => {
            window.api = {
                ...window.api,
                getPlaylistDetails: () => window.mockGetPlaylistDetails(),
            };
        });
    });
    // AC1: Navigation & Data Seeding
    (0, test_1.test)('clicking a playlist in the sidebar navigates to its detail view', async ({ page }) => {
        await page.goto('/');
        // Click the playlist link
        await page.click(`.playlist-link[data-playlist-id="${MOCK_PLAYLIST.id}"]`);
        // Assert that the main content area now shows the playlist detail view
        await (0, test_1.expect)(page.locator('#playlist-detail-view')).toBeVisible();
    });
    // AC2: Skeleton Loader
    (0, test_1.test)('displays a skeleton loader while playlist data is being fetched', async ({ page }) => {
        // We need to override the mock to introduce a delay for this specific test
        await page.exposeFunction('mockGetPlaylistDetailsWithDelay', async () => {
            // The delay will happen on the "main process" side of the mock
            await new Promise(resolve => setTimeout(resolve, 500));
            return {
                playlist: MOCK_PLAYLIST,
                videos: MOCK_VIDEOS,
            };
        });
        await page.addInitScript(() => {
            window.api.getPlaylistDetails = () => window.mockGetPlaylistDetailsWithDelay();
        });
        await page.goto('/');
        // Click the playlist, but don't wait for the navigation to complete
        page.click(`.playlist-link[data-playlist-id="${MOCK_PLAYLIST.id}"]`);
        // Wait for the navigation/rendering to complete, which implies a loader was shown.
        await page.waitForSelector('#playlist-detail-view');
        // After the response is fulfilled, the skeleton loader should be gone
        await (0, test_1.expect)(page.locator('#main-content .skeleton-loader')).not.toBeVisible();
    });
    // AC3 & AC4: Content Verification
    (0, test_1.test)('displays the correct playlist header and video list after fetching data', async ({ page }) => {
        await page.goto('/');
        // Click the playlist link
        await page.click(`.playlist-link[data-playlist-id="${MOCK_PLAYLIST.id}"]`);
        // AC3: Verify Header Content
        await (0, test_1.expect)(page.locator('h1#playlist-title')).toHaveText(MOCK_PLAYLIST.name);
        await (0, test_1.expect)(page.locator('span#video-count')).toHaveText(`${MOCK_PLAYLIST.videoCount} videos`);
        // AC4: Verify Video List Content
        await (0, test_1.expect)(page.locator('.video-list-item')).toHaveCount(MOCK_VIDEOS.length);
        const firstVideoItem = page.locator('.video-list-item').first();
        const mockFirstVideo = MOCK_VIDEOS[0];
        await (0, test_1.expect)(firstVideoItem.locator('img.video-thumbnail')).toHaveAttribute('src', mockFirstVideo.thumbnailUrl);
        await (0, test_1.expect)(firstVideoItem.locator('.video-title')).toHaveText(mockFirstVideo.title);
        await (0, test_1.expect)(firstVideoItem.locator('.channel-name')).toHaveText(mockFirstVideo.channelName);
        await (0, test_1.expect)(firstVideoItem.locator('.video-duration')).toHaveText(mockFirstVideo.duration);
    });
});
//# sourceMappingURL=story_1.4_view_playlist_details.spec.js.map