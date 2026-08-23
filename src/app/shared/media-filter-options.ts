export interface MediaFilterOption<T> {
  value: T;
  label: string;
}

export const MEDIA_GENRE_OPTIONS: readonly MediaFilterOption<number>[] = [
  { value: 28, label: 'Action' },
  { value: 10759, label: 'Action & Adventure' },
  { value: 12, label: 'Adventure' },
  { value: 16, label: 'Animation' },
  { value: 35, label: 'Comedy' },
  { value: 80, label: 'Crime' },
  { value: 99, label: 'Documentary' },
  { value: 18, label: 'Drama' },
  { value: 10751, label: 'Family' },
  { value: 14, label: 'Fantasy' },
  { value: 36, label: 'History' },
  { value: 27, label: 'Horror' },
  { value: 10762, label: 'Kids' },
  { value: 10402, label: 'Music' },
  { value: 9648, label: 'Mystery' },
  { value: 10764, label: 'Reality' },
  { value: 10749, label: 'Romance' },
  { value: 878, label: 'Science Fiction' },
  { value: 10765, label: 'Sci-Fi & Fantasy' },
  { value: 10766, label: 'Soap' },
  { value: 53, label: 'Thriller' },
  { value: 10770, label: 'TV Movie' },
  { value: 10752, label: 'War' },
  { value: 10768, label: 'War & Politics' },
  { value: 37, label: 'Western' },
];

export const MEDIA_COUNTRY_OPTIONS: readonly MediaFilterOption<string>[] = [
  { value: 'KR', label: 'South Korea' },
  { value: 'JP', label: 'Japan' },
  { value: 'CN', label: 'China' },
  { value: 'TW', label: 'Taiwan' },
  { value: 'TH', label: 'Thailand' },
  { value: 'HK', label: 'Hong Kong' },
  { value: 'PH', label: 'Philippines' },
  { value: 'US', label: 'United States' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'CA', label: 'Canada' },
  { value: 'AU', label: 'Australia' },
  { value: 'FR', label: 'France' },
  { value: 'DE', label: 'Germany' },
  { value: 'ES', label: 'Spain' },
  { value: 'IN', label: 'India' },
];

export const MEDIA_SORT_OPTIONS = [
  { value: 'recent', label: 'Recently updated' },
  { value: 'title_asc', label: 'Title: A to Z' },
  { value: 'title_desc', label: 'Title: Z to A' },
  { value: 'rating_desc', label: 'Highest rated' },
  { value: 'release_desc', label: 'Newest release' },
  { value: 'release_asc', label: 'Oldest release' },
] as const satisfies readonly MediaFilterOption<string>[];

export type MediaSort = (typeof MEDIA_SORT_OPTIONS)[number]['value'];
