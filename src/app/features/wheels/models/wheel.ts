import type { components } from '../../../core/api/generated/api-contracts';

type ApiSchemas = components['schemas'];

export type WheelVisibility = ApiSchemas['WheelVisibility'];
export type WheelRole = ApiSchemas['WheelRole'];
export type WheelSelectionMode = ApiSchemas['WheelSelectionMode'];
export type Wheel = ApiSchemas['WheelResponse'];
export type WheelItem = ApiSchemas['WheelItemResponse'];
export type WheelMember = ApiSchemas['WheelMemberResponse'];
export type WheelDetails = ApiSchemas['WheelDetailsResponse'];
export type SelectedWheelItem = ApiSchemas['SelectedWheelItemResponse'];
export type WheelSpin = ApiSchemas['WheelSpinResponse'];
export type WheelSpinHistory = ApiSchemas['WheelSpinHistoryResponse'];
export type CreateWheelRequest = ApiSchemas['CreateWheelDto'];
export type UpdateWheelRequest = ApiSchemas['UpdateWheelDto'];
export type PublicWheelItem = ApiSchemas['PublicWheelItemResponse'];
export type PublicWheelSpin = ApiSchemas['PublicWheelSpinResponse'];
export type PublicWheelDetails = ApiSchemas['PublicWheelDetailsResponse'];
export type UpdateWheelItemRequest = ApiSchemas['UpdateWheelItemDto'];
export type AddWheelMemberRequest = ApiSchemas['AddWheelMemberDto'];
