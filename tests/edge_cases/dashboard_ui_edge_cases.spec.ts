import { test, expect } from '@playwright/test';

// Mock data to be used in tests
const mockPlaylists = [
  { id: 'pl1', title: 'Synthwave Hits', videoCount: 25 },
  { id: 'pl2', title: 'Lo-fi Beats', videoCount: 50 },
];

const mockWatchHistory = [
  { id: 'vid1', title: 'Cyberpunk 2077 Trailer', progress: '80%' },
  { id: 'vid2', title: 'Playwright Advanced Tutorial', progress: '50%' },
];

test.describe('Dashboard UI: Edge Cases', () => {

  test.beforeEach(async ({ page }) => {
    // Base navigation for all tests in this suite
    await page.goto('/');
    // Assuming navigation to the dashboard view is required
    const dashboardLink = page.getByRole('link', { name: 'Dashboard' });
    if (await dashboardLink.isVisible()) {
      await dashboardLink.click();
    }
    await page.waitForSelector('[data-testid="dashboard-view"]');
  });

  test.describe('Partial Data Scenarios', () => {
    test('should show playlists and an empty state for watch history', async ({ page }) => {
      // Mock the API response to return playlists but no watch history
      await page.route('**/api/dashboard', async route => {
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
      await expect(recentPlaylistsSection).toHaveClass(/state-success/);
      await expect(recentPlaylistsSection.locator('ul > li')).toHaveCount(2);

      // Assert that the empty state is shown for watch history
      await expect(continueWatchingSection).toHaveClass(/state-empty/);
    });

    test('should show watch history and an empty state for playlists', async ({ page }) => {
      // Mock the API response for the inverse scenario
      await page.route('**/api/dashboard', async route => {
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
      await expect(recentPlaylistsSection).toHaveClass(/state-empty/);

      // Assert data is rendered for watch history
      await expect(continueWatchingSection).toHaveClass(/state-success/);
      await expect(continueWatchingSection.locator('ul > li')).toHaveCount(2);
    });
  });

  test('Asynchronous Loading: should display skeleton loaders while data is being fetched', async ({ page }) => {
    let fulfillResponse: (value?: unknown) => void;
    const responsePromise = new Promise(resolve => fulfillResponse = resolve);

    await page.route('**/api/dashboard', async route => {
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
    await expect(recentPlaylistsSection).toHaveClass(/state-loading/);
    await expect(continueWatchingSection).toHaveClass(/state-loading/);

    // Now, fulfill the response
    fulfillResponse!();

    // Assert that the sections have updated to the success state
    await expect(recentPlaylistsSection).toHaveClass(/state-success/);
    await expect(continueWatchingSection).toHaveClass(/state-success/);
    await expect(recentPlaylistsSection.locator('ul > li')).toHaveCount(2);
  });

  test('Rendering Failures: should show a fallback UI if a section fails to render', async ({ page }) => {
    // Simulate a failure for only the "Recent Playlists" section
    await page.route('**/api/dashboard', async route => {
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
    await expect(recentPlaylistsSection).toHaveClass(/state-error/);

    // Assert that the other section renders correctly
    await expect(continueWatchingSection).toHaveClass(/state-success/);
    await expect(continueWatchingSection.locator('ul > li')).toHaveCount(2);
  });
});