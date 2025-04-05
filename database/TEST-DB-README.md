# Test Database

This file contains a test database for development purposes.

## Structure

```json
{
  "playlists": [
    {
      "id": "1234-5678-9012",
      "name": "Test Playlist 1",
      "description": "A test playlist for development",
      "videos": [
        {
          "id": "video-1",
          "title": "Test Video 1",
          "url": "https://www.youtube.com/watch?v=test1",
          "thumbnail": "https://i.ytimg.com/vi/test1/default.jpg",
          "duration": 120,
          "downloaded": false,
          "addedAt": "2025-04-05T20:30:18.780Z"
        },
        {
          "id": "video-2",
          "title": "Test Video 2",
          "url": "https://www.youtube.com/watch?v=test2",
          "thumbnail": "https://i.ytimg.com/vi/test2/default.jpg",
          "duration": 180,
          "downloaded": true,
          "downloadPath": "/path/to/video.mp4",
          "fileSize": 10485760,
          "format": "mp4",
          "addedAt": "2025-04-05T20:30:18.781Z"
        }
      ],
      "source": "youtube",
      "sourceUrl": "https://www.youtube.com/playlist?list=test",
      "createdAt": "2025-04-05T20:30:18.781Z",
      "updatedAt": "2025-04-05T20:30:18.781Z",
      "tags": [
        "music",
        "test"
      ]
    },
    {
      "id": "2345-6789-0123",
      "name": "Test Playlist 2",
      "description": "Another test playlist",
      "videos": [
        {
          "id": "video-3",
          "title": "Test Video 3",
          "url": "https://www.youtube.com/watch?v=test3",
          "thumbnail": "https://i.ytimg.com/vi/test3/default.jpg",
          "duration": 240,
          "downloaded": false,
          "addedAt": "2025-04-05T20:30:18.781Z"
        }
      ],
      "source": "local",
      "createdAt": "2025-04-05T20:30:18.781Z",
      "updatedAt": "2025-04-05T20:30:18.781Z",
      "tags": [
        "test"
      ]
    }
  ]
}
```

## Usage

This file is used for testing and development. It contains sample data that can be used to test the application without having to create real playlists and videos.

## Notes

- This file is not used in production.
- This file is ignored by git.
- You can modify this file to add more test data.
