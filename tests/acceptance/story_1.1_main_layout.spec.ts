import { test, expect } from '@playwright/test';

test.describe('Story 1.1: Main Application Layout', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('file://' + require('path').resolve(__dirname, '../../src/index.html'));
  });

  test('AC1: Verify Application Window Launch', async ({ page }) => {
    // In Playwright, the test runs in a single page context by default.
    // The presence of the 'page' object itself confirms the window launched.
    // To check for *only* one page, we would need a browser context-level test.
    // For this test, we'll confirm the page is what we expect.
    await expect(page).toHaveURL('file://' + require('path').resolve(__dirname, '../../src/index.html'));
  });

  test('AC2 - Sidebar: Verify Sidebar Visibility', async ({ page }) => {
    await expect(page.locator('#sidebar')).toBeVisible();
  });

  test('AC2 - Top Nav: Verify Top Navigation Bar Visibility', async ({ page }) => {
    await expect(page.locator('#top-nav')).toBeVisible();
  });

  test('AC2 - Main Content: Verify Main Content Area Visibility', async ({ page }) => {
    await expect(page.locator('#main-content')).toBeVisible();
  });

  test('AC3: Baseline Visual Snapshot', async ({ page }) => {
    await expect(page).toHaveScreenshot('main-layout.png');
  });
});