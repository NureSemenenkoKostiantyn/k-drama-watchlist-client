import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { readApiErrorMessage } from '../../../../core/api/api-error';
import { LibraryService } from '../../../library/data-access/library.service';
import { WatchStatus } from '../../../library/models/library';
import { MediaService } from '../../data-access/media.service';
import { MediaSearchRequest, MediaSummary, SearchMediaType } from '../../models/media';

@Component({
  selector: 'app-search-page',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './search-page.html',
  styleUrl: './search-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchPage implements OnInit {
  private readonly mediaService = inject(MediaService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly library = inject(LibraryService);

  protected readonly searchForm = new FormGroup({
    query: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(100)],
    }),
    type: new FormControl<SearchMediaType>('all', { nonNullable: true }),
    koreanOnly: new FormControl(false, { nonNullable: true }),
  });
  protected readonly results = signal<MediaSummary[]>([]);
  protected readonly isLoading = signal(false);
  protected readonly hasSearched = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly currentPage = signal(1);
  protected readonly totalPages = signal(0);
  protected readonly totalResults = signal(0);
  protected readonly pendingMediaId = signal<string | null>(null);

  constructor() {
    this.searchForm.controls.koreanOnly.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((enabled) => {
        if (enabled) {
          this.searchForm.controls.type.setValue('tv');
        }
      });
  }

  ngOnInit(): void {
    void this.library.load();
  }

  protected submitSearch(): void {
    this.searchForm.markAllAsTouched();

    if (this.searchForm.invalid) {
      return;
    }

    void this.loadPage(1);
  }

  protected changePage(page: number): void {
    if (page < 1 || page > this.totalPages() || this.isLoading()) {
      return;
    }

    void this.loadPage(page);
  }

  protected displayYear(media: MediaSummary): string {
    return (media.firstAirDate ?? media.releaseDate)?.slice(0, 4) ?? 'Year unknown';
  }

  protected displayScore(media: MediaSummary): string | null {
    return media.tmdbVoteAverage === undefined ? null : media.tmdbVoteAverage.toFixed(1);
  }

  protected async setLibraryStatus(media: MediaSummary, status: WatchStatus): Promise<void> {
    if (this.pendingMediaId() !== null) {
      return;
    }

    this.pendingMediaId.set(media.id);
    await this.library.setStatus(media.mediaType, media.tmdbId, status);
    this.pendingMediaId.set(null);
  }

  protected statusLabel(status: WatchStatus): string {
    return status === 'to_watch'
      ? 'To watch'
      : status === 'watching'
        ? 'Watching'
        : 'Watched';
  }

  private async loadPage(page: number): Promise<void> {
    const values = this.searchForm.getRawValue();
    const request: MediaSearchRequest = {
      query: values.query.trim(),
      type: values.koreanOnly ? 'tv' : values.type,
      page,
      ...(values.koreanOnly ? { country: 'KR' } : {}),
    };

    this.isLoading.set(true);
    this.error.set(null);

    try {
      const response = await firstValueFrom(this.mediaService.search(request));
      this.results.set(response.results);
      this.currentPage.set(response.page);
      this.totalPages.set(response.totalPages);
      this.totalResults.set(response.totalResults);
      this.hasSearched.set(true);
    } catch (error: unknown) {
      this.results.set([]);
      this.totalPages.set(0);
      this.totalResults.set(0);
      this.hasSearched.set(true);
      this.error.set(
        readApiErrorMessage(error, 'Search is unavailable right now. Please try again.'),
      );
    } finally {
      this.isLoading.set(false);
    }
  }
}
