import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';

import {
  ShareCardDelivery,
  ShareCardExportService,
} from '../../data-access/share-card-export.service';
import {
  ShareCardFormat,
  ShareCardSource,
  ShareCardTemplate,
  ShareCardTheme,
} from '../../models/share-card';

interface TemplateOption {
  value: ShareCardTemplate;
  label: string;
}

@Component({
  selector: 'app-share-card-creator',
  templateUrl: './share-card-creator.html',
  styleUrls: ['./share-card-creator.scss', './share-card-preview.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShareCardCreator {
  private readonly exporter = inject(ShareCardExportService);
  private initialized = false;

  readonly source = input<ShareCardSource | null>(null);

  protected readonly template = signal<ShareCardTemplate>('recommendation');
  protected readonly format = signal<ShareCardFormat>('square');
  protected readonly theme = signal<ShareCardTheme>('dark');
  protected readonly includeRating = signal(false);
  protected readonly includeDescription = signal(false);
  protected readonly includeProgress = signal(false);
  protected readonly includeUsername = signal(true);
  protected readonly isSharing = signal(false);
  protected readonly isDownloading = signal(false);
  protected readonly isExporting = computed(
    () => this.isSharing() || this.isDownloading(),
  );
  protected readonly exportMessage = signal<string | null>(null);
  protected readonly exportError = signal<string | null>(null);
  protected readonly templateOptions = computed<TemplateOption[]>(() => {
    const source = this.source();

    if (!source) {
      return [];
    }

    if (source.kind === 'wheel_result') {
      return [{ value: 'wheel_result', label: 'Wheel result' }];
    }

    const options: TemplateOption[] = [
      { value: 'recommendation', label: 'Recommendation' },
    ];

    if (source.rating !== undefined) {
      options.unshift({ value: 'rating', label: 'Rating' });
    }

    if (source.progress) {
      options.unshift({ value: 'progress', label: 'Progress' });
    }

    if (source.status === 'watched') {
      options.unshift({ value: 'completed', label: 'Completed' });
    }

    return options;
  });
  protected readonly templateLabel = computed(
    () =>
      this.templateOptions().find(
        (option) => option.value === this.template(),
      )?.label ?? 'Share card',
  );
  protected readonly progressLabel = computed(() => {
    const progress = this.source()?.progress;

    if (!progress) {
      return '';
    }

    return `Season ${progress.currentSeason}, episode ${progress.currentEpisode}`;
  });
  protected readonly episodeLabel = computed(() => {
    const progress = this.source()?.progress;

    if (!progress) {
      return '';
    }

    return progress.totalEpisodes
      ? `${progress.completedEpisodes} / ${progress.totalEpisodes} episodes`
      : `${progress.completedEpisodes} episodes completed`;
  });
  protected readonly ratingLabel = computed(() => {
    const rating = this.source()?.rating;
    return rating === undefined
      ? ''
      : `${Number.isInteger(rating) ? rating.toFixed(0) : rating.toFixed(1)} / 10`;
  });

  constructor() {
    effect(() => {
      const source = this.source();

      if (!source || this.initialized) {
        return;
      }

      this.template.set(defaultTemplate(source));
      this.includeRating.set(source.rating !== undefined);
      this.includeProgress.set(source.progress !== undefined);
      this.initialized = true;
    });
  }

  protected changeTemplate(event: Event): void {
    const value = readSelectValue(event);

    if (
      value &&
      this.templateOptions().some((option) => option.value === value)
    ) {
      this.template.set(value as ShareCardTemplate);
    }
  }

  protected changeFormat(event: Event): void {
    const value = readSelectValue(event);

    if (value === 'square' || value === 'story' || value === 'landscape') {
      this.format.set(value);
    }
  }

  protected changeTheme(event: Event): void {
    const value = readSelectValue(event);

    if (value === 'light' || value === 'dark' || value === 'poster') {
      this.theme.set(value);
    }
  }

  protected setToggle(
    state: { set(value: boolean): void },
    event: Event,
  ): void {
    const input = event.target;

    if (input instanceof HTMLInputElement) {
      state.set(input.checked);
    }
  }

  protected async download(): Promise<void> {
    const source = this.source();

    if (!source || this.isExporting()) {
      return;
    }

    this.isDownloading.set(true);
    this.exportMessage.set(null);
    this.exportError.set(null);

    try {
      await this.exporter.download({
        source,
        configuration: {
          template: this.template(),
          format: this.format(),
          theme: this.theme(),
          includeRating: this.includeRating(),
          includeDescription: this.includeDescription(),
          includeProgress: this.includeProgress(),
          includeUsername: this.includeUsername(),
        },
      });
      this.exportMessage.set('Your PNG card is ready.');
    } catch {
      this.exportError.set(
        'The card could not be downloaded. Please try again.',
      );
    } finally {
      this.isDownloading.set(false);
    }
  }

  protected async share(): Promise<void> {
    const source = this.source();

    if (!source || this.isExporting()) {
      return;
    }

    this.isSharing.set(true);
    this.exportMessage.set(null);
    this.exportError.set(null);

    try {
      const delivery = await this.exporter.share({
        source,
        configuration: {
          template: this.template(),
          format: this.format(),
          theme: this.theme(),
          includeRating: this.includeRating(),
          includeDescription: this.includeDescription(),
          includeProgress: this.includeProgress(),
          includeUsername: this.includeUsername(),
        },
      });
      this.exportMessage.set(shareMessage(delivery));
    } catch {
      this.exportError.set(
        'The card could not be shared. You can still download the PNG.',
      );
    } finally {
      this.isSharing.set(false);
    }
  }
}

function defaultTemplate(source: ShareCardSource): ShareCardTemplate {
  if (source.kind === 'wheel_result') {
    return 'wheel_result';
  }

  if (source.status === 'watched') {
    return 'completed';
  }

  if (source.progress) {
    return 'progress';
  }

  if (source.rating !== undefined) {
    return 'rating';
  }

  return 'recommendation';
}

function readSelectValue(event: Event): string | null {
  return event.target instanceof HTMLSelectElement
    ? event.target.value
    : null;
}

function shareMessage(delivery: ShareCardDelivery): string | null {
  switch (delivery) {
    case 'shared':
      return 'Your card was shared.';
    case 'copied':
      return 'PNG copied. Paste it into your post or message.';
    case 'downloaded':
      return 'Sharing is unavailable here, so the PNG was downloaded.';
    case 'cancelled':
      return null;
  }
}
