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
import { ActivatedRoute, ParamMap, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { readApiErrorMessage } from '../../../../core/api/api-error';
import { Button } from '../../../../shared/components/button/button';
import { FormField } from '../../../../shared/components/form-field/form-field';
import { MediaPoster } from '../../../../shared/components/media-poster/media-poster';
import { PageState } from '../../../../shared/components/page-state/page-state';
import { Pagination } from '../../../../shared/components/pagination/pagination';
import { LibraryService } from '../../../library/data-access/library.service';
import { WatchStatus } from '../../../library/models/library';
import { MediaService } from '../../data-access/media.service';
import { MediaSearchRequest, MediaSummary, SearchMediaType } from '../../models/media';

@Component({
  selector: 'app-search-page',
  imports: [ReactiveFormsModule, RouterLink, Button, FormField, MediaPoster, PageState, Pagination],
  templateUrl: './search-page.html',
  styleUrls: ['./search-page.scss', './search-page-mobile.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchPage implements OnInit {
  private readonly mediaService = inject(MediaService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private searchRequestId = 0;
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
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const state = readSearchState(params);

      this.searchForm.setValue(
        {
          query: state.query,
          type: state.type,
          koreanOnly: state.koreanOnly,
        },
        { emitEvent: false },
      );

      if (!state.query) {
        this.clearSearchResults();
        return;
      }

      void this.loadPage(state.page);
    });
  }

  protected submitSearch(): void {
    this.searchForm.markAllAsTouched();

    if (this.searchForm.invalid) {
      return;
    }

    void this.navigateToSearchPage(1);
  }

  protected changePage(page: number): void {
    if (page < 1 || page > this.totalPages() || this.isLoading()) {
      return;
    }

    void this.navigateToSearchPage(page);
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
    return status === 'to_watch' ? 'To watch' : status === 'watching' ? 'Watching' : 'Watched';
  }

  private async loadPage(page: number): Promise<void> {
    const requestId = ++this.searchRequestId;
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

      if (requestId !== this.searchRequestId) {
        return;
      }

      this.results.set(response.results);
      this.currentPage.set(response.page);
      this.totalPages.set(response.totalPages);
      this.totalResults.set(response.totalResults);
      this.hasSearched.set(true);
    } catch (error: unknown) {
      if (requestId !== this.searchRequestId) {
        return;
      }

      this.results.set([]);
      this.totalPages.set(0);
      this.totalResults.set(0);
      this.hasSearched.set(true);
      this.error.set(
        readApiErrorMessage(error, 'Search is unavailable right now. Please try again.'),
      );
    } finally {
      if (requestId === this.searchRequestId) {
        this.isLoading.set(false);
      }
    }
  }

  private async navigateToSearchPage(page: number): Promise<void> {
    const values = this.searchForm.getRawValue();
    const queryParams = {
      q: values.query.trim(),
      ...(values.type !== 'all' ? { type: values.type } : {}),
      ...(values.koreanOnly ? { korean: '1' } : {}),
      ...(page > 1 ? { page } : {}),
    };
    const targetKey = searchStateKey({
      query: queryParams.q,
      type: values.type,
      koreanOnly: values.koreanOnly,
      page,
    });
    const currentKey = searchStateKey(readSearchState(this.route.snapshot.queryParamMap));

    if (targetKey === currentKey) {
      await this.loadPage(page);
      return;
    }

    await this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
    });
  }

  private clearSearchResults(): void {
    this.searchRequestId += 1;
    this.results.set([]);
    this.currentPage.set(1);
    this.totalPages.set(0);
    this.totalResults.set(0);
    this.hasSearched.set(false);
    this.error.set(null);
    this.isLoading.set(false);
  }
}

interface SearchRouteState {
  query: string;
  type: SearchMediaType;
  koreanOnly: boolean;
  page: number;
}

function readSearchState(params: ParamMap): SearchRouteState {
  const query = (params.get('q') ?? '').trim().slice(0, 100);
  const rawType = params.get('type');
  const type: SearchMediaType = rawType === 'tv' || rawType === 'movie' ? rawType : 'all';
  const koreanOnly = params.get('korean') === '1';
  const rawPage = Number(params.get('page'));
  const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;

  return {
    query,
    type: koreanOnly ? 'tv' : type,
    koreanOnly,
    page,
  };
}

function searchStateKey(state: SearchRouteState): string {
  return JSON.stringify(state);
}
