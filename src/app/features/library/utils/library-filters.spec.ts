import { LibraryEntry } from '../models/library';
import {
  DEFAULT_LIBRARY_FILTERS,
  filterLibraryEntries,
  hasActiveLibraryFilters,
} from './library-filters';

describe('library filters', () => {
  it('combines title, type, rating, genre, country, and inclusive years', () => {
    expect(
      filterLibraryEntries(entries, 'watched', {
        ...DEFAULT_LIBRARY_FILTERS,
        query: '기생충',
        mediaType: 'movie',
        minRating: 8.5,
        genreId: 18,
        country: 'KR',
        yearFrom: 2019,
        yearTo: 2019,
      }).map((entry) => entry.media.title),
    ).toEqual(['Parasite']);
  });

  it('sorts missing ratings and release years after known values', () => {
    expect(
      filterLibraryEntries(entries, 'watched', {
        ...DEFAULT_LIBRARY_FILTERS,
        sort: 'rating_desc',
      }).map((entry) => entry.media.title),
    ).toEqual(['Parasite', 'Decision to Leave', 'Unknown Release']);

    expect(
      filterLibraryEntries(entries, 'watched', {
        ...DEFAULT_LIBRARY_FILTERS,
        sort: 'release_asc',
      }).map((entry) => entry.media.title),
    ).toEqual(['Parasite', 'Decision to Leave', 'Unknown Release']);
  });

  it('detects whether advanced filters differ from their defaults', () => {
    expect(hasActiveLibraryFilters(DEFAULT_LIBRARY_FILTERS)).toBe(false);
    expect(
      hasActiveLibraryFilters({
        ...DEFAULT_LIBRARY_FILTERS,
        country: 'KR',
      }),
    ).toBe(true);
  });

  it('filters by suggestion source and shared-list membership', () => {
    expect(
      filterLibraryEntries(entries, 'watched', {
        ...DEFAULT_LIBRARY_FILTERS,
        suggestedByUserId: 'friend-1',
        sharedListId: 'list-1',
      }).map((entry) => entry.media.title),
    ).toEqual(['Parasite']);
  });
});

const entries: LibraryEntry[] = [
  {
    id: 'parasite',
    mediaId: 'media-1',
    status: 'watched',
    rating: 9,
    categoryIds: [],
    suggestedBy: {
      id: 'friend-1',
      username: 'jiwoo',
      displayUsername: 'Jiwoo',
      name: 'Jiwoo Kim',
      joinedAt: '2026-07-01T00:00:00.000Z',
    },
    sharedLists: [{ id: 'list-1', title: 'Weekend picks' }],
    media: {
      id: 'movie:496243',
      tmdbId: 496243,
      mediaType: 'movie',
      title: 'Parasite',
      originalTitle: '기생충',
      releaseDate: '2019-05-30',
      originCountry: ['KR'],
      genreIds: [18, 53],
    },
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-03T00:00:00.000Z',
  },
  {
    id: 'decision',
    mediaId: 'media-2',
    status: 'watched',
    rating: 8.5,
    categoryIds: [],
    media: {
      id: 'movie:705996',
      tmdbId: 705996,
      mediaType: 'movie',
      title: 'Decision to Leave',
      originalTitle: '헤어질 결심',
      releaseDate: '2022-06-29',
      originCountry: ['KR'],
      genreIds: [18, 9648],
    },
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-02T00:00:00.000Z',
  },
  {
    id: 'unknown',
    mediaId: 'media-3',
    status: 'watched',
    categoryIds: [],
    media: {
      id: 'tv:3',
      tmdbId: 3,
      mediaType: 'tv',
      title: 'Unknown Release',
      originalTitle: 'Unknown Release',
      originCountry: [],
      genreIds: [],
    },
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
  },
];
