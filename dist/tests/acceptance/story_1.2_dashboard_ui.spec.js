"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const test_1 = require("@playwright/test");
test_1.test.describe('Story 1.2: Dashboard UI', () => {
    test_1.test.beforeEach(async ({ page }) => {
        // Navigate to the app's entry point before each test.
        await page.goto('/');
        // Assumption: A link/button with the text "Dashboard" exists and clicking it
        // navigates to the dashboard view. This might need adjustment based on final implementation.
        // For now, we'll assume navigation is handled and the view is rendered directly
        const dashboardLink = page.getByRole('link', { name: 'Dashboard' });
        if (await dashboardLink.isVisible()) {
            await dashboardLink.click();
        }
        // Wait for the main container of the dashboard to be present
        await page.waitForSelector('[data-testid="dashboard-view"]');
    });
    /**
     * Acceptance Criterion 1:
     * The dashboard view should be visible after navigating to the application's root.
     *
     * AC1: This test ensures that the primary container for the dashboard UI,
     *      identified by `[data-testid="dashboard-view"]`, is rendered in the DOM.
     */
    (0, test_1.test)('AC1: should display the dashboard view after navigation', async ({ page }) => {
        const dashboardView = page.locator('#main-content [data-testid="dashboard-view"]');
        await (0, test_1.expect)(dashboardView).toBeVisible();
    });
    /**
     * Acceptance Criterion 2:
     * The dashboard must contain two primary sections: "Recent Playlists" and "Continue Watching".
     *
     * AC2: This test verifies the presence of `<h2>` headers for both required sections
     *      within the dashboard view.
     */
    (0, test_1.test)('AC2: should display "Recent Playlists" and "Continue Watching" headers', async ({ page }) => {
        const dashboardView = page.locator('[data-testid="dashboard-view"]');
        const recentPlaylistsHeader = dashboardView.locator('h2:has-text("Recent Playlists")');
        await (0, test_1.expect)(recentPlaylistsHeader).toBeVisible();
        const continueWatchingHeader = dashboardView.locator('h2:has-text("Continue Watching")');
        await (0, test_1.expect)(continueWatchingHeader).toBeVisible();
    });
    /**
     * Acceptance Criterion 3:
     * By default, when no data is available, both sections should display an "empty state" message.
     *
     * AC3: This test verifies that both the "Recent Playlists" and "Continue Watching"
     *      sections display an empty state message by default when there is no data.
     */
    (0, test_1.test)('AC3: should show empty state messages for both sections by default', async ({ page }) => {
        // Mock the API to return empty data, forcing the empty state
        await page.route('**/api/dashboard', async (route) => {
            await route.fulfill({
                status: 200,
                json: {
                    recentPlaylists: [],
                    continueWatching: [],
                },
            });
        });
        await page.reload(); // Reload to apply the mock
        const dashboardView = page.locator('[data-testid="dashboard-view"]');
        // Check for empty state in "Recent Playlists"
        const recentPlaylistsSection = dashboardView.locator('[data-testid="recent-playlists-section"]');
        await (0, test_1.expect)(recentPlaylistsSection).toHaveClass(/state-empty/);
        await (0, test_1.expect)(recentPlaylistsSection.locator('p:has-text("You have no recent playlists.")')).toBeVisible();
        // Check for empty state in "Continue Watching"
        const continueWatchingSection = dashboardView.locator('[data-testid="continue-watching-section"]');
        await (0, test_1.expect)(continueWatchingSection).toHaveClass(/state-empty/);
        await (0, test_1.expect)(continueWatchingSection.locator('p:has-text("You have no videos in your watch history.")')).toBeVisible();
    });
});
//# sourceMappingURL=story_1.2_dashboard_ui.spec.js.map