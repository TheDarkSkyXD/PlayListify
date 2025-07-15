import { test, expect } from '@playwright/test';

test.describe('Edge Cases: Main Application Layout', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('file://' + require('path').resolve(__dirname, '../../src/index.html'));
  });

  test.describe('Responsive Layout', () => {
    const viewports = [
      { width: 390, height: 844, name: 'Mobile' },
      { width: 768, height: 1024, name: 'Tablet' },
    ];

    for (const viewport of viewports) {
      test(`should maintain layout on ${viewport.name} viewport (${viewport.width}x${viewport.height})`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await expect(page.locator('#sidebar')).toBeVisible();
        await expect(page.locator('#top-nav')).toBeVisible();
        await expect(page.locator('#main-content')).toBeVisible();
      });
    }
  });

  test('should display layout on slow network', async ({ page }) => {
    await page.route('**/index.html', route => {
      setTimeout(() => {
        route.continue();
      }, 1000); // 1 second delay
    });

    await page.goto('file://' + require('path').resolve(__dirname, '../../src/index.html')); // Re-navigate to trigger the slow route

    await expect(page.locator('#sidebar')).toBeVisible({ timeout: 2000 });
    await expect(page.locator('#top-nav')).toBeVisible({ timeout: 2000 });
    await expect(page.locator('#main-content')).toBeVisible({ timeout: 2000 });
  });

  test('should render main content area even when empty', async ({ page }) => {
    const mainContent = page.locator('#main-content');
    await expect(mainContent).toBeVisible();
    await expect(mainContent).toBeEmpty();
  });
});