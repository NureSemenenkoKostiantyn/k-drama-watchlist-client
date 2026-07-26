import { PublicUserProfile } from '../../users/models/public-user-profile';

export type FriendshipStatus = 'pending' | 'accepted' | 'blocked';
export type FriendshipDirection = 'incoming' | 'outgoing';

export interface Friendship {
  id: string;
  status: FriendshipStatus;
  direction: FriendshipDirection;
  user: PublicUserProfile;
  createdAt: string;
  acceptedAt?: string;
}

export interface FriendshipsOverview {
  friends: Friendship[];
  incomingRequests: Friendship[];
  outgoingRequests: Friendship[];
}
