# Environment Variables & Configuration

This document outlines the environment variables and user-configurable settings used by the Playlistify application.

## Build-Time / Developer Environment Variables

These variables are primarily for development and debugging purposes. They can be set in a `.env` file at the root of the project.

| Variable | Description | Default | Example |
| :--- | :--- | :--- | :--- |
| `LOG_LEVEL` | Controls the verbosity of the Winston logger. | `info` | `debug` |
| `OPEN_DEV_TOOLS` | If set to `true`, automatically opens the Chrome DevTools on application startup. | `false` | `true` |

## User-Configurable Settings (`electron-store`)

These settings are managed by the `electron-store` package and can be modified by the user through the application's UI (e.g., the Settings page).

| Key | Description | Default Value | UI Location |
| :--- | :--- | :--- | :--- |
| `downloadPath` | The default filesystem path where all downloaded videos are saved. | User's `Downloads` folder | Downloads Page / Settings |
| `healthCheckFrequency` | The interval for the automatic playlist health check scheduler. | `daily` | Settings > Auto-Sync |
| `maxConcurrentDownloads` | The maximum number of videos to download simultaneously. | `3` | Settings > Downloads |
| `maxConcurrentHealthChecks`| The maximum number of videos to check at once during a health scan. | `2` | Settings > Auto-Sync |
