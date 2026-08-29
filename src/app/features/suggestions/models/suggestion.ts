import type { components } from '../../../core/api/generated/api-contracts';

type ApiSchemas = components['schemas'];

export type SuggestionStatus = ApiSchemas['SuggestionStatus'];
export type SuggestionDirection = ApiSchemas['SuggestionDirection'];
export type Suggestion = ApiSchemas['SuggestionResponse'];
export type SuggestionsOverview = ApiSchemas['SuggestionsResponse'];
export type CreateSuggestionRequest = ApiSchemas['CreateSuggestionDto'];
