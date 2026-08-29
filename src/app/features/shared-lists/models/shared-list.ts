import type { components } from '../../../core/api/generated/api-contracts';

type ApiSchemas = components['schemas'];

export type SharedListRole = ApiSchemas['SharedListRole'];
export type SharedListItemStatus = ApiSchemas['SharedListItemStatus'];
export type SharedListVisibility = ApiSchemas['SharedListVisibility'];
export type SharedList = ApiSchemas['SharedListResponse'];
export type SharedListMember = ApiSchemas['SharedListMemberResponse'];
export type SharedListProgress = ApiSchemas['SharedListProgressResponse'];
export type SharedListItem = ApiSchemas['SharedListItemResponse'];
export type SharedListDetails = ApiSchemas['SharedListDetailsResponse'];
export type PublicSharedListItem = ApiSchemas['PublicSharedListItemResponse'];
export type PublicSharedListDetails =
  ApiSchemas['PublicSharedListDetailsResponse'];
export type PublicSharedListPreviewMedia =
  ApiSchemas['PublicSharedListPreviewMediaResponse'];
export type PublicSharedListDiscoveryItem =
  ApiSchemas['PublicSharedListDiscoveryItemResponse'];
export type PublicSharedListDiscovery =
  ApiSchemas['PublicSharedListDiscoveryResponse'];
export type SharedListPendingInvite =
  ApiSchemas['SharedListPendingInviteResponse'];
export type SharedListInvite = ApiSchemas['SharedListInviteResponse'];
export type UpdateSharedListItemRequest = ApiSchemas['UpdateSharedListItemDto'];
