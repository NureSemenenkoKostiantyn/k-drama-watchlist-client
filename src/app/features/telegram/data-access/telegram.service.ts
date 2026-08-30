import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { readApiErrorMessage } from '../../../core/api/api-error';
import { environment } from '../../../../environments/environment';
import type {
  LibraryEntry,
  UpdateProgressRequest,
  WatchStatus,
} from '../../library/models/library';
import type {
  MediaSearchResponse,
  MediaSummary,
  SearchMediaType,
} from '../../search/models/media';
import {
  TelegramConnection,
  TelegramLink,
  TelegramMiniAppSession,
} from '../models/telegram';

@Injectable({ providedIn: 'root' })
export class TelegramService {
  private readonly http = inject(HttpClient);
  private readonly connectionState = signal<TelegramConnection | null>(null);
  private readonly loadingState = signal(false);
  private readonly errorState = signal<string | null>(null);
  private miniAppInitData = '';

  readonly connection = this.connectionState.asReadonly();
  readonly isLoading = this.loadingState.asReadonly();
  readonly error = this.errorState.asReadonly();

  authenticateMiniApp(initData: string): Promise<TelegramMiniAppSession> {
    this.miniAppInitData = initData;
    return firstValueFrom(
      this.http.post<TelegramMiniAppSession>(
        `${environment.apiBaseUrl}/telegram/mini-app/session`,
        {},
        { headers: { 'X-Telegram-Init-Data': initData } },
      ),
    );
  }

  loadMiniAppLibrary(): Promise<LibraryEntry[]> {
    return firstValueFrom(
      this.http.get<LibraryEntry[]>(`${environment.apiBaseUrl}/telegram/mini-app/library`, {
        headers: this.miniAppHeaders(),
      }),
    );
  }

  searchMiniApp(query: string, type: SearchMediaType): Promise<MediaSearchResponse> {
    const params = new HttpParams().set('q', query).set('type', type).set('page', 1);
    return firstValueFrom(
      this.http.get<MediaSearchResponse>(`${environment.apiBaseUrl}/telegram/mini-app/search`, {
        headers: this.miniAppHeaders(),
        params,
      }),
    );
  }

  addFromMiniApp(media: MediaSummary, status: WatchStatus): Promise<LibraryEntry> {
    return firstValueFrom(
      this.http.post<LibraryEntry>(
        `${environment.apiBaseUrl}/telegram/mini-app/library`,
        { mediaType: media.mediaType, tmdbId: media.tmdbId, status },
        { headers: this.miniAppHeaders() },
      ),
    );
  }

  updateMiniAppStatus(entryId: string, status: WatchStatus): Promise<LibraryEntry> {
    return firstValueFrom(
      this.http.patch<LibraryEntry>(
        `${environment.apiBaseUrl}/telegram/mini-app/library/${entryId}/status`,
        { status },
        { headers: this.miniAppHeaders() },
      ),
    );
  }

  updateMiniAppProgress(
    entryId: string,
    progress: UpdateProgressRequest,
  ): Promise<LibraryEntry> {
    return firstValueFrom(
      this.http.patch<LibraryEntry>(
        `${environment.apiBaseUrl}/telegram/mini-app/library/${entryId}/progress`,
        progress,
        { headers: this.miniAppHeaders() },
      ),
    );
  }

  async load(): Promise<TelegramConnection | null> {
    this.loadingState.set(true);
    this.errorState.set(null);

    try {
      const connection = await firstValueFrom(
        this.http.get<TelegramConnection>(`${environment.apiBaseUrl}/telegram/connection`),
      );
      this.connectionState.set(connection);
      return connection;
    } catch (error: unknown) {
      this.errorState.set(
        readApiErrorMessage(error, 'Your Telegram connection could not be loaded.'),
      );
      return null;
    } finally {
      this.loadingState.set(false);
    }
  }

  async createLink(): Promise<TelegramLink | null> {
    this.errorState.set(null);

    try {
      return await firstValueFrom(
        this.http.post<TelegramLink>(`${environment.apiBaseUrl}/telegram/link`, {}),
      );
    } catch (error: unknown) {
      this.errorState.set(
        readApiErrorMessage(error, 'A Telegram connection link could not be created.'),
      );
      return null;
    }
  }

  async disconnect(): Promise<boolean> {
    this.errorState.set(null);

    try {
      await firstValueFrom(
        this.http.delete<void>(`${environment.apiBaseUrl}/telegram/connection`),
      );
      const connection = this.connectionState();
      this.connectionState.set({
        enabled: connection?.enabled ?? true,
        connected: false,
        botUsername: connection?.botUsername,
        miniAppUrl: connection?.miniAppUrl,
      });
      return true;
    } catch (error: unknown) {
      this.errorState.set(
        readApiErrorMessage(error, 'Your Telegram account could not be disconnected.'),
      );
      return false;
    }
  }

  private miniAppHeaders(): Record<string, string> {
    if (!this.miniAppInitData) {
      throw new Error('Telegram Mini App authentication has not been initialized.');
    }

    return { 'X-Telegram-Init-Data': this.miniAppInitData };
  }
}
