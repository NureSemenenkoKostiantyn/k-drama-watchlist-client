import { MediaType } from '../../search/models/media';
import { MEDIA_SORT_OPTIONS, MediaSort } from '../../../shared/media-filter-options';
import { LibraryEntry, WatchStatus } from '../models/library';

export interface LibraryAdvancedFilters {
  query: string;
  mediaType: MediaType | '';
  minRating: number | null;
  genreId: number | null;
  country: string;
  yearFrom: number | null;
  yearTo: number | null;
  sort: MediaSort;
}

export const DEFAULT_LIBRARY_FILTERS: LibraryAdvancedFilters = {
  query: '',
  mediaType: '',
  minRating: null,
  genreId: null,
  country: '',
  yearFrom: null,
  yearTo: null,
  sort: MEDIA_SORT_OPTIONS[0].value,
};

export function filterLibraryEntries(
  entries: LibraryEntry[],
  status: WatchStatus,
  filters: LibraryAdvancedFilters,
): LibraryEntry[] {
  const query = filters.query.trim().toLocaleLowerCase();
  return entries
    .filter((entry) => entry.status === status)
    .filter(
      (entry) =>
        !query ||
        entry.media.title.toLocaleLowerCase().includes(query) ||
        entry.media.originalTitle.toLocaleLowerCase().includes(query),
    )
    .filter((entry) => !filters.mediaType || entry.media.mediaType === filters.mediaType)
    .filter(
      (entry) =>
        filters.minRating === null ||
        (entry.rating !== undefined && entry.rating >= filters.minRating),
    )
    .filter((entry) => filters.genreId === null || entry.media.genreIds.includes(filters.genreId))
    .filter((entry) => !filters.country || entry.media.originCountry.includes(filters.country))
    .filter((entry) => {
      const year = releaseYear(entry);
      return (
        (filters.yearFrom === null || (year !== null && year >= filters.yearFrom)) &&
        (filters.yearTo === null || (year !== null && year <= filters.yearTo))
      );
    })
    .sort(comparator(filters.sort));
}

export function hasActiveLibraryFilters(filters: LibraryAdvancedFilters): boolean {
  return (
    filters.query.trim().length > 0 ||
    filters.mediaType !== '' ||
    filters.minRating !== null ||
    filters.genreId !== null ||
    filters.country !== '' ||
    filters.yearFrom !== null ||
    filters.yearTo !== null ||
    filters.sort !== 'recent'
  );
}

function comparator(sort: MediaSort): (left: LibraryEntry, right: LibraryEntry) => number {
  return (left, right) => {
    if (sort === 'title_asc' || sort === 'title_desc') {
      const compared = titleCompare(left, right);
      return sort === 'title_asc' ? compared : -compared;
    }

    if (sort === 'rating_desc') {
      const compared = compareOptionalNumbers(left.rating, right.rating, 'desc');
      return compared || titleCompare(left, right);
    }

    if (sort === 'release_desc' || sort === 'release_asc') {
      const leftYear = releaseYear(left);
      const rightYear = releaseYear(right);
      const compared =
        sort === 'release_desc'
          ? compareOptionalNumbers(leftYear, rightYear, 'desc')
          : compareOptionalNumbers(leftYear, rightYear, 'asc');
      return compared || titleCompare(left, right);
    }

    return Date.parse(right.updatedAt) - Date.parse(left.updatedAt);
  };
}

function compareOptionalNumbers(
  left: number | undefined | null,
  right: number | undefined | null,
  direction: 'asc' | 'desc',
): number {
  if (left == null && right == null) return 0;
  if (left == null) return 1;
  if (right == null) return -1;
  return direction === 'asc' ? left - right : right - left;
}

function titleCompare(left: LibraryEntry, right: LibraryEntry): number {
  return left.media.title.localeCompare(right.media.title, undefined, {
    sensitivity: 'base',
  });
}

function releaseYear(entry: LibraryEntry): number | null {
  const value = entry.media.firstAirDate ?? entry.media.releaseDate;
  const year = value ? Number(value.slice(0, 4)) : Number.NaN;
  return Number.isInteger(year) ? year : null;
}
