import { MediaDetails, MediaType } from '../../search/models/media';

export type WatchStatus = 'to_watch' | 'watching' | 'watched';

export interface LibraryEntry {
  id: string;
  mediaId: string;
  status: WatchStatus;
  media: MediaDetails;
  rating?: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AddLibraryEntryRequest {
  mediaType: MediaType;
  tmdbId: number;
  status: WatchStatus;
}
