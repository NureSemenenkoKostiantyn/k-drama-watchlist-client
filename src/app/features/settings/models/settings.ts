import type { components } from '../../../core/api/generated/api-contracts';

type ApiSchemas = components['schemas'];

export type LibraryVisibility = ApiSchemas['LibraryVisibility'];
export type ActivityVisibility = ApiSchemas['ActivityVisibility'];
export type TierBoardMode = ApiSchemas['TierBoardMode'];
export type UserSettings = ApiSchemas['UserSettingsResponse'];
export type UpdateUserSettings = ApiSchemas['UpdateSettingsDto'];
