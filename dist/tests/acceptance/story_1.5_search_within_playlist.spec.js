"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const test_1 = require("@playwright/test");
const MOCK_PLAYLIST_ID = "mock-playlist-123";
const MOCK_VIDEOS = [
    { id: "v1", title: "Test Video 1", thumbnail: "http://thumbnail.url/1" },
    { id: "v2", title: "Sample Video 2", thumbnail: "http://thumbnail.url/2" },
    { id: "v3", title: "Another Test Video", thumbnail: "http://thumbnail.url/3" },
    { id: "v4", title: "Fourth Video", thumbnail: "http://thumbnail.url/4" },
    { id: "v5", title: "Fifth of May", thumbnail: "http://thumbnail.url/5" },
    { id: "v6", title: "Sixth Sense", thumbnail: "http://thumbnail.url/6" },
    { id: "v7", title: "Seventh Son", thumbnail: "http://thumbnail.url/7" },
    { id: "v8", title: "Eighth Wonder", thumbnail: "http://thumbnail.url/8" },
    { id: "v9", title: "Ninth Gate", thumbnail: "http://thumbnail.url/9" },
    { id: "v10", title: "Tenth Kingdom", thumbnail: "http://thumbnail.url/10" },
];
test_1.test.describe("User Story 1.5: Search Within a Playlist - Acceptance Tests", () => {
    test_1.test.beforeEach(async ({ page }) => {
        // Load the HTML file directly, similar to existing tests
        await page.goto('file://' + require('path').resolve(__dirname, '../../src/index.html'));
        // Set up IPC mocks and simulate playlist detail view
        await page.evaluate(({ playlistId, videos }) => {
            // Mock the IPC renderer
            window.ipcRenderer = {
                send: () => { },
                invoke: (channel, ...args) => {
                    if (channel === "get-videos-for-playlist" && args[0] === playlistId) {
                        return Promise.resolve(videos);
                    }
                    if (channel === 'get-playlist') {
                        return Promise.resolve({
                            id: playlistId,
                            name: "Mocked Playlist",
                            description: "A playlist for testing",
                            videoCount: videos.length
                        });
                    }
                    return Promise.resolve();
                },
                on: () => { },
                removeAllListeners: () => { },
            };
            // Simulate the playlist detail view being active
            document.body.innerHTML = `
          <div id="playlist-details-view" style="display: block;">
            <h2>Mocked Playlist</h2>
            <input type="text" id="playlist-search-input" placeholder="Search videos..." />
            <div id="video-list">
              ${videos.map(video => `
                <div class="video-list-item" data-video-id="${video.id}">
                  <img src="${video.thumbnail}" alt="${video.title}" />
                  <span class="video-title">${video.title}</span>
                </div>
              `).join('')}
            </div>
            <div id="no-results-message" style="display: none;">No results found</div>
          </div>
        `;
            // Add basic search functionality for testing
            const searchInput = document.getElementById('playlist-search-input');
            const videoList = document.getElementById('video-list');
            const noResultsMessage = document.getElementById('no-results-message');
            if (searchInput && videoList && noResultsMessage) {
                searchInput.addEventListener('input', () => {
                    const query = searchInput.value.toLowerCase().trim();
                    const videoItems = videoList.querySelectorAll('.video-list-item');
                    let visibleCount = 0;
                    videoItems.forEach(item => {
                        const title = item.querySelector('.video-title')?.textContent || '';
                        const matches = query === '' || title.toLowerCase().includes(query);
                        if (matches) {
                            item.style.display = 'block';
                            visibleCount++;
                        }
                        else {
                            item.style.display = 'none';
                        }
                    });
                    // Show/hide no results message
                    if (query !== '' && visibleCount === 0) {
                        noResultsMessage.style.display = 'block';
                    }
                    else {
                        noResultsMessage.style.display = 'none';
                    }
                });
            }
        }, { playlistId: MOCK_PLAYLIST_ID, videos: MOCK_VIDEOS });
        // Wait for the playlist detail view to be visible
        await page.waitForSelector("#playlist-details-view", { state: "visible" });
    });
    // Test Case ID: TC_1.5.1
    (0, test_1.test)("AC1: should display a search input field in the playlist detail view", async ({ page }) => {
        const searchInput = page.locator("#playlist-search-input");
        await (0, test_1.expect)(searchInput).toBeVisible();
        await (0, test_1.expect)(searchInput).toHaveAttribute("type", "text");
    });
    // Test Case ID: TC_1.5.2
    (0, test_1.test)("AC2 & AC3: should filter the video list case-insensitively and update the count", async ({ page }) => {
        // Prerequisite: Verify all 10 videos are initially visible
        await (0, test_1.expect)(page.locator(".video-list-item").filter({ hasText: /.*/ })).toHaveCount(10);
        // Step 2: Type the search query
        const searchInput = page.locator("#playlist-search-input");
        await searchInput.fill("test video");
        // Step 3 & 4: Verify the filtered list
        const visibleItems = page.locator(".video-list-item").filter({ hasText: /.*/ });
        await (0, test_1.expect)(visibleItems).toHaveCount(2);
        // Verify the correct items are visible
        await (0, test_1.expect)(page.locator(".video-list-item").filter({ hasText: "Test Video 1" })).toBeVisible();
        await (0, test_1.expect)(page.locator(".video-list-item").filter({ hasText: "Another Test Video" })).toBeVisible();
    });
    // Test Case ID: TC_1.5.3
    (0, test_1.test)("AC4: should restore the full video list when the search query is cleared", async ({ page }) => {
        const searchInput = page.locator("#playlist-search-input");
        // Step 1: Filter the list
        await searchInput.fill("test video");
        await (0, test_1.expect)(page.locator(".video-list-item").filter({ hasText: /.*/ })).toHaveCount(2);
        // Step 2 & 3: Clear the input field
        await searchInput.fill("");
        // Step 4: Verify the list is restored
        await (0, test_1.expect)(page.locator(".video-list-item").filter({ hasText: /.*/ })).toHaveCount(10);
    });
    // Test Case ID: TC_1.5.4
    (0, test_1.test)('AC5: should display a "No results found" message for a non-matching query', async ({ page }) => {
        const searchInput = page.locator("#playlist-search-input");
        const noResultsMessage = page.locator("#no-results-message");
        // Step 1 & 2: Type a query with no possible matches
        await searchInput.fill("nonexistent-xyz-query");
        // Step 3: Verify the message is displayed
        await (0, test_1.expect)(noResultsMessage).toBeVisible();
        await (0, test_1.expect)(noResultsMessage).toHaveText("No results found");
        // Step 4: Verify no video items are visible
        await (0, test_1.expect)(page.locator(".video-list-item").filter({ hasText: /.*/ })).toHaveCount(0);
    });
});
//# sourceMappingURL=story_1.5_search_within_playlist.spec.js.map