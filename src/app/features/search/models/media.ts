export type MediaType = 'movie' | 'tv';
export type SearchMediaType = 'all' | MediaType;

export interface MediaSummary {
  id: string;
  tmdbId: number;
  mediaType: MediaType;
  title: string;
  originalTitle: string;
  overview?: string;
  posterPath?: string;
  posterUrl?: string;
  backdropPath?: string;
  backdropUrl?: string;
  releaseDate?: string;
  firstAirDate?: string;
  originCountry: string[];
  originalLanguage?: string;
  genreIds: number[];
  tmdbVoteAverage?: number;
  tmdbVoteCount?: number;
}

export interface MediaSeason {
  tmdbSeasonId?: number;
  seasonNumber: number;
  name: string;
  episodeCount: number;
  airDate?: string;
  posterPath?: string;
}

export interface MediaDetails extends MediaSummary {
  runtimeMinutes?: number;
  totalEpisodes?: number;
  totalSeasons?: number;
  seasons?: MediaSeason[];
}

export interface MediaSearchResponse {
  page: number;
  totalPages: number;
  totalResults: number;
  results: MediaSummary[];
}

export interface MediaSearchRequest {
  query: string;
  type: SearchMediaType;
  page: number;
  country?: string;
}
