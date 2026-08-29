import type { components } from '../../../core/api/generated/api-contracts';

type ApiSchemas = components['schemas'];

export type FriendshipStatus = ApiSchemas['FriendshipStatus'];
export type FriendshipDirection = ApiSchemas['FriendshipDirection'];
export type Friendship = ApiSchemas['FriendshipResponse'];
export type FriendshipsOverview = ApiSchemas['FriendshipsResponse'];
export type MediaFriendActivity = ApiSchemas['MediaFriendActivityResponse'];
export type MediaFriendContext = ApiSchemas['MediaFriendContextResponse'];
