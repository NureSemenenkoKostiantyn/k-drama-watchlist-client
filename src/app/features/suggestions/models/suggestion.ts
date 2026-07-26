import { MediaDetails, MediaType } from '../../search/models/media';
import { PublicUserProfile } from '../../users/models/public-user-profile';

export type SuggestionStatus = 'pending' | 'accepted' | 'dismissed';
export type SuggestionDirection = 'received' | 'sent';

export interface Suggestion {
  id: string;
  status: SuggestionStatus;
  direction: SuggestionDirection;
  user: PublicUserProfile;
  media: MediaDetails;
  message?: string;
  createdAt: string;
  respondedAt?: string;
}

export interface SuggestionsOverview {
  received: Suggestion[];
  sent: Suggestion[];
}

export interface CreateSuggestionRequest {
  username: string;
  mediaType: MediaType;
  tmdbId: number;
  message?: string;
}
