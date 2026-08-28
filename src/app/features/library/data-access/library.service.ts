import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { readApiErrorMessage } from '../../../core/api/api-error';
import { environment } from '../../../../environments/environment';
import { MediaType } from '../../search/models/media';
import {
  AddLibraryEntryRequest,
  LibraryEntry,
  UpdatePlaybackPreferenceRequest,
  UpdateProgressRequest,
  WatchStatus,
} from '../models/library';
import {
  withOptimisticCategories,
  withOptimisticDescription,
  withOptimisticPlaybackPreference,
  withOptimisticProgress,
  withOptimisticRating,
  withOptimisticStatus,
} from '../utils/optimistic-library-entry';

interface OptimisticSnapshot {
  readonly entry: LibraryEntry;
  readonly index: number;
  readonly version: symbol;
}

@Injectable({ providedIn: 'root' })
export class LibraryService {
  private readonly http = inject(HttpClient);
  private readonly entriesState = signal<LibraryEntry[]>([]);
  private readonly loadingState = signal(false);
  private readonly errorState = signal<string | null>(null);
  private readonly mutationVersions = new Map<string, symbol>();

  readonly entries = this.entriesState.asReadonly();
  readonly isLoading = this.loadingState.asReadonly();
  readonly error = this.errorState.asReadonly();

  async load(): Promise<boolean> {
    this.loadingState.set(true);
    this.errorState.set(null);

    try {
      const entries = await firstValueFrom(
        this.http.get<LibraryEntry[]>(`${environment.apiBaseUrl}/library`),
      );
      this.entriesState.set(entries);
      return true;
    } catch (error: unknown) {
      this.errorState.set(
        readApiErrorMessage(error, 'Your library is unavailable right now. Please try again.'),
      );
      return false;
    } finally {
      this.loadingState.set(false);
    }
  }

  entryFor(mediaType: MediaType, tmdbId: number): LibraryEntry | undefined {
    return this.entriesState().find(
      (entry) => entry.media.mediaType === mediaType && entry.media.tmdbId === tmdbId,
    );
  }

  async setStatus(
    mediaType: MediaType,
    tmdbId: number,
    status: WatchStatus,
  ): Promise<LibraryEntry | null> {
    this.errorState.set(null);
    const existing = this.entryFor(mediaType, tmdbId);
    const snapshot = existing
      ? this.beginOptimisticMutation(existing.id, (entry) =>
          withOptimisticStatus(entry, status),
        )
      : null;

    try {
      const entry = existing
        ? await firstValueFrom(
            this.http.patch<LibraryEntry>(
              `${environment.apiBaseUrl}/library/${existing.id}/status`,
              { status },
            ),
          )
        : await firstValueFrom(
            this.http.post<LibraryEntry>(
              `${environment.apiBaseUrl}/library`,
              {
                mediaType,
                tmdbId,
                status,
              } satisfies AddLibraryEntryRequest,
            ),
          );

      this.commitOptimisticMutation(snapshot, entry);
      return entry;
    } catch (error: unknown) {
      if (!this.rollbackOptimisticMutation(snapshot)) {
        return null;
      }
      this.errorState.set(
        readApiErrorMessage(error, 'The library could not be updated. Please try again.'),
      );
      return null;
    }
  }

  async remove(entryId: string): Promise<boolean> {
    this.errorState.set(null);
    const snapshot = this.beginOptimisticMutation(entryId, () => null);

    try {
      await firstValueFrom(
        this.http.delete<void>(`${environment.apiBaseUrl}/library/${entryId}`),
      );
      this.commitOptimisticMutation(snapshot);
      return true;
    } catch (error: unknown) {
      if (!this.rollbackOptimisticMutation(snapshot)) {
        return false;
      }
      this.errorState.set(
        readApiErrorMessage(error, 'The title could not be removed. Please try again.'),
      );
      return false;
    }
  }

  updateProgress(
    entryId: string,
    progress: UpdateProgressRequest,
  ): Promise<LibraryEntry | null> {
    return this.updateEntry(
      entryId,
      'progress',
      progress,
      'Your progress could not be updated. Please try again.',
      (entry) => withOptimisticProgress(entry, progress),
    );
  }

  updateRating(entryId: string, rating: number | null): Promise<LibraryEntry | null> {
    return this.updateEntry(
      entryId,
      'rating',
      { rating },
      'Your rating could not be updated. Please try again.',
      (entry) => withOptimisticRating(entry, rating),
    );
  }

  updateDescription(
    entryId: string,
    description: string | null,
  ): Promise<LibraryEntry | null> {
    return this.updateEntry(
      entryId,
      null,
      { description },
      'Your description could not be updated. Please try again.',
      (entry) => withOptimisticDescription(entry, description),
    );
  }

  updateCategories(
    entryId: string,
    categoryIds: string[],
  ): Promise<LibraryEntry | null> {
    return this.updateEntry(
      entryId,
      null,
      { categoryIds },
      'The categories could not be assigned. Please try again.',
      (entry) => withOptimisticCategories(entry, categoryIds),
    );
  }

