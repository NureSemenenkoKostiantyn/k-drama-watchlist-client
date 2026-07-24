import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { readApiErrorMessage } from '../../../core/api/api-error';
import { environment } from '../../../../environments/environment';
import { MediaType } from '../../search/models/media';
import { AddLibraryEntryRequest, LibraryEntry, WatchStatus } from '../models/library';

@Injectable({ providedIn: 'root' })
export class LibraryService {
  private readonly http = inject(HttpClient);
  private readonly entriesState = signal<LibraryEntry[]>([]);
  private readonly loadingState = signal(false);
  private readonly errorState = signal<string | null>(null);

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

      this.upsertEntry(entry);
      return entry;
    } catch (error: unknown) {
      this.errorState.set(
        readApiErrorMessage(error, 'The library could not be updated. Please try again.'),
      );
      return null;
    }
  }

  async remove(entryId: string): Promise<boolean> {
    this.errorState.set(null);

    try {
      await firstValueFrom(
        this.http.delete<void>(`${environment.apiBaseUrl}/library/${entryId}`),
      );
      this.entriesState.update((entries) => entries.filter((entry) => entry.id !== entryId));
      return true;
    } catch (error: unknown) {
      this.errorState.set(
        readApiErrorMessage(error, 'The title could not be removed. Please try again.'),
      );
      return false;
    }
  }

  clearError(): void {
    this.errorState.set(null);
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
