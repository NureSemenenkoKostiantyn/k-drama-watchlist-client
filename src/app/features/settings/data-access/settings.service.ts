import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { readApiErrorMessage } from '../../../core/api/api-error';
import { environment } from '../../../../environments/environment';
import {
  ActivityVisibility,
  LibraryVisibility,
  UpdateUserSettings,
  UserSettings,
} from '../models/settings';

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly http = inject(HttpClient);
  private readonly settingsState = signal<UserSettings | null>(null);
  private readonly loadingState = signal(false);
  private readonly errorState = signal<string | null>(null);
  private inFlightLoad: Promise<UserSettings | null> | null = null;
  private stateVersion = 0;

  readonly settings = this.settingsState.asReadonly();
  readonly libraryVisibility = computed(() => this.settingsState()?.libraryVisibility ?? 'private');
  readonly activityVisibility = computed(
    () => this.settingsState()?.activityVisibility ?? 'private',
  );
  readonly isLoading = this.loadingState.asReadonly();
  readonly error = this.errorState.asReadonly();

  load(force = false): Promise<UserSettings | null> {
    if (!force && this.settingsState()) {
      return Promise.resolve(this.settingsState());
    }

    if (this.inFlightLoad) {
      return this.inFlightLoad;
    }

    this.loadingState.set(true);
    this.errorState.set(null);
    const loadVersion = this.stateVersion;
    const request = firstValueFrom(
      this.http.get<UserSettings>(`${environment.apiBaseUrl}/settings`),
    )
      .then((settings) => {
        if (this.stateVersion === loadVersion) {
          this.settingsState.set(settings);
        }
        return settings;
      })
      .catch((error: unknown) => {
        if (this.stateVersion === loadVersion) {
          this.errorState.set(readApiErrorMessage(error, 'Your settings could not be loaded.'));
        }
        return null;
      })
      .finally(() => {
        if (this.inFlightLoad === request) {
          this.loadingState.set(false);
          this.inFlightLoad = null;
        }
      });
    this.inFlightLoad = request;

    return this.inFlightLoad;
  }

  async updateLibraryVisibility(
    libraryVisibility: LibraryVisibility,
  ): Promise<UserSettings | null> {
    return this.update({ libraryVisibility }, 'Your library visibility could not be saved.');
  }

  async updateActivityVisibility(
    activityVisibility: ActivityVisibility,
  ): Promise<UserSettings | null> {
    return this.update({ activityVisibility }, 'Your activity visibility could not be saved.');
  }

  async updatePrivacy(input: UpdateUserSettings): Promise<UserSettings | null> {
    return this.update(input, 'Your privacy settings could not be saved.');
  }

  private async update(
    input: UpdateUserSettings,
    fallbackMessage: string,
  ): Promise<UserSettings | null> {
    this.errorState.set(null);
    const updateVersion = this.stateVersion;

    try {
      const settings = await firstValueFrom(
        this.http.patch<UserSettings>(`${environment.apiBaseUrl}/settings`, input),
      );
      if (this.stateVersion === updateVersion) {
        this.settingsState.set(settings);
      }
      return settings;
    } catch (error: unknown) {
      if (this.stateVersion === updateVersion) {
        this.errorState.set(readApiErrorMessage(error, fallbackMessage));
      }
      return null;
    }
  }

  clear(): void {
    this.stateVersion += 1;
    this.inFlightLoad = null;
    this.settingsState.set(null);
    this.loadingState.set(false);
    this.errorState.set(null);
  }
}
