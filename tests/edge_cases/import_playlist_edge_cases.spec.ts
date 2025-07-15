// @ts-nocheck
import { test, expect, _electron as electron } from '@playwright/test';
import { ElectronApplication, Page } from 'playwright';

let electronApp: ElectronApplication;
let page: Page;

test.beforeAll(async () => {
  electronApp = await electron.launch({ args: ['.'] });
  page = await electronApp.firstWindow();
});

test.afterAll(async () => {
  await electronApp.close();
});

const openAddPlaylistDialog = async () => {
  await page.click('#add-playlist-button'); // Assuming a button with this ID opens the dialog
  await expect(page.locator('#add-playlist-dialog')).toBeVisible();
};

test.describe('Edge Cases for Story 1.3: Import Public Playlist', () => {

  test.beforeEach(async () => {
    // Reset state before each test if necessary, e.g., clear DB
    await page.evaluate(() => window.ipc.invoke('test:reset-database'));
    await openAddPlaylistDialog();
  });

  test.describe('Invalid Input', () => {
    test('should show error for malformed URL', async () => {
      await page.fill('#playlist-url-input', 'not-a-valid-url');
      await expect(page.locator('.url-error-message')).toHaveText('Invalid URL format. Please enter a valid YouTube playlist URL.');
      await expect(page.locator('#import-playlist-button')).toBeDisabled();
    });

    test('should show error for non-YouTube URL', async () => {
      await page.fill('#playlist-url-input', 'https://www.vimeo.com/12345');
      await expect(page.locator('.url-error-message')).toHaveText('Invalid URL format. Please enter a valid YouTube playlist URL.');
      await expect(page.locator('#import-playlist-button')).toBeDisabled();
    });

    test('should show error for single video URL', async () => {
      // Mock the metadata fetch to identify it as a single video
      await page.route('**/api/youtube/metadata**', route => {
        route.fulfill({
          status: 400,
          json: { error: 'URL is for a single video, not a playlist.' },
        });
      });

      await page.fill('#playlist-url-input', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');
      await page.waitForResponse('**/api/youtube/metadata**');
      
      await expect(page.locator('.preview-error-message')).toHaveText('This is a URL for a single video, not a playlist. Please provide a playlist URL.');
      await expect(page.locator('#import-playlist-button')).toBeDisabled();
    });
  });

  test.describe('Playlist Issues', () => {
    test('should show error for a non-existent playlist', async () => {
      await page.route('**/api/youtube/metadata**', route => {
        route.fulfill({ status: 404, json: { error: 'Playlist not found.' } });
      });

      await page.fill('#playlist-url-input', 'https://www.youtube.com/playlist?list=NON_EXISTENT_PLAYLIST');
      await page.waitForResponse('**/api/youtube/metadata**');

      await expect(page.locator('.preview-error-message')).toHaveText('Could not fetch playlist. It may be private, deleted, or members-only.');
      await expect(page.locator('#import-playlist-button')).toBeDisabled();
    });

    test('should show error for an empty playlist', async () => {
      await page.route('**/api/youtube/metadata**', route => {
        route.fulfill({
          status: 200,
          json: { title: 'Empty Playlist', videoCount: 0, thumbnailUrl: 'http://example.com/thumb.jpg' },
        });
      });

      await page.fill('#playlist-url-input', 'https://www.youtube.com/playlist?list=EMPTY_PLAYLIST');
      await page.waitForResponse('**/api/youtube/metadata**');

      await expect(page.locator('.playlist-preview-title')).toHaveText('Empty Playlist');
      await expect(page.locator('.playlist-preview-count')).toHaveText('0 videos');
      await expect(page.locator('.preview-error-message')).toHaveText('Cannot import an empty playlist.');
      await expect(page.locator('#import-playlist-button')).toBeDisabled();
    });
  });

  test.describe('Network & Database Failures', () => {
    test('should show error on network failure during metadata fetch', async () => {
      await page.route('**/api/youtube/metadata**', route => route.abort());

      await page.fill('#playlist-url-input', 'https://www.youtube.com/playlist?list=ANY_PLAYLIST');
      await page.waitForResponse('**/api/youtube/metadata**').catch(() => {});

      await expect(page.locator('.preview-error-message')).toHaveText('Network error. Please check your connection and try again.');
      await expect(page.locator('#import-playlist-button')).toBeDisabled();
    });

    test('should show UI error if creating background task fails', async () => {
      // Mock the ipc.invoke call within the page to simulate a failure
      await page.evaluate(() => {
        const originalInvoke = window.ipc.invoke;
        window.ipc.invoke = (channel, ...args) => {
          if (channel === 'task:create') {
            return Promise.reject(new Error('Simulated database write failure'));
          }
          return originalInvoke(channel, ...args);
        };
      });

      // Mock a successful metadata fetch
      await page.route('**/api/youtube/metadata**', route => {
        route.fulfill({
          status: 200,
          json: { title: 'Test Playlist', videoCount: 5, thumbnailUrl: 'http://example.com/thumb.jpg' },
        });
      });

      await page.fill('#playlist-url-input', 'https://www.youtube.com/playlist?list=VALID_PLAYLIST');
      await page.waitForResponse('**/api/youtube/metadata**');
      await page.click('#import-playlist-button');
      
      await expect(page.locator('.dialog-error-message')).toHaveText('A database error occurred. Could not start the import task.');
    });
  });

  test.describe('User Actions', () => {
    test('should show error if importing an already imported playlist', async () => {
      // Pre-populate the DB with a playlist
      await page.evaluate(() => window.ipc.invoke('test:add-playlist', { youtubeId: 'ALREADY_IMPORTED_ID', title: 'Existing' }));
      
      // Mock the metadata fetch
      await page.route('**/api/youtube/metadata**', route => {
        route.fulfill({
          status: 200,
          json: { id: 'ALREADY_IMPORTED_ID', title: 'Existing Playlist', videoCount: 10 },
        });
      });

      await page.fill('#playlist-url-input', 'https://www.youtube.com/playlist?list=ALREADY_IMPORTED_ID');
      await page.waitForResponse('**/api/youtube/metadata**');

      await expect(page.locator('.preview-error-message')).toHaveText('This playlist has already been imported.');
      await expect(page.locator('#import-playlist-button')).toBeDisabled();
    });
  });
});