import { MediaDetails } from '../../search/models/media';
import { PublicUserProfile } from '../../users/models/public-user-profile';

export type WheelVisibility = 'private' | 'unlisted' | 'public';
export type WheelRole = 'owner' | 'editor' | 'viewer';
export type WheelSelectionMode =
  | 'fully_random'
  | 'avoid_recent_winners';

export interface Wheel {
  id: string;
  title: string;
  description?: string;
  visibility: WheelVisibility;
  role: WheelRole;
  selectionMode: WheelSelectionMode;
  itemCount: number;
  enabledItemCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface WheelItem {
  id: string;
  mediaId: string;
  position: number;
  weight: number;
  isEnabled: boolean;
  lastSelectedAt?: string;
  selectionCount: number;
  media: MediaDetails;
  createdAt: string;
  updatedAt: string;
}

export interface WheelMember {
  user: PublicUserProfile;
  role: WheelRole;
}

export interface WheelDetails extends Wheel {
  items: WheelItem[];
  members: WheelMember[];
}

export interface SelectedWheelItem {
  wheelItemId: string;
  mediaId: string;
  title: string;
  posterUrl?: string;
}

export interface WheelSpin {
  spinId: string;
  selectedItem: SelectedWheelItem;
  spunBy?: PublicUserProfile;
  createdAt: string;
}

export type WheelSpinHistory = WheelSpin;

export interface CreateWheelRequest {
  title: string;
  description?: string;
  selectionMode: WheelSelectionMode;
}

export interface UpdateWheelRequest {
  title?: string;
  description?: string | null;
  selectionMode?: WheelSelectionMode;
}

export interface UpdateWheelItemRequest {
  weight?: number;
  isEnabled?: boolean;
}

export interface AddWheelMemberRequest {
  username: string;
  role: Exclude<WheelRole, 'owner'>;
}
