// src/shared/ipc-contract.ts

/**
 * This file defines the contract for all Inter-Process Communication (IPC)
 * between the main and renderer processes. By defining all channel names
 * and payload types in one place, we ensure type safety and prevent a
 * whole class of runtime errors.
 *
 * All "invoke" channels (request/response) should be defined in `IpcInvokeChannels`.
 * All "send" channels (one-way, main to renderer) should be defined in `IpcSendChannels`.
 */

import { Playlist, Video, BackgroundTask } from './data-models'; // Note: These models will need to be created/defined elsewhere.

//==============================================================================
// IPC Channel Contracts
//==============================================================================

/**
 * Defines the contract for "invoke" channels, which follow a request/response pattern.
 * The key is the channel name, and the value is a tuple `[ArgType, ReturnType]`.
 */
export interface IpcInvokeChannels {
  'playlist:create': [
    { title: string; description?: string; type: 'YOUTUBE' | 'CUSTOM' },
    Playlist
  ];
  'playlist:importFromUrl': [{ url: string }, BackgroundTask]; // Returns the initial background task
  'playlist:getDetails': [{ playlistId: number }, Playlist | null];
  'playlist:getAll': [void, Playlist[]];
  'video:download': [
    {
      videoId: string;
      quality: string;
      format: 'mp4' | 'mp3';
      downloadPath: string;
    },
    BackgroundTask
  ];
  'settings:get': [{ key: string }, any];
  'settings:set': [{ key: string; value: any }, void];
}

/**
 * Defines the contract for "send" channels, which are one-way from main to renderer.
 * The key is the channel name, and the value is the payload type.
 */
export interface IpcSendChannels {
  'task:updated': [BackgroundTask];
  'download:progress': [{ taskId: number; progress: number; speed: string }];
  'app:error': [{ title: string; message: string }];
}

//==============================================================================
// Helper Types
//==============================================================================

// Type helpers to extract argument and return types for invoke channels
export type IpcInvokeArg<C extends keyof IpcInvokeChannels> =
  IpcInvokeChannels[C][0];
export type IpcInvokeReturn<C extends keyof IpcInvokeChannels> =
  IpcInvokeChannels[C][1];

// Type helper to extract payload type for send channels
export type IpcSendPayload<C extends keyof IpcSendChannels> =
  IpcSendChannels[C];