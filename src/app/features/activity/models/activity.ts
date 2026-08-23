import { WatchStatus } from '../../library/models/library';
import { MediaSummary } from '../../search/models/media';
import { PublicUserProfile } from '../../users/models/public-user-profile';

export type ActivityType = 'library_added' | 'library_rated' | 'library_status_changed';

export interface ActivityFeedItem {
  id: string;
  type: ActivityType;
  actor: PublicUserProfile;
  media: MediaSummary;
  status?: WatchStatus;
  rating?: number;
  createdAt: string;
}

export interface ActivityFeed {
  page: number;
  totalPages: number;
  totalResults: number;
  items: ActivityFeedItem[];
}
