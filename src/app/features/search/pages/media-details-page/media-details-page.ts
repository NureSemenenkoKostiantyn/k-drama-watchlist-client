import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { readApiErrorMessage } from '../../../../core/api/api-error';
import { LibraryService } from '../../../library/data-access/library.service';
import { WatchStatus } from '../../../library/models/library';
import { MediaService } from '../../data-access/media.service';
import { MediaDetails, MediaType } from '../../models/media';

@Component({
  selector: 'app-media-details-page',
  imports: [RouterLink],
  templateUrl: './media-details-page.html',
  styleUrl: './media-details-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MediaDetailsPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly mediaService = inject(MediaService);
  protected readonly library = inject(LibraryService);

  protected readonly media = signal<MediaDetails | null>(null);
  protected readonly isLoading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly isUpdatingLibrary = signal(false);
  protected readonly regularSeasons = computed(
    () => this.media()?.seasons?.filter((season) => season.seasonNumber > 0) ?? [],
  );
  protected readonly specials = computed(
    () => this.media()?.seasons?.filter((season) => season.seasonNumber === 0) ?? [],
  );

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
}

function isMediaType(value: string | null): value is MediaType {
  return value === 'tv' || value === 'movie';
}
