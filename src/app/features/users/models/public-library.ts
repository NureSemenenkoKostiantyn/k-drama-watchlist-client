import { WatchStatus } from '../../library/models/library';
import {
  MediaSummary,
  MediaType,
} from '../../search/models/media';
import { LibraryVisibility } from '../../settings/models/settings';
import { PublicUserProfile } from './public-user-profile';

export interface PublicLibraryItem {
  media: MediaSummary;
  status: WatchStatus;
  rating?: number;
}

export interface PublicLibraryResponse {
  user: PublicUserProfile;
  visibility: LibraryVisibility;
  isOwner: boolean;
  page: number;
  totalPages: number;
  totalResults: number;
  items: PublicLibraryItem[];
}

export type PublicLibrarySort =
  | 'recent'
  | 'title_asc'
  | 'title_desc'
  | 'rating_desc'
  | 'release_desc'
  | 'release_asc';

export interface PublicLibraryFilters {
  status?: WatchStatus;
  mediaType?: MediaType;
  minRating?: number;
  genreId?: number;
  country?: string;
  yearFrom?: number;
  yearTo?: number;
  sort?: PublicLibrarySort;
  page: number;
  limit?: number;
}
