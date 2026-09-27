import { LibraryEntry } from '../../library/models/library';
import { filterTierLibrary, TierLibraryFilters } from './tier-library';

export function libraryEntry(
  id: number,
  status = 'watched',
  type = 'tv',
  genreIds = [18],
): LibraryEntry {
  return {
    id: String(id),
    status,
    media: {
      id: `${type}:${id}`,
      mediaType: type,
      tmdbId: id,
      title: `Title ${id}`,
      originalTitle: `Original ${id}`,
      genreIds,
    },
  } as LibraryEntry;
}

describe('filterTierLibrary', () => {
  const entries = [
    libraryEntry(1),
    libraryEntry(2, 'watching'),
    libraryEntry(3, 'watched', 'movie', [35]),
    libraryEntry(1),
  ];
  const all: TierLibraryFilters = { status: 'all', type: 'all', genre: null, query: '' };
  it('uses canonical identities and includes all statuses without duplicates', () => {
    expect(filterTierLibrary(entries, all).map((item) => item.id)).toEqual([
      'tv:1',
      'tv:2',
      'movie:3',
    ]);
  });
  it('combines status, genre, media type and original-title filters', () => {
    expect(
      filterTierLibrary(entries, { ...all, status: 'watched', genre: 18 }).map((item) => item.id),
    ).toEqual(['tv:1']);
    expect(
      filterTierLibrary(entries, { ...all, type: 'movie', genre: 35, query: ' ORIGINAL 3 ' }).map(
        (item) => item.id,
      ),
    ).toEqual(['movie:3']);
    expect(filterTierLibrary(entries, { ...all, status: 'watching', genre: 35 })).toEqual([]);
  });
});
