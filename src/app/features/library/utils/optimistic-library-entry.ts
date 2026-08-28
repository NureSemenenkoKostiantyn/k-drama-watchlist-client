import {
  LibraryEntry,
  LibraryProgress,
  PlaybackPreference,
  UpdatePlaybackPreferenceRequest,
  UpdateProgressRequest,
  WatchStatus,
} from '../models/library';

export function withOptimisticStatus(
  entry: LibraryEntry,
  status: WatchStatus,
): LibraryEntry {
  return withoutInvalidPriority({ ...entry, status });
}

export function withOptimisticProgress(
  entry: LibraryEntry,
  input: UpdateProgressRequest,
): LibraryEntry {
  const includeSpecials =
    input.includeSpecials ?? entry.progress?.includeSpecials ?? false;
  const progress = calculateOptimisticProgress(entry, input, includeSpecials);
  const status: WatchStatus =
    progress.totalEpisodesSnapshot !== undefined &&
    progress.totalEpisodesSnapshot > 0 &&
    progress.completedEpisodes >= progress.totalEpisodesSnapshot
      ? 'watched'
      : progress.completedEpisodes > 0
        ? 'watching'
        : 'to_watch';

  return withoutInvalidPriority({
    ...entry,
    status,
    progress,
    lastProgressAt: progress.updatedAt,
  });
}

export function withOptimisticRating(
  entry: LibraryEntry,
  rating: number | null,
): LibraryEntry {
  return withOptionalProperty(entry, 'rating', rating);
}

export function withOptimisticDescription(
  entry: LibraryEntry,
  description: string | null,
): LibraryEntry {
  return withOptionalProperty(entry, 'description', description);
}

export function withOptimisticCategories(
  entry: LibraryEntry,
  categoryIds: string[],
): LibraryEntry {
  return { ...entry, categoryIds: [...categoryIds] };
}

export function withOptimisticPlaybackPreference(
  entry: LibraryEntry,
  input: UpdatePlaybackPreferenceRequest,
): LibraryEntry {
  return withOptionalProperty(
    entry,
    'playbackPreference',
    normalizePlaybackPreference(input),
  );
}

function calculateOptimisticProgress(
  entry: LibraryEntry,
  input: UpdateProgressRequest,
  includeSpecials: boolean,
): LibraryProgress {
  const updatedAt = new Date().toISOString();
  const seasons = [...(entry.media.seasons ?? [])]
    .filter((season) => includeSpecials || season.seasonNumber !== 0)
    .sort((left, right) => left.seasonNumber - right.seasonNumber);
  const currentSeasonIndex = seasons.findIndex(
    (season) => season.seasonNumber === input.currentSeason,
  );

  if (currentSeasonIndex === -1) {
    return {
      currentSeason: input.currentSeason,
      currentEpisode: input.currentEpisode,
      completedEpisodes: input.currentEpisode,
      completedSeasonNumbers: [],
      includeSpecials,
      updatedAt,
      ...(entry.media.totalEpisodes === undefined
        ? {}
        : { totalEpisodesSnapshot: entry.media.totalEpisodes }),
    };
  }

  const currentSeason = seasons[currentSeasonIndex];
  const completedBeforeCurrent = seasons
    .slice(0, currentSeasonIndex)
    .reduce((total, season) => total + season.episodeCount, 0);
  const completedSeasonNumbers = seasons
    .slice(0, currentSeasonIndex)
    .filter((season) => season.episodeCount > 0)
    .map((season) => season.seasonNumber);

  if (
    currentSeason &&
    currentSeason.episodeCount > 0 &&
    input.currentEpisode === currentSeason.episodeCount
  ) {
    completedSeasonNumbers.push(currentSeason.seasonNumber);
  }

  const totalEpisodesSnapshot = seasons.reduce(
    (total, season) => total + season.episodeCount,
    0,
  );
  return {
    currentSeason: input.currentSeason,
    currentEpisode: input.currentEpisode,
    completedEpisodes: completedBeforeCurrent + input.currentEpisode,
    completedSeasonNumbers,
    includeSpecials,
    updatedAt,
    ...(totalEpisodesSnapshot > 0 ? { totalEpisodesSnapshot } : {}),
  };
}

function normalizePlaybackPreference(
  input: UpdatePlaybackPreferenceRequest,
): PlaybackPreference | null {
  const audio = input.audio ?? undefined;
  const subtitleLanguageCode = input.subtitleLanguageCode ?? undefined;

  if (!audio && !subtitleLanguageCode) {
    return null;
  }

  return {
    ...(audio ? { audio } : {}),
    ...(subtitleLanguageCode ? { subtitleLanguageCode } : {}),
  };
}

function withoutInvalidPriority(entry: LibraryEntry): LibraryEntry {
  if (entry.status === 'to_watch') {
    return entry;
  }

  const updated = { ...entry };
  delete updated.priorityLaneId;
  delete updated.priorityPosition;
  return updated;
}

function withOptionalProperty<
  Key extends 'rating' | 'description' | 'playbackPreference',
>(
  entry: LibraryEntry,
  key: Key,
  value: LibraryEntry[Key] | null,
): LibraryEntry {
  const updated = { ...entry };

  if (value === null || value === undefined) {
    delete updated[key];
  } else {
    updated[key] = value;
  }

  return updated;
}
