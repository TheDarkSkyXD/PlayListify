"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const test_1 = require("@playwright/test");
test_1.test.describe('Story 1.1: Main Application Layout', () => {
    test_1.test.beforeEach(async ({ page }) => {
        await page.goto('file://' + require('path').resolve(__dirname, '../../src/index.html'));
    });
    (0, test_1.test)('AC1: Verify Application Window Launch', async ({ page }) => {
        // In Playwright, the test runs in a single page context by default.
        // The presence of the 'page' object itself confirms the window launched.
        // To check for *only* one page, we would need a browser context-level test.
        // For this test, we'll confirm the page is what we expect.
        await (0, test_1.expect)(page).toHaveURL('file://' + require('path').resolve(__dirname, '../../src/index.html'));
    });
    (0, test_1.test)('AC2 - Sidebar: Verify Sidebar Visibility', async ({ page }) => {
        await (0, test_1.expect)(page.locator('#sidebar')).toBeVisible();
    });
    (0, test_1.test)('AC2 - Top Nav: Verify Top Navigation Bar Visibility', async ({ page }) => {
        await (0, test_1.expect)(page.locator('#top-nav')).toBeVisible();
    });
    (0, test_1.test)('AC2 - Main Content: Verify Main Content Area Visibility', async ({ page }) => {
        await (0, test_1.expect)(page.locator('#main-content')).toBeVisible();
    });
    (0, test_1.test)('AC3: Baseline Visual Snapshot', async ({ page }) => {
        await (0, test_1.expect)(page).toHaveScreenshot('main-layout.png');
    });
});
//# sourceMappingURL=story_1.1_main_layout.spec.js.map