"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const test_1 = require("@playwright/test");
test_1.test.describe('Chaos Tests for Main Layout', () => {
    let page;
    test_1.test.beforeAll(async ({ browser }) => {
        page = await browser.newPage();
        // Correctly construct the file path for local files in Playwright
        const filePath = `file://${process.cwd()}/src/index.html`.replace(/\\/g, '/');
        await page.goto(filePath);
    });
    test_1.test.afterAll(async () => {
        await page.close();
    });
    test_1.test.describe('Experiment 1: Extreme Viewport Resizing', () => {
        const viewports = [
            { width: 320, height: 480 }, // Mobile
            { width: 1920, height: 100 }, // Very short
            { width: 200, height: 1080 }, // Very narrow
            { width: 4096, height: 2160 }, // 4K
        ];
        for (const viewport of viewports) {
            (0, test_1.test)(`should handle viewport ${viewport.width}x${viewport.height}`, async () => {
                await page.setViewportSize(viewport);
                await page.waitForTimeout(500); // Allow time for layout to settle
                const appContainer = await page.locator('#app-container').boundingBox();
                const sidebar = await page.locator('#sidebar').boundingBox();
                const topNav = await page.locator('#top-nav').boundingBox();
                const mainContent = await page.locator('#main-content').boundingBox();
                if (!appContainer || !sidebar || !topNav || !mainContent) {
                    throw new Error("One or more layout elements not found");
                }
                // Add a 1px tolerance for rounding errors
                (0, test_1.expect)(sidebar.x).toBeGreaterThanOrEqual(appContainer.x - 1);
                (0, test_1.expect)(sidebar.y).toBeGreaterThanOrEqual(appContainer.y - 1);
                (0, test_1.expect)(sidebar.x + sidebar.width).toBeLessThanOrEqual(appContainer.x + appContainer.width + 1);
                (0, test_1.expect)(sidebar.y + sidebar.height).toBeLessThanOrEqual(appContainer.y + appContainer.height + 1);
                (0, test_1.expect)(topNav.x).toBeGreaterThanOrEqual(appContainer.x - 1);
                (0, test_1.expect)(topNav.y).toBeGreaterThanOrEqual(appContainer.y - 1);
                (0, test_1.expect)(topNav.x + topNav.width).toBeLessThanOrEqual(appContainer.x + appContainer.width + 1);
                (0, test_1.expect)(topNav.y + topNav.height).toBeLessThanOrEqual(appContainer.y + appContainer.height + 1);
                (0, test_1.expect)(mainContent.x).toBeGreaterThanOrEqual(appContainer.x - 1);
                (0, test_1.expect)(mainContent.y).toBeGreaterThanOrEqual(appContainer.y - 1);
                (0, test_1.expect)(mainContent.x + mainContent.width).toBeLessThanOrEqual(appContainer.x + appContainer.width + 1);
                (0, test_1.expect)(mainContent.y + mainContent.height).toBeLessThanOrEqual(appContainer.y + appContainer.height + 1);
            });
        }
    });
    test_1.test.describe('Experiment 2: Content Overflow', () => {
        (0, test_1.test)('should handle sidebar and main content overflow', async () => {
            const longText = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(500);
            await page.evaluate((text) => {
                const sidebarEl = document.getElementById('sidebar');
                const mainContentEl = document.getElementById('main-content');
                if (sidebarEl)
                    sidebarEl.innerText = text;
                if (mainContentEl)
                    mainContentEl.innerText = text;
            }, longText);
            const sidebar = page.locator('#sidebar');
            const mainContent = page.locator('#main-content');
            const sidebarScrollHeight = await sidebar.evaluate((node) => node.scrollHeight);
            const sidebarClientHeight = await sidebar.evaluate((node) => node.clientHeight);
            (0, test_1.expect)(sidebarScrollHeight).toBeGreaterThan(sidebarClientHeight);
            const mainContentScrollHeight = await mainContent.evaluate((node) => node.scrollHeight);
            const mainContentClientHeight = await mainContent.evaluate((node) => node.clientHeight);
            (0, test_1.expect)(mainContentScrollHeight).toBeGreaterThan(mainContentClientHeight);
        });
    });
    test_1.test.describe('Experiment 3: CSS Interference', () => {
        (0, test_1.test)('should resist conflicting CSS rules', async () => {
            const filePath = `file://${process.cwd()}/src/index.html`.replace(/\\/g, '/');
            await page.goto(filePath);
            await page.screenshot({ path: 'tests/chaos/baseline.png' });
            await page.evaluate(() => {
                const style = document.createElement('style');
                style.innerHTML = `
          #sidebar, #top-nav, #main-content {
            display: inline !important;
            position: absolute !important;
            top: 100px;
            left: 100px;
          }
        `;
                document.head.appendChild(style);
            });
            await page.waitForTimeout(500);
            await page.screenshot({ path: 'tests/chaos/conflicting-css.png' });
            // Visual comparison is the primary verification here.
            await (0, test_1.expect)(page.locator('#sidebar')).toBeVisible();
            await (0, test_1.expect)(page.locator('#top-nav')).toBeVisible();
            await (0, test_1.expect)(page.locator('#main-content')).toBeVisible();
        });
    });
});
//# sourceMappingURL=main_layout.spec.js.map