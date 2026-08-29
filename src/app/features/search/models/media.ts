import type { components } from '../../../core/api/generated/api-contracts';

type ApiSchemas = components['schemas'];

export type MediaType = ApiSchemas['MediaType'];
export type SearchMediaType = 'all' | MediaType;
export type MediaReleaseStatus = ApiSchemas['MediaReleaseStatus'];
export type MediaSummary = ApiSchemas['MediaSummary'];
export type MediaSeason = ApiSchemas['MediaSeason'];
export type MediaDetails = ApiSchemas['MediaDetails'];
export type MediaSearchResponse = ApiSchemas['MediaSearchResponse'];

/** UI-level search input; the data-access service maps it to API query parameters. */
export interface MediaSearchRequest {
  query: string;
  type: SearchMediaType;
  page: number;
  country?: string;
}
