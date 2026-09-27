import { LibraryEntry, WatchStatus } from '../../library/models/library';
import { TierMedia } from '../models/tier-list';

export interface TierLibraryFilters {
  status: WatchStatus | 'all';
  type: 'tv' | 'movie' | 'all';
  genre: number | null;
  query: string;
}

export function filterTierLibrary(
  entries: LibraryEntry[],
  filters: TierLibraryFilters,
): TierMedia[] {
  const query = filters.query.trim().toLocaleLowerCase();
  const matches = entries
    .filter(
      ({ status, media }) =>
        (filters.status === 'all' || status === filters.status) &&
        (filters.type === 'all' || media.mediaType === filters.type) &&
        (filters.genre === null || media.genreIds.includes(filters.genre)) &&
        (!query || `${media.title} ${media.originalTitle}`.toLocaleLowerCase().includes(query)),
    )
    .map(({ media }) => media);
  return [...new Map(matches.map((item) => [item.id, item])).values()];
}
