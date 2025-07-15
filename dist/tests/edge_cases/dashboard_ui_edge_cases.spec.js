"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const test_1 = require("@playwright/test");
// Mock data to be used in tests
const mockPlaylists = [
    { id: 'pl1', title: 'Synthwave Hits', videoCount: 25 },
    { id: 'pl2', title: 'Lo-fi Beats', videoCount: 50 },
];
const mockWatchHistory = [
    { id: 'vid1', title: 'Cyberpunk 2077 Trailer', progress: '80%' },
    { id: 'vid2', title: 'Playwright Advanced Tutorial', progress: '50%' },
];
test_1.test.describe('Dashboard UI: Edge Cases', () => {
    test_1.test.beforeEach(async ({ page }) => {
        // Base navigation for all tests in this suite
        await page.goto('/');
        // Assuming navigation to the dashboard view is required
        const dashboardLink = page.getByRole('link', { name: 'Dashboard' });
        if (await dashboardLink.isVisible()) {
            await dashboardLink.click();
        }
        await page.waitForSelector('[data-testid="dashboard-view"]');
    });
    test_1.test.describe('Partial Data Scenarios', () => {
        (0, test_1.test)('should show playlists and an empty state for watch history', async ({ page }) => {
            // Mock the API response to return playlists but no watch history
            await page.route('**/api/dashboard', async (route) => {
                await route.fulfill({
                    status: 200,
                    json: {
                        recentPlaylists: mockPlaylists,
                        continueWatching: [],
                    },
                });
            });
            await page.reload(); // Reload to apply the mock route
            const recentPlaylistsSection = page.locator('[data-testid="recent-playlists-section"]');
            const continueWatchingSection = page.locator('[data-testid="continue-watching-section"]');
            // Assert that playlist data is rendered
            await (0, test_1.expect)(recentPlaylistsSection).toHaveClass(/state-success/);
            await (0, test_1.expect)(recentPlaylistsSection.locator('ul > li')).toHaveCount(2);
            // Assert that the empty state is shown for watch history
            await (0, test_1.expect)(continueWatchingSection).toHaveClass(/state-empty/);
        });
        (0, test_1.test)('should show watch history and an empty state for playlists', async ({ page }) => {
            // Mock the API response for the inverse scenario
            await page.route('**/api/dashboard', async (route) => {
                await route.fulfill({
                    status: 200,
                    json: {
                        recentPlaylists: [],
                        continueWatching: mockWatchHistory,
                    },
                });
            });
            await page.reload();
            const recentPlaylistsSection = page.locator('[data-testid="recent-playlists-section"]');
            const continueWatchingSection = page.locator('[data-testid="continue-watching-section"]');
            // Assert empty state for playlists
            await (0, test_1.expect)(recentPlaylistsSection).toHaveClass(/state-empty/);
            // Assert data is rendered for watch history
            await (0, test_1.expect)(continueWatchingSection).toHaveClass(/state-success/);
            await (0, test_1.expect)(continueWatchingSection.locator('ul > li')).toHaveCount(2);
        });
    });
    (0, test_1.test)('Asynchronous Loading: should display skeleton loaders while data is being fetched', async ({ page }) => {
        let fulfillResponse;
        const responsePromise = new Promise(resolve => fulfillResponse = resolve);
        await page.route('**/api/dashboard', async (route) => {
            // Wait for the promise to resolve before fulfilling the request
            await responsePromise;
            await route.fulfill({
                status: 200,
                json: {
                    recentPlaylists: mockPlaylists,
                    continueWatching: mockWatchHistory,
                },
            });
        });
        // Reload the page to trigger the network request
        await page.reload();
        const recentPlaylistsSection = page.locator('[data-testid="recent-playlists-section"]');
        const continueWatchingSection = page.locator('[data-testid="continue-watching-section"]');
        // Assert that skeleton loaders are visible immediately
        await (0, test_1.expect)(recentPlaylistsSection).toHaveClass(/state-loading/);
        await (0, test_1.expect)(continueWatchingSection).toHaveClass(/state-loading/);
        // Now, fulfill the response
        fulfillResponse();
        // Assert that the sections have updated to the success state
        await (0, test_1.expect)(recentPlaylistsSection).toHaveClass(/state-success/);
        await (0, test_1.expect)(continueWatchingSection).toHaveClass(/state-success/);
        await (0, test_1.expect)(recentPlaylistsSection.locator('ul > li')).toHaveCount(2);
    });
    (0, test_1.test)('Rendering Failures: should show a fallback UI if a section fails to render', async ({ page }) => {
        // Simulate a failure for only the "Recent Playlists" section
        await page.route('**/api/dashboard', async (route) => {
            await route.fulfill({
                status: 200,
                json: {
                    // Intentionally cause an error by providing malformed data for one part
                    recentPlaylists: { error: 'Failed to load' },
                    continueWatching: mockWatchHistory,
                },
            });
        });
        await page.reload();
        const recentPlaylistsSection = page.locator('[data-testid="recent-playlists-section"]');
        const continueWatchingSection = page.locator('[data-testid="continue-watching-section"]');
        // Assert that the error fallback is shown for the failed section
        await (0, test_1.expect)(recentPlaylistsSection).toHaveClass(/state-error/);
        // Assert that the other section renders correctly
        await (0, test_1.expect)(continueWatchingSection).toHaveClass(/state-success/);
        await (0, test_1.expect)(continueWatchingSection.locator('ul > li')).toHaveCount(2);
    });
});
//# sourceMappingURL=dashboard_ui_edge_cases.spec.js.map