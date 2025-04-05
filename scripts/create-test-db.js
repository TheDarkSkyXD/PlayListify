#!/usr/bin/env node

/**
 * Create a test database file for development
 */

const fs = require('fs-extra');
const path = require('path');

// Create a simple JSON database for testing
const testDb = {
  playlists: [
    {
      id: '1234-5678-9012',
      name: 'Test Playlist 1',
      description: 'A test playlist for development',
      videos: [
        {
          id: 'video-1',
          title: 'Test Video 1',
          url: 'https://www.youtube.com/watch?v=test1',
          thumbnail: 'https://i.ytimg.com/vi/test1/default.jpg',
          duration: 120,
          downloaded: false,
          addedAt: new Date().toISOString()
        },
        {
          id: 'video-2',
          title: 'Test Video 2',
          url: 'https://www.youtube.com/watch?v=test2',
          thumbnail: 'https://i.ytimg.com/vi/test2/default.jpg',
          duration: 180,
          downloaded: true,
          downloadPath: '/path/to/video.mp4',
          fileSize: 1024 * 1024 * 10, // 10MB
          format: 'mp4',
          addedAt: new Date().toISOString()
        }
      ],
      source: 'youtube',
      sourceUrl: 'https://www.youtube.com/playlist?list=test',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: ['music', 'test']
    },
    {
      id: '2345-6789-0123',
      name: 'Test Playlist 2',
      description: 'Another test playlist',
      videos: [
        {
          id: 'video-3',
          title: 'Test Video 3',
          url: 'https://www.youtube.com/watch?v=test3',
          thumbnail: 'https://i.ytimg.com/vi/test3/default.jpg',
          duration: 240,
          downloaded: false,
          addedAt: new Date().toISOString()
        }
      ],
      source: 'local',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: ['test']
    }
  ]
};

// Create the database directory if it doesn't exist
const dbDir = path.join(process.cwd(), 'database');
fs.ensureDirSync(dbDir);

// Create the test database file
const dbPath = path.join(dbDir, 'test-db.json');
fs.writeFileSync(dbPath, JSON.stringify(testDb, null, 2));

console.log(`Test database created at ${dbPath}`);

// Create a README file explaining the test database
const readmePath = path.join(dbDir, 'TEST-DB-README.md');
fs.writeFileSync(readmePath, `# Test Database

This file contains a test database for development purposes.

## Structure

\`\`\`json
${JSON.stringify(testDb, null, 2)}
\`\`\`

## Usage

This file is used for testing and development. It contains sample data that can be used to test the application without having to create real playlists and videos.

## Notes

- This file is not used in production.
- This file is ignored by git.
- You can modify this file to add more test data.
`);

console.log(`Test database README created at ${readmePath}`);
