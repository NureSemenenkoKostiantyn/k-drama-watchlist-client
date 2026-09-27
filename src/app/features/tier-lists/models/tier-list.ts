import type { components } from '../../../core/api/generated/api-contracts';

type Schemas = components['schemas'];
export type TierList = Schemas['TierListResponse'];
export type TierListSummary = Schemas['TierListSummaryResponse'];
export type PublicTierList = Schemas['PublicTierListResponse'];
export type TierRow = Schemas['TierRowResponse'];
export type TierMedia = Schemas['TierListMedia'];
export type TierColor = Schemas['TierColor'];
export type TierVisibility = Schemas['TierListVisibility'];
export type TierListSource = Schemas['TierListSource'];
export type CreateTierList = Schemas['CreateTierListDto'];
export type UpdateTierList = Schemas['UpdateTierListDto'];
export type TierLayout = Schemas['UpdateTierLayoutDto'];
export type AddTierItems = Schemas['AddTierItemsDto'];
export type RemoveTierItem = Schemas['RemoveTierItemDto'];

export const TIER_COLORS: Record<TierColor, string> = {
  red: '#ff8585',
  orange: '#ffb675',
  yellow: '#ffe58a',
  green: '#90d9a1',
  blue: '#8bbdfa',
  purple: '#bfa0ee',
  pink: '#f7a1ce',
  gray: '#c3c7d1',
};
