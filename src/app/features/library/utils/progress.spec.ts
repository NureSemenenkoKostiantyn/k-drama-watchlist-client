import { LibraryEntry } from '../models/library';
import {
  currentProgressRequest,
  decrementEpisode,
  finishCurrentSeason,
  incrementEpisode,
  progressPercentage,
} from './progress';

describe('library progress actions', () => {
  const entry: LibraryEntry = {
    id: 'entry-1',
    mediaId: 'media-1',
    status: 'watching',
    media: {
      id: 'tv:1',
      tmdbId: 1,
      mediaType: 'tv',
      title: 'A drama',
      originalTitle: 'A drama',
      originCountry: ['KR'],
      genreIds: [18],
      totalEpisodes: 6,
      seasons: [
        { seasonNumber: 0, name: 'Specials', episodeCount: 1 },
        { seasonNumber: 1, name: 'Season 1', episodeCount: 2 },
        { seasonNumber: 2, name: 'Season 2', episodeCount: 4 },
      ],
    },
    createdAt: '2026-07-24T10:00:00.000Z',
    updatedAt: '2026-07-24T10:00:00.000Z',
  };

  it('starts untracked titles at episode zero of the first regular season', () => {
    expect(currentProgressRequest(entry)).toEqual({
      currentSeason: 1,
      currentEpisode: 0,
      includeSpecials: false,
    });
    expect(incrementEpisode(entry)).toMatchObject({
      currentSeason: 1,
      currentEpisode: 1,
    });
  });

  it('moves forward and backward across season boundaries', () => {
    const endOfSeason = withProgress(entry, 1, 2);
    expect(incrementEpisode(endOfSeason)).toMatchObject({
      currentSeason: 2,
      currentEpisode: 1,
    });

    const nextSeason = withProgress(entry, 2, 1);
    expect(decrementEpisode(nextSeason)).toMatchObject({
      currentSeason: 1,
      currentEpisode: 2,
    });
  });

  it('finishes the current season and moves to the next season', () => {
    expect(finishCurrentSeason(withProgress(entry, 1, 1))).toMatchObject({
      currentSeason: 2,
      currentEpisode: 1,
    });
    expect(finishCurrentSeason(withProgress(entry, 2, 2))).toMatchObject({
      currentSeason: 2,
      currentEpisode: 4,
    });
  });

  it('calculates a bounded percentage from the server snapshot', () => {
    const tracked = withProgress(entry, 2, 2);
    tracked.progress = {
      ...tracked.progress!,
      completedEpisodes: 4,
      totalEpisodesSnapshot: 6,
    };

    expect(progressPercentage(tracked)).toBe(67);
  });
});

function withProgress(
  entry: LibraryEntry,
  currentSeason: number,
  currentEpisode: number,
): LibraryEntry {
  return {
    ...entry,
    progress: {
      currentSeason,
      currentEpisode,
      completedEpisodes: 0,
      totalEpisodesSnapshot: 6,
      completedSeasonNumbers: [],
      includeSpecials: false,
      updatedAt: '2026-07-24T10:00:00.000Z',
    },
  };
}
