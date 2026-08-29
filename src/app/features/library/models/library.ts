import type { components } from '../../../core/api/generated/api-contracts';

type ApiSchemas = components['schemas'];

export type WatchStatus = ApiSchemas['WatchStatus'];
export type AudioType = ApiSchemas['AudioType'];
export type LibraryProgress = ApiSchemas['LibraryProgress'];
export type PlaybackAudioPreference = ApiSchemas['PlaybackAudioPreference'];
export type PlaybackPreference = ApiSchemas['PlaybackPreference'];
export type LibraryEntry = ApiSchemas['LibraryEntryResponse'];
export type LibrarySharedListReference = ApiSchemas['LibrarySharedListReference'];
export type AddLibraryEntryRequest = ApiSchemas['AddLibraryEntryDto'];
export type UpdateProgressRequest = ApiSchemas['UpdateProgressDto'];
export type UpdatePlaybackPreferenceRequest =
  ApiSchemas['UpdatePlaybackPreferenceDto'];
