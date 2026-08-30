import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { readApiErrorMessage } from '../../../core/api/api-error';
import { environment } from '../../../../environments/environment';
import { TelegramConnection, TelegramLink } from '../models/telegram';

@Injectable({ providedIn: 'root' })
export class TelegramService {
  private readonly http = inject(HttpClient);
  private readonly connectionState = signal<TelegramConnection | null>(null);
  private readonly loadingState = signal(false);
  private readonly errorState = signal<string | null>(null);

  readonly connection = this.connectionState.asReadonly();
  readonly isLoading = this.loadingState.asReadonly();
  readonly error = this.errorState.asReadonly();

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
}

