"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const test_1 = require("@playwright/test");
test_1.test.describe('Edge Cases: Main Application Layout', () => {
    test_1.test.beforeEach(async ({ page }) => {
        await page.goto('file://' + require('path').resolve(__dirname, '../../src/index.html'));
    });
    test_1.test.describe('Responsive Layout', () => {
        const viewports = [
            { width: 390, height: 844, name: 'Mobile' },
            { width: 768, height: 1024, name: 'Tablet' },
        ];
        for (const viewport of viewports) {
            (0, test_1.test)(`should maintain layout on ${viewport.name} viewport (${viewport.width}x${viewport.height})`, async ({ page }) => {
                await page.setViewportSize({ width: viewport.width, height: viewport.height });
                await (0, test_1.expect)(page.locator('#sidebar')).toBeVisible();
                await (0, test_1.expect)(page.locator('#top-nav')).toBeVisible();
                await (0, test_1.expect)(page.locator('#main-content')).toBeVisible();
            });
        }
    });
    (0, test_1.test)('should display layout on slow network', async ({ page }) => {
        await page.route('**/index.html', route => {
            setTimeout(() => {
                route.continue();
            }, 1000); // 1 second delay
        });
        await page.goto('file://' + require('path').resolve(__dirname, '../../src/index.html')); // Re-navigate to trigger the slow route
        await (0, test_1.expect)(page.locator('#sidebar')).toBeVisible({ timeout: 2000 });
        await (0, test_1.expect)(page.locator('#top-nav')).toBeVisible({ timeout: 2000 });
        await (0, test_1.expect)(page.locator('#main-content')).toBeVisible({ timeout: 2000 });
    });
    (0, test_1.test)('should render main content area even when empty', async ({ page }) => {
        const mainContent = page.locator('#main-content');
        await (0, test_1.expect)(mainContent).toBeVisible();
        await (0, test_1.expect)(mainContent).toBeEmpty();
    });
});
//# sourceMappingURL=main_layout_edge_cases.spec.js.map