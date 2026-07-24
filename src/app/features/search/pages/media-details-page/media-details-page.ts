import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { readApiErrorMessage } from '../../../../core/api/api-error';
import { ProgressControls } from '../../../library/components/progress-controls/progress-controls';
import { LibraryService } from '../../../library/data-access/library.service';
import {
  AudioType,
  LibraryEntry,
  WatchStatus,
} from '../../../library/models/library';
import { MediaService } from '../../data-access/media.service';
import { MediaDetails, MediaType } from '../../models/media';

@Component({
  selector: 'app-media-details-page',
  imports: [ReactiveFormsModule, RouterLink, ProgressControls],
  templateUrl: './media-details-page.html',
  styleUrl: './media-details-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MediaDetailsPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly mediaService = inject(MediaService);
  private readonly formBuilder = inject(FormBuilder);
  private syncedEntryId: string | null = null;
  protected readonly library = inject(LibraryService);

  protected readonly media = signal<MediaDetails | null>(null);
  protected readonly isLoading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly isUpdatingLibrary = signal(false);
  protected readonly isSavingTracking = signal(false);
  protected readonly savedMessage = signal<string | null>(null);
  protected readonly currentEntry = computed(() => {
    const media = this.media();
    return media ? this.library.entryFor(media.mediaType, media.tmdbId) : undefined;
  });
  protected readonly personalForm = this.formBuilder.group({
    rating: [null as number | null, [Validators.min(1), Validators.max(10)]],
    description: ['', [Validators.maxLength(5_000)]],
  });
  protected readonly playbackForm = this.formBuilder.nonNullable.group({
    audioType: '' as AudioType | '',
    languageCode: ['', [Validators.maxLength(16)]],
    customLabel: ['', [Validators.maxLength(100)]],
    subtitleLanguageCode: ['', [Validators.maxLength(16)]],
  });
  protected readonly regularSeasons = computed(
    () => this.media()?.seasons?.filter((season) => season.seasonNumber > 0) ?? [],
  );
  protected readonly specials = computed(
    () => this.media()?.seasons?.filter((season) => season.seasonNumber === 0) ?? [],
  );

  constructor() {
    effect(() => {
      const entry = this.currentEntry();

      if (!entry || entry.id === this.syncedEntryId) {
        return;
      }

      this.syncTrackingForms(entry);
      this.syncedEntryId = entry.id;
    });
  }

  ngOnInit(): void {
    void this.loadDetails();
    void this.library.load();
  }

  protected displayYear(): string | null {
    const media = this.media();
    return (media?.firstAirDate ?? media?.releaseDate)?.slice(0, 4) ?? null;
  }

  protected displayScore(): string | null {
    const score = this.media()?.tmdbVoteAverage;
    return score === undefined ? null : score.toFixed(1);
  }

  protected async setLibraryStatus(status: WatchStatus): Promise<void> {
    const media = this.media();

    if (!media || this.isUpdatingLibrary()) {
      return;
    }

    this.isUpdatingLibrary.set(true);
    await this.library.setStatus(media.mediaType, media.tmdbId, status);
    this.isUpdatingLibrary.set(false);
  }

  protected statusLabel(status: WatchStatus): string {
    return status === 'to_watch'
      ? 'To watch'
      : status === 'watching'
        ? 'Watching'
        : 'Watched';
  }

  protected async savePersonalDetails(): Promise<void> {
    const entry = this.currentEntry();

    if (!entry || this.personalForm.invalid || this.isSavingTracking()) {
      this.personalForm.markAllAsTouched();
      return;
    }

    this.isSavingTracking.set(true);
    this.savedMessage.set(null);
    const rating = this.personalForm.controls.rating.value;
    const ratingResult = await this.library.updateRating(entry.id, rating);

    if (ratingResult) {
      const rawDescription = this.personalForm.controls.description.value ?? '';
      const description = rawDescription.trim() || null;
      const descriptionResult = await this.library.updateDescription(entry.id, description);

      if (descriptionResult) {
        this.savedMessage.set('Personal details saved.');
      }
    }

    this.isSavingTracking.set(false);
  }

  protected async savePlaybackPreference(): Promise<void> {
    const entry = this.currentEntry();

    if (!entry || this.playbackForm.invalid || this.isSavingTracking()) {
      this.playbackForm.markAllAsTouched();
      return;
    }

    this.isSavingTracking.set(true);
    this.savedMessage.set(null);
    const value = this.playbackForm.getRawValue();
    const audio = isAudioType(value.audioType)
      ? {
          type: value.audioType,
          ...optionalValue('languageCode', value.languageCode),
          ...optionalValue('customLabel', value.customLabel),
        }
      : null;
    const result = await this.library.updatePlaybackPreference(entry.id, {
      audio,
      subtitleLanguageCode: value.subtitleLanguageCode.trim() || null,
    });

    if (result) {
      this.savedMessage.set('Playback preference saved.');
    }

    this.isSavingTracking.set(false);
  }

  private async loadDetails(): Promise<void> {
    const rawMediaType = this.route.snapshot.paramMap.get('mediaType');
    const rawTmdbId = this.route.snapshot.paramMap.get('tmdbId');
    const tmdbId = Number(rawTmdbId);

    if (!isMediaType(rawMediaType) || !Number.isInteger(tmdbId) || tmdbId < 1) {
      this.error.set('This media link is invalid.');
      this.isLoading.set(false);
      return;
    }

    try {
      this.media.set(await firstValueFrom(this.mediaService.getDetails(rawMediaType, tmdbId)));
    } catch (error: unknown) {
      this.error.set(
        readApiErrorMessage(error, 'Media details are unavailable right now. Please try again.'),
      );
    } finally {
      this.isLoading.set(false);
    }
  }

  private syncTrackingForms(entry: LibraryEntry): void {
    this.personalForm.setValue(
      {
        rating: entry.rating ?? null,
        description: entry.description ?? '',
      },
      { emitEvent: false },
    );
    this.playbackForm.setValue(
      {
        audioType: entry.playbackPreference?.audio?.type ?? '',
        languageCode: entry.playbackPreference?.audio?.languageCode ?? '',
        customLabel: entry.playbackPreference?.audio?.customLabel ?? '',
        subtitleLanguageCode: entry.playbackPreference?.subtitleLanguageCode ?? '',
      },
      { emitEvent: false },
    );
  }
}

function isMediaType(value: string | null): value is MediaType {
  return value === 'tv' || value === 'movie';
}

function isAudioType(value: string): value is AudioType {
  return (
    value === 'original' ||
    value === 'dubbed' ||
    value === 'mixed' ||
    value === 'unknown'
  );
}

function optionalValue<Key extends 'languageCode' | 'customLabel'>(
  key: Key,
  value: string,
): Partial<Record<Key, string>> {
  const normalized = value.trim();
  return normalized ? { [key]: normalized } as Record<Key, string> : {};
}
