import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { readApiErrorMessage } from '../../../../core/api/api-error';
import { Button } from '../../../../shared/components/button/button';
import { FormField } from '../../../../shared/components/form-field/form-field';
import { MediaPoster } from '../../../../shared/components/media-poster/media-poster';
import type { LibraryEntry, WatchStatus } from '../../../library/models/library';
import { incrementEpisode } from '../../../library/utils/progress';
import type { MediaSummary, SearchMediaType } from '../../../search/models/media';
import { TelegramService } from '../../data-access/telegram.service';
import { TelegramMiniAppSession } from '../../models/telegram';

interface TelegramWebApp {
  initData: string;
  expand(): void;
  ready(): void;
}

interface TelegramWindow extends Window {
  Telegram?: { WebApp?: TelegramWebApp };
}

@Component({
  selector: 'app-telegram-mini-app-page',
  imports: [RouterLink, ReactiveFormsModule, Button, FormField, MediaPoster],
  templateUrl: './telegram-mini-app-page.html',
  styleUrl: './telegram-mini-app-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TelegramMiniAppPage implements OnInit {
  private readonly document = inject(DOCUMENT);
  private readonly telegramService = inject(TelegramService);
  protected readonly isInsideTelegram = signal(false);
  protected readonly isLoading = signal(false);
  protected readonly session = signal<TelegramMiniAppSession | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly actionError = signal<string | null>(null);
  protected readonly notice = signal<string | null>(null);
  protected readonly activeView = signal<'library' | 'search'>('library');
  protected readonly libraryEntries = signal<LibraryEntry[]>([]);
  protected readonly searchResults = signal<MediaSummary[]>([]);
  protected readonly isLibraryLoading = signal(false);
  protected readonly isSearching = signal(false);
  protected readonly hasSearched = signal(false);
  protected readonly pendingId = signal<string | null>(null);
  protected readonly queryControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.maxLength(100)],
  });
  protected readonly typeControl = new FormControl<SearchMediaType>('all', {
    nonNullable: true,
  });
  protected readonly watchingEntries = computed(() =>
    this.libraryEntries().filter((entry) => entry.status === 'watching'),
  );
  protected readonly toWatchEntries = computed(() =>
    this.libraryEntries().filter((entry) => entry.status === 'to_watch'),
  );

  ngOnInit(): void {
    const telegram = (this.document.defaultView as TelegramWindow | null)?.Telegram?.WebApp;
    if (!telegram?.initData) return;

    this.isInsideTelegram.set(true);
    telegram.ready();
    telegram.expand();

    void this.initialize(telegram.initData);
  }

  protected showView(view: 'library' | 'search'): void {
    this.activeView.set(view);
    this.actionError.set(null);
    this.notice.set(null);
  }

  protected async search(): Promise<void> {
    this.queryControl.markAsTouched();
    if (this.queryControl.invalid || this.isSearching()) return;

    this.isSearching.set(true);
    this.actionError.set(null);
    this.notice.set(null);
    try {
      const response = await this.telegramService.searchMiniApp(
        this.queryControl.value.trim(),
        this.typeControl.value,
      );
      this.searchResults.set(response.results);
      this.hasSearched.set(true);
    } catch (error: unknown) {
      this.actionError.set(readApiErrorMessage(error, 'Search is unavailable right now.'));
    } finally {
      this.isSearching.set(false);
    }
  }

  protected async addToWatch(media: MediaSummary): Promise<void> {
    if (this.pendingId()) return;
    this.pendingId.set(media.id);
    this.clearFeedback();
    try {
      const entry = await this.telegramService.addFromMiniApp(media, 'to_watch');
      this.libraryEntries.update((entries) => [entry, ...entries]);
      this.notice.set(`${media.title} was added to your watchlist.`);
    } catch (error: unknown) {
      this.actionError.set(readApiErrorMessage(error, 'The title could not be added.'));
    } finally {
      this.pendingId.set(null);
    }
  }

  protected async updateStatus(entry: LibraryEntry, status: WatchStatus): Promise<void> {
    await this.updateEntry(entry, () => this.telegramService.updateMiniAppStatus(entry.id, status));
  }

  protected async increment(entry: LibraryEntry): Promise<void> {
    const next = incrementEpisode(entry);
    if (!this.canIncrement(entry)) return;
    await this.updateEntry(entry, () => this.telegramService.updateMiniAppProgress(entry.id, next));
  }

  protected canIncrement(entry: LibraryEntry): boolean {
    const current = entry.progress;
    const next = incrementEpisode(entry);
    return (
      entry.media.mediaType === 'tv' &&
      (!current ||
        next.currentSeason !== current.currentSeason ||
        next.currentEpisode !== current.currentEpisode)
    );
  }

  protected isInLibrary(media: MediaSummary): boolean {
    return this.libraryEntries().some(
      (entry) => entry.media.mediaType === media.mediaType && entry.media.tmdbId === media.tmdbId,
    );
  }

  protected progressLabel(entry: LibraryEntry): string {
    if (!entry.progress) return 'Not started';
    return `Season ${entry.progress.currentSeason}, episode ${entry.progress.currentEpisode}`;
  }

  private async initialize(initData: string): Promise<void> {
    this.isLoading.set(true);
    try {
      this.session.set(await this.telegramService.authenticateMiniApp(initData));
      await this.loadLibrary();
    } catch (error: unknown) {
      this.error.set(readApiErrorMessage(error, 'Telegram authentication could not be completed.'));
    } finally {
      this.isLoading.set(false);
    }
  }

  private async loadLibrary(): Promise<void> {
    this.isLibraryLoading.set(true);
    try {
      this.libraryEntries.set(await this.telegramService.loadMiniAppLibrary());
    } finally {
      this.isLibraryLoading.set(false);
    }
  }

  private async updateEntry(
    entry: LibraryEntry,
    request: () => Promise<LibraryEntry>,
  ): Promise<void> {
    if (this.pendingId()) return;
    this.pendingId.set(entry.id);
    this.clearFeedback();
    try {
      const updated = await request();
      this.libraryEntries.update((entries) =>
        entries.map((candidate) => (candidate.id === updated.id ? updated : candidate)),
      );
    } catch (error: unknown) {
      this.actionError.set(readApiErrorMessage(error, 'Your library could not be updated.'));
    } finally {
      this.pendingId.set(null);
    }
  }

  private clearFeedback(): void {
    this.actionError.set(null);
    this.notice.set(null);
  }
}