  removeCategoryReference(categoryId: string): void {
    this.entriesState.update((entries) =>
      entries.map((entry) =>
        entry.categoryIds.includes(categoryId)
          ? {
              ...entry,
              categoryIds: entry.categoryIds.filter(
                (candidate) => candidate !== categoryId,
              ),
            }
          : entry,
      ),
    );
  }

  applyPriorityOrder(laneId: string, itemIds: string[]): void {
    const positionById = new Map(
      itemIds.map((itemId, position) => [itemId, position]),
    );
    this.entriesState.update((entries) =>
      entries.map((entry) => {
        const position = positionById.get(entry.id);

        if (position !== undefined) {
          return {
            ...entry,
            priorityLaneId: laneId,
            priorityPosition: position,
          };
        }

        if (entry.priorityLaneId === laneId) {
          const withoutPriority = { ...entry };
          delete withoutPriority.priorityLaneId;
          delete withoutPriority.priorityPosition;
          return withoutPriority;
        }

        return entry;
      }),
    );
  }

  clearPriorityLane(laneId: string): void {
    this.applyPriorityOrder(laneId, []);
  }

  updatePlaybackPreference(
    entryId: string,
    preference: UpdatePlaybackPreferenceRequest,
  ): Promise<LibraryEntry | null> {
    return this.updateEntry(
      entryId,
      'playback-preference',
      preference,
      'Your playback preference could not be updated. Please try again.',
      (entry) => withOptimisticPlaybackPreference(entry, preference),
    );
  }

  clearError(): void {
    this.errorState.set(null);
  }

  private async updateEntry(
    entryId: string,
    endpoint: string | null,
    body: unknown,
    fallbackMessage: string,
    optimisticUpdate: (entry: LibraryEntry) => LibraryEntry,
  ): Promise<LibraryEntry | null> {
    this.errorState.set(null);
    const suffix = endpoint === null ? '' : `/${endpoint}`;
    const snapshot = this.beginOptimisticMutation(entryId, optimisticUpdate);

    try {
      const entry = await firstValueFrom(
        this.http.patch<LibraryEntry>(
          `${environment.apiBaseUrl}/library/${entryId}${suffix}`,
          body,
        ),
      );
      this.commitOptimisticMutation(snapshot, entry);
      return entry;
    } catch (error: unknown) {
      if (!this.rollbackOptimisticMutation(snapshot)) {
        return null;
      }
      this.errorState.set(readApiErrorMessage(error, fallbackMessage));
      return null;
    }
  }

  private beginOptimisticMutation(
    entryId: string,
    update: (entry: LibraryEntry) => LibraryEntry | null,
  ): OptimisticSnapshot | null {
    const entries = this.entriesState();
    const index = entries.findIndex((entry) => entry.id === entryId);
    const entry = entries[index];

    if (!entry) {
      return null;
    }

    const snapshot = {
      entry,
      index,
      version: Symbol(entryId),
    } satisfies OptimisticSnapshot;
    this.mutationVersions.set(entryId, snapshot.version);
    const optimisticEntry = update(entry);
    this.entriesState.update((currentEntries) =>
      optimisticEntry === null
        ? currentEntries.filter((candidate) => candidate.id !== entryId)
        : currentEntries.map((candidate) =>
            candidate.id === entryId
              ? withUpdatedTimestamp(optimisticEntry)
              : candidate,
          ),
    );
    return snapshot;
  }

  private commitOptimisticMutation(
    snapshot: OptimisticSnapshot | null,
    serverEntry?: LibraryEntry,
  ): void {
    if (snapshot === null) {
      if (serverEntry) {
        this.upsertEntry(serverEntry);
      }
      return;
    }

    if (this.mutationVersions.get(snapshot.entry.id) !== snapshot.version) {
      return;
    }

    this.mutationVersions.delete(snapshot.entry.id);
    if (serverEntry) {
      this.upsertEntry(serverEntry);
    }
  }

  private rollbackOptimisticMutation(
    snapshot: OptimisticSnapshot | null,
  ): boolean {
    if (snapshot === null) {
      return true;
    }

    if (this.mutationVersions.get(snapshot.entry.id) !== snapshot.version) {
      return false;
    }

    this.mutationVersions.delete(snapshot.entry.id);
    this.entriesState.update((entries) => {
      const existingIndex = entries.findIndex(
        (entry) => entry.id === snapshot.entry.id,
      );

      if (existingIndex !== -1) {
        return entries.map((entry) =>
          entry.id === snapshot.entry.id ? snapshot.entry : entry,
        );
      }

      const restored = [...entries];
      restored.splice(Math.min(snapshot.index, restored.length), 0, snapshot.entry);
      return restored;
    });
    return true;
  }

  private upsertEntry(entry: LibraryEntry): void {
    this.entriesState.update((entries) => {
      const existingIndex = entries.findIndex((candidate) => candidate.id === entry.id);

      if (existingIndex === -1) {
        return [entry, ...entries];
      }

      return entries.map((candidate) => (candidate.id === entry.id ? entry : candidate));
    });
  }
}

function withUpdatedTimestamp(entry: LibraryEntry): LibraryEntry {
  return { ...entry, updatedAt: new Date().toISOString() };
}
