import { MediaDetails } from '../../search/models/media';
import { PublicUserProfile } from '../../users/models/public-user-profile';

export type SharedListRole = 'owner' | 'editor' | 'commenter' | 'viewer';
export type SharedListItemStatus = 'planned' | 'watching' | 'finished';
export type SharedListVisibility = 'private' | 'unlisted' | 'public';

export interface SharedList {
  id: string;
  title: string;
  description?: string;
  visibility: SharedListVisibility;
  publicSlug?: string;
  role: SharedListRole;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface SharedListMember {
  user: PublicUserProfile;
  role: SharedListRole;
  joinedAt: string;
}

export interface SharedListProgress {
  currentSeason: number;
  currentEpisode: number;
}

export interface SharedListItem {
  id: string;
  mediaId: string;
  position: number;
  media: MediaDetails;
  addedBy?: PublicUserProfile;
  note?: string;
  groupStatus?: SharedListItemStatus;
  groupProgress?: SharedListProgress;
  createdAt: string;
  updatedAt: string;
}

export interface SharedListDetails extends SharedList {
  members: SharedListMember[];
  items: SharedListItem[];
}

export interface PublicSharedListItem extends Omit<SharedListItem, 'id' | 'mediaId' | 'media'> {
  media: Omit<MediaDetails, 'id'>;
}

export interface PublicSharedListDetails {
  title: string;
  description?: string;
  visibility: Exclude<SharedListVisibility, 'private'>;
  publicSlug: string;
  itemCount: number;
  members: SharedListMember[];
  items: PublicSharedListItem[];
  createdAt: string;
  updatedAt: string;
}

export interface SharedListInvite {
  id: string;
  acceptUrl: string;
  target: PublicUserProfile;
  role: Exclude<SharedListRole, 'owner'>;
  expiresAt: string;
}

export interface UpdateSharedListItemRequest {
  note?: string | null;
  groupStatus?: SharedListItemStatus | null;
  groupProgress?: SharedListProgress | null;
}
