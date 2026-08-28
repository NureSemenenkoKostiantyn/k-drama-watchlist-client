import { LibraryEntry } from '../models/library';
import {
  withOptimisticPlaybackPreference,
  withOptimisticProgress,
  withOptimisticRating,
  withOptimisticStatus,
} from './optimistic-library-entry';

describe('optimistic library entry projections', () => {
  const entry: LibraryEntry = {
    id: 'entry-1',
    mediaId: 'media-1',
    status: 'to_watch',
    categoryIds: [],
    priorityLaneId: 'lane-1',
    priorityPosition: 0,
    media: {
      id: 'tv:1',
      tmdbId: 1,
      mediaType: 'tv',
      title: 'Drama',
      originalTitle: '드라마',
      originCountry: ['KR'],
      genreIds: [18],
      seasons: [
        { seasonNumber: 0, name: 'Specials', episodeCount: 2 },
        { seasonNumber: 1, name: 'Season 1', episodeCount: 3 },
        { seasonNumber: 2, name: 'Season 2', episodeCount: 2 },
      ],
    },
    createdAt: '2026-08-01T12:00:00.000Z',
    updatedAt: '2026-08-01T12:00:00.000Z',
  };

  it('mirrors progress totals and derived lifecycle status', () => {
    const watching = withOptimisticProgress(entry, {
      currentSeason: 2,
      currentEpisode: 1,
      includeSpecials: false,
    });

    expect(watching).toMatchObject({
      status: 'watching',
      progress: {
        completedEpisodes: 4,
        totalEpisodesSnapshot: 5,
        completedSeasonNumbers: [1],
      },
    });
    expect(watching.priorityLaneId).toBeUndefined();

    expect(
      withOptimisticProgress(entry, {
        currentSeason: 2,
        currentEpisode: 2,
        includeSpecials: false,
      }).status,
    ).toBe('watched');
  });

  it('clears priority metadata when leaving to-watch', () => {
    const updated = withOptimisticStatus(entry, 'watching');

    expect(updated.status).toBe('watching');
    expect(updated.priorityLaneId).toBeUndefined();
    expect(updated.priorityPosition).toBeUndefined();
  });

  it('removes optional values when the request clears them', () => {
    const tracked = {
      ...entry,
      rating: 8,
      playbackPreference: { subtitleLanguageCode: 'en' },
    };

    expect(withOptimisticRating(tracked, null).rating).toBeUndefined();
    expect(
      withOptimisticPlaybackPreference(tracked, {
        audio: null,
        subtitleLanguageCode: null,
      }).playbackPreference,
    ).toBeUndefined();
  });
});
