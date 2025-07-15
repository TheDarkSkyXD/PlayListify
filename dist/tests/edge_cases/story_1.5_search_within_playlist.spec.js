"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const test_1 = require("@playwright/test");
test_1.test.describe('User Story 1.5: Search Within Playlist - Edge Cases', () => {
    test_1.test.beforeEach(async ({ page }) => {
        // Navigate to the application
        await page.goto('file://' + require('path').resolve(__dirname, '../../src/index.html'));
        // Setup mock IPC channels
        await page.evaluate(() => {
            // Mock the IPC channels for get-playlist
            window.electronAPI = {
                getPlaylist: () => Promise.resolve({
                    id: 'test-playlist-1',
                    name: 'Test Playlist',
                    description: 'A test playlist',
                    videoCount: 10
                }),
                getVideosForPlaylist: () => Promise.resolve([
                    { id: 'video1', title: 'Test Video 1', duration: 180 },
                    { id: 'video2', title: 'Test Video 2', duration: 240 },
                    { id: 'video3', title: 'Another Video', duration: 300 },
                    { id: 'video4', title: 'Special Chars !@#$%', duration: 150 },
                    { id: 'video5', title: 'Unicode Test 🎵', duration: 200 },
                    { id: 'video6', title: 'Very Long Title That Goes On And On With Many Words', duration: 360 },
                    { id: 'video7', title: 'lowercase title', duration: 120 },
                    { id: 'video8', title: 'UPPERCASE TITLE', duration: 180 },
                    { id: 'video9', title: 'Mixed Case Title', duration: 210 },
                    { id: 'video10', title: 'Whitespace   Test', duration: 90 }
                ])
            };
        });
        // Inject DOM structure with playlist details
        await page.evaluate(() => {
            document.body.innerHTML = `
        <div class="playlist-detail-view">
          <div class="playlist-header">
            <h1>Test Playlist</h1>
            <div class="search-container">
              <input type="text" id="playlist-search" placeholder="Search videos..." />
            </div>
          </div>
          <div class="video-list">
            <div class="video-list-item" data-video-id="video1">Test Video 1</div>
            <div class="video-list-item" data-video-id="video2">Test Video 2</div>
            <div class="video-list-item" data-video-id="video3">Another Video</div>
            <div class="video-list-item" data-video-id="video4">Special Chars !@#$%</div>
            <div class="video-list-item" data-video-id="video5">Unicode Test 🎵</div>
            <div class="video-list-item" data-video-id="video6">Very Long Title That Goes On And On With Many Words</div>
            <div class="video-list-item" data-video-id="video7">lowercase title</div>
            <div class="video-list-item" data-video-id="video8">UPPERCASE TITLE</div>
            <div class="video-list-item" data-video-id="video9">Mixed Case Title</div>
            <div class="video-list-item" data-video-id="video10">Whitespace   Test</div>
          </div>
          <div class="no-results" style="display: none;">No results found</div>
        </div>
      `;
        });
    });
    (0, test_1.test)('Edge Case 1: should handle empty search query gracefully', async ({ page }) => {
        const searchInput = page.locator('#playlist-search');
        // Enter empty string
        await searchInput.fill('');
        // All videos should remain visible
        await (0, test_1.expect)(page.locator('.video-list-item')).toHaveCount(10);
        await (0, test_1.expect)(page.locator('.no-results')).not.toBeVisible();
    });
    (0, test_1.test)('Edge Case 2: should handle whitespace-only search queries', async ({ page }) => {
        const searchInput = page.locator('#playlist-search');
        // Enter whitespace only
        await searchInput.fill('   ');
        // All videos should remain visible (whitespace should be trimmed)
        await (0, test_1.expect)(page.locator('.video-list-item')).toHaveCount(10);
        await (0, test_1.expect)(page.locator('.no-results')).not.toBeVisible();
    });
    (0, test_1.test)('Edge Case 3: should handle special characters in search queries', async ({ page }) => {
        const searchInput = page.locator('#playlist-search');
        // Search for special characters
        await searchInput.fill('!@#$%');
        // Should find the video with special characters
        await (0, test_1.expect)(page.locator('.video-list-item').filter({ hasText: /.*/ })).toHaveCount(1);
        await (0, test_1.expect)(page.locator('.video-list-item').filter({ hasText: 'Special Chars !@#$%' })).toBeVisible();
    });
    (0, test_1.test)('Edge Case 4: should handle Unicode characters in search queries', async ({ page }) => {
        const searchInput = page.locator('#playlist-search');
        // Search for Unicode emoji
        await searchInput.fill('🎵');
        // Should find the video with Unicode
        await (0, test_1.expect)(page.locator('.video-list-item').filter({ hasText: /.*/ })).toHaveCount(1);
        await (0, test_1.expect)(page.locator('.video-list-item').filter({ hasText: 'Unicode Test 🎵' })).toBeVisible();
    });
    (0, test_1.test)('Edge Case 5: should handle very long search queries', async ({ page }) => {
        const searchInput = page.locator('#playlist-search');
        // Enter very long search query
        const longQuery = 'Very Long Title That Goes On And On With Many Words';
        await searchInput.fill(longQuery);
        // Should find the matching video
        await (0, test_1.expect)(page.locator('.video-list-item').filter({ hasText: /.*/ })).toHaveCount(1);
        await (0, test_1.expect)(page.locator('.video-list-item').filter({ hasText: longQuery })).toBeVisible();
    });
    (0, test_1.test)('Edge Case 6: should handle search in empty playlist', async ({ page }) => {
        // Override mock to return empty playlist
        await page.evaluate(() => {
            window.electronAPI.getVideosForPlaylist = () => Promise.resolve([]);
        });
        // Clear existing videos from DOM
        await page.evaluate(() => {
            const videoList = document.querySelector('.video-list');
            if (videoList)
                videoList.innerHTML = '';
        });
        const searchInput = page.locator('#playlist-search');
        await searchInput.fill('test');
        // Should show no results
        await (0, test_1.expect)(page.locator('.video-list-item')).toHaveCount(0);
        await (0, test_1.expect)(page.locator('.no-results')).toBeVisible();
    });
    (0, test_1.test)('Edge Case 7: should handle search with identical video titles', async ({ page }) => {
        // Override mock to return identical titles
        await page.evaluate(() => {
            window.electronAPI.getVideosForPlaylist = () => Promise.resolve([
                { id: 'video1', title: 'Identical Title', duration: 180 },
                { id: 'video2', title: 'Identical Title', duration: 240 },
                { id: 'video3', title: 'Different Title', duration: 300 }
            ]);
        });
        // Update DOM with identical titles
        await page.evaluate(() => {
            const videoList = document.querySelector('.video-list');
            if (videoList)
                videoList.innerHTML = `
        <div class="video-list-item" data-video-id="video1">Identical Title</div>
        <div class="video-list-item" data-video-id="video2">Identical Title</div>
        <div class="video-list-item" data-video-id="video3">Different Title</div>
      `;
        });
        const searchInput = page.locator('#playlist-search');
        await searchInput.fill('Identical');
        // Should find both identical titles
        await (0, test_1.expect)(page.locator('.video-list-item').filter({ hasText: /.*/ })).toHaveCount(2);
        await (0, test_1.expect)(page.locator('.video-list-item').filter({ hasText: 'Identical Title' })).toHaveCount(2);
    });
    (0, test_1.test)('Edge Case 8: should handle search in single-video playlist', async ({ page }) => {
        // Override mock to return single video
        await page.evaluate(() => {
            window.electronAPI.getVideosForPlaylist = () => Promise.resolve([
                { id: 'video1', title: 'Single Video', duration: 180 }
            ]);
        });
        // Update DOM with single video
        await page.evaluate(() => {
            const videoList = document.querySelector('.video-list');
            if (videoList)
                videoList.innerHTML = `
        <div class="video-list-item" data-video-id="video1">Single Video</div>
      `;
        });
        const searchInput = page.locator('#playlist-search');
        // Test matching search
        await searchInput.fill('Single');
        await (0, test_1.expect)(page.locator('.video-list-item').filter({ hasText: /.*/ })).toHaveCount(1);
        // Test non-matching search
        await searchInput.fill('NonExistent');
        await (0, test_1.expect)(page.locator('.video-list-item').filter({ hasText: /.*/ })).toHaveCount(0);
        await (0, test_1.expect)(page.locator('.no-results')).toBeVisible();
    });
    (0, test_1.test)('Edge Case 9: should handle rapid consecutive search input changes', async ({ page }) => {
        const searchInput = page.locator('#playlist-search');
        // Rapidly change search input
        await searchInput.fill('Test');
        await searchInput.fill('Video');
        await searchInput.fill('Another');
        // Should show results for final search term
        await (0, test_1.expect)(page.locator('.video-list-item').filter({ hasText: /.*/ })).toHaveCount(1);
        await (0, test_1.expect)(page.locator('.video-list-item').filter({ hasText: 'Another Video' })).toBeVisible();
    });
    (0, test_1.test)('Edge Case 10: should handle mixed case search queries', async ({ page }) => {
        const searchInput = page.locator('#playlist-search');
        // Test various case combinations
        await searchInput.fill('test');
        await (0, test_1.expect)(page.locator('.video-list-item').filter({ hasText: /.*/ })).toHaveCount(2);
        await searchInput.fill('TEST');
        await (0, test_1.expect)(page.locator('.video-list-item').filter({ hasText: /.*/ })).toHaveCount(2);
        await searchInput.fill('TeSt');
        await (0, test_1.expect)(page.locator('.video-list-item').filter({ hasText: /.*/ })).toHaveCount(2);
    });
    (0, test_1.test)('Edge Case 11: should handle search with leading/trailing whitespace', async ({ page }) => {
        const searchInput = page.locator('#playlist-search');
        // Search with leading and trailing whitespace
        await searchInput.fill('  Test Video  ');
        // Should find videos (whitespace should be trimmed)
        await (0, test_1.expect)(page.locator('.video-list-item').filter({ hasText: /.*/ })).toHaveCount(2);
        await (0, test_1.expect)(page.locator('.video-list-item').filter({ hasText: 'Test Video 1' })).toBeVisible();
        await (0, test_1.expect)(page.locator('.video-list-item').filter({ hasText: 'Test Video 2' })).toBeVisible();
    });
    (0, test_1.test)('Edge Case 12: should handle pasted content in search field', async ({ page }) => {
        const searchInput = page.locator('#playlist-search');
        // Simulate pasted content
        await searchInput.focus();
        await page.keyboard.type('Unicode Test');
        // Should find the Unicode video
        await (0, test_1.expect)(page.locator('.video-list-item').filter({ hasText: /.*/ })).toHaveCount(1);
        await (0, test_1.expect)(page.locator('.video-list-item').filter({ hasText: 'Unicode Test 🎵' })).toBeVisible();
    });
});
//# sourceMappingURL=story_1.5_search_within_playlist.spec.js.map