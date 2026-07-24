import { LibraryEntry, UpdateProgressRequest } from '../models/library';
import { MediaSeason } from '../../search/models/media';

export function currentProgressRequest(entry: LibraryEntry): UpdateProgressRequest {
  if (entry.progress) {
    return {
      currentSeason: entry.progress.currentSeason,
      currentEpisode: entry.progress.currentEpisode,
      includeSpecials: entry.progress.includeSpecials,
    };
  }

  return {
    currentSeason: includedSeasons(entry, false)[0]?.seasonNumber ?? 1,
    currentEpisode: 0,
    includeSpecials: false,
  };
}

export function incrementEpisode(entry: LibraryEntry): UpdateProgressRequest {
  const current = currentProgressRequest(entry);
  const seasons = includedSeasons(entry, current.includeSpecials ?? false);
  const seasonIndex = findSeasonIndex(seasons, current.currentSeason);
  const season = seasons[seasonIndex];

  if (!season) {
    return current;
  }

  if (current.currentEpisode < season.episodeCount) {
    return { ...current, currentEpisode: current.currentEpisode + 1 };
  }

  const nextSeason = seasons[seasonIndex + 1];
  return nextSeason
    ? { ...current, currentSeason: nextSeason.seasonNumber, currentEpisode: 1 }
    : current;
}

export function decrementEpisode(entry: LibraryEntry): UpdateProgressRequest {
  const current = currentProgressRequest(entry);
  const seasons = includedSeasons(entry, current.includeSpecials ?? false);
  const seasonIndex = findSeasonIndex(seasons, current.currentSeason);
  const previousSeason = seasons[seasonIndex - 1];

  if (current.currentEpisode > 1) {
    return { ...current, currentEpisode: current.currentEpisode - 1 };
  }

  if (current.currentEpisode === 1 && previousSeason) {
    return {
      ...current,
      currentSeason: previousSeason.seasonNumber,
      currentEpisode: previousSeason.episodeCount,
    };
  }

  return { ...current, currentEpisode: 0 };
}

export function finishCurrentSeason(entry: LibraryEntry): UpdateProgressRequest {
  const current = currentProgressRequest(entry);
  const seasons = includedSeasons(entry, current.includeSpecials ?? false);
  const seasonIndex = findSeasonIndex(seasons, current.currentSeason);
  const season = seasons[seasonIndex];
  const nextSeason = seasons[seasonIndex + 1];

  if (!season) {
    return current;
  }

  return nextSeason
    ? { ...current, currentSeason: nextSeason.seasonNumber, currentEpisode: 1 }
    : { ...current, currentEpisode: season.episodeCount };
}

export function progressPercentage(entry: LibraryEntry): number {
  const completed = entry.progress?.completedEpisodes ?? 0;
  const total = entry.progress?.totalEpisodesSnapshot ?? entry.media.totalEpisodes ?? 0;
  return total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 0;
}

function includedSeasons(entry: LibraryEntry, includeSpecials: boolean): MediaSeason[] {
  return [...(entry.media.seasons ?? [])]
    .filter((season) => includeSpecials || season.seasonNumber !== 0)
    .filter((season) => season.episodeCount > 0)
    .sort((left, right) => left.seasonNumber - right.seasonNumber);
}

function findSeasonIndex(seasons: MediaSeason[], seasonNumber: number): number {
  const index = seasons.findIndex((season) => season.seasonNumber === seasonNumber);
  return index === -1 ? 0 : index;
}
