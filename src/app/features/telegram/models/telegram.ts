import type { components } from '../../../core/api/generated/api-contracts';

type ApiSchemas = components['schemas'];

export type TelegramConnection = ApiSchemas['TelegramConnectionResponse'];
export type TelegramLink = ApiSchemas['TelegramLinkResponse'];

