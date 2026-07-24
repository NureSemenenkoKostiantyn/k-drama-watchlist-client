import { MediaDetails, MediaType } from '../../search/models/media';

export type WatchStatus = 'to_watch' | 'watching' | 'watched';
export type AudioType = 'original' | 'dubbed' | 'mixed' | 'unknown';

export interface LibraryProgress {
  currentSeason: number;
  currentEpisode: number;
  completedEpisodes: number;
  totalEpisodesSnapshot?: number;
  completedSeasonNumbers: number[];
  includeSpecials: boolean;
  updatedAt: string;
}

export interface PlaybackAudioPreference {
  type: AudioType;
  languageCode?: string;
  customLabel?: string;
}

export interface PlaybackPreference {
  audio?: PlaybackAudioPreference;
  subtitleLanguageCode?: string;
}

export interface LibraryEntry {
  id: string;
  mediaId: string;
  status: WatchStatus;
  media: MediaDetails;
  categoryIds: string[];
  priorityLaneId?: string;
  priorityPosition?: number;
  progress?: LibraryProgress;
  rating?: number;
  description?: string;
  playbackPreference?: PlaybackPreference;
  startedAt?: string;
  completedAt?: string;
  lastProgressAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AddLibraryEntryRequest {
  mediaType: MediaType;
  tmdbId: number;
  status: WatchStatus;
}

export interface UpdateProgressRequest {
  currentSeason: number;
  currentEpisode: number;
  includeSpecials?: boolean;
}

export interface UpdatePlaybackPreferenceRequest {
  audio?: PlaybackAudioPreference | null;
  subtitleLanguageCode?: string | null;
}
