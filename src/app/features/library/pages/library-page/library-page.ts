import { BreakpointObserver } from '@angular/cdk/layout';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
} from '@angular/forms';
import { ActivatedRoute, RouterLink, RouterLinkActive } from '@angular/router';
import { map } from 'rxjs';

import { CategoryManager } from '../../../categories/components/category-manager/category-manager';
import { CategoriesService } from '../../../categories/data-access/categories.service';
import { PriorityService } from '../../../priority/data-access/priority.service';
import { MediaReleaseStatus, MediaType } from '../../../search/models/media';
import {
  MEDIA_COUNTRY_OPTIONS,
  MEDIA_GENRE_OPTIONS,
  MEDIA_SORT_OPTIONS,
  MediaSort,
} from '../../../../shared/media-filter-options';
import { LibraryEntryCard } from '../../components/library-entry-card/library-entry-card';
import { LibraryService } from '../../data-access/library.service';
import { LibraryEntry, WatchStatus } from '../../models/library';
import {
  DEFAULT_LIBRARY_FILTERS,
  filterLibraryEntries,
  hasActiveLibraryFilters,
  LibraryAdvancedFilters,
} from '../../utils/library-filters';

type LibraryView = 'grid' | 'list';
const mobileLibraryBreakpoint = '(max-width: 48rem)';

@Component({
  selector: 'app-library-page',
  imports: [
    RouterLink,
    RouterLinkActive,
    ReactiveFormsModule,
    CategoryManager,
    LibraryEntryCard,
  ],
  templateUrl: './library-page.html',
  styleUrls: [
    './library-page.scss',
    './library-page-tools.scss',
    './library-page-mobile.scss',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LibraryPage implements OnInit {
  private readonly breakpointObserver = inject(BreakpointObserver);
  private readonly route = inject(ActivatedRoute);
  protected readonly library = inject(LibraryService);
  protected readonly categories = inject(CategoriesService);
  protected readonly priority = inject(PriorityService);
  protected readonly status = readWatchStatus(this.route.snapshot.data['status']);
  protected readonly pendingEntryId = signal<string | null>(null);
  protected readonly selectedCategoryId = signal('all');
  protected readonly selectedPriorityLaneId = signal('all');
  protected readonly view = signal<LibraryView>('grid');
  protected readonly isMobileLibraryLayout = toSignal(
    this.breakpointObserver
      .observe(mobileLibraryBreakpoint)
      .pipe(map((breakpointState) => breakpointState.matches)),
    { initialValue: false },
  );
  protected readonly isFilterPanelExpanded = signal(false);
  protected readonly isCategoryManagerExpanded = signal(false);
  protected readonly appliedFilters = signal<LibraryAdvancedFilters>(DEFAULT_LIBRARY_FILTERS);
  protected readonly activeFilterCount = computed(
    () =>
      countActiveLibraryFilters(this.appliedFilters()) +
      Number(this.selectedCategoryId() !== 'all') +
      Number(this.status === 'to_watch' && this.selectedPriorityLaneId() !== 'all'),
  );
  protected readonly genreOptions = MEDIA_GENRE_OPTIONS;
  protected readonly countryOptions = MEDIA_COUNTRY_OPTIONS;
  protected readonly sortOptions = MEDIA_SORT_OPTIONS;
  protected readonly releaseStatusOptions: readonly {
    value: MediaReleaseStatus;
    label: string;
  }[] = [
    { value: 'airing', label: 'Airing / returning' },
    { value: 'upcoming', label: 'Upcoming / in production' },
    { value: 'ended', label: 'Ended / released' },
    { value: 'unknown', label: 'Unknown' },
  ];
  protected readonly filters = new FormGroup(
    {
      query: new FormControl('', { nonNullable: true }),
      mediaType: new FormControl<MediaType | ''>('', { nonNullable: true }),
      releaseStatus: new FormControl<MediaReleaseStatus | ''>('', { nonNullable: true }),
      minRating: new FormControl<number | null>(null),
      genreId: new FormControl<number | null>(null),
      country: new FormControl('', { nonNullable: true }),
      yearFrom: new FormControl<number | null>(null),
      yearTo: new FormControl<number | null>(null),
      suggestedByUserId: new FormControl('', { nonNullable: true }),
      sharedListId: new FormControl('', { nonNullable: true }),
      sort: new FormControl<MediaSort>('recent', { nonNullable: true }),
    },
    { validators: yearRangeValidator },
  );
  protected readonly baseEntries = computed(() =>
    this.library.entries().filter((entry) => entry.status === this.status),
  );
  protected readonly suggestionSources = computed(() =>
    uniqueOptions(
      this.baseEntries().flatMap((entry) =>
        entry.suggestedBy === undefined
          ? []
          : [{ value: entry.suggestedBy.id, label: entry.suggestedBy.displayUsername }],
      ),
    ),
  );
  protected readonly sharedListOptions = computed(() =>
    uniqueOptions(
      this.baseEntries().flatMap((entry) =>
        (entry.sharedLists ?? []).map((list) => ({ value: list.id, label: list.title })),
      ),
    ),
  );
  protected readonly entries = computed(() =>
    filterLibraryEntries(this.library.entries(), this.status, this.appliedFilters())
      .filter(
        (entry) =>
          this.selectedCategoryId() === 'all' ||
          entry.categoryIds.includes(this.selectedCategoryId()),
      )
      .filter(
        (entry) =>
          this.status !== 'to_watch' ||
          this.selectedPriorityLaneId() === 'all' ||
          (this.selectedPriorityLaneId() === 'unassigned'
            ? entry.priorityLaneId === undefined
            : entry.priorityLaneId === this.selectedPriorityLaneId()),
      ),
  );
  protected readonly hasFilters = computed(
    () =>
      hasActiveLibraryFilters(this.appliedFilters()) ||
      this.selectedCategoryId() !== 'all' ||
      this.selectedPriorityLaneId() !== 'all',
  );
  protected readonly heading =
    this.status === 'to_watch' ? 'To watch' : this.status === 'watching' ? 'Watching' : 'Watched';

  protected toggleCategoryManager(): void {
    this.isCategoryManagerExpanded.update((isExpanded) => !isExpanded);
  }

  constructor() {
    effect(() => {
      const selectedCategoryId = this.selectedCategoryId();

      if (
        selectedCategoryId !== 'all' &&
        !this.categories.categories().some((category) => category.id === selectedCategoryId)
      ) {
        this.selectedCategoryId.set('all');
      }

      const selectedPriorityLaneId = this.selectedPriorityLaneId();

      if (
        selectedPriorityLaneId !== 'all' &&
        selectedPriorityLaneId !== 'unassigned' &&
        !this.priority.lanes().some((lane) => lane.id === selectedPriorityLaneId)
      ) {
        this.selectedPriorityLaneId.set('all');
      }
    });
  }

  ngOnInit(): void {
    void this.library.load();
    void this.categories.load();

    if (this.status === 'to_watch') {
      void this.priority.load();
    }
  }

  protected async changeStatus(entry: LibraryEntry, status: WatchStatus): Promise<void> {
    this.pendingEntryId.set(entry.id);
    await this.library.setStatus(entry.media.mediaType, entry.media.tmdbId, status);
    this.pendingEntryId.set(null);
  }

  protected async remove(entry: LibraryEntry): Promise<void> {
    this.pendingEntryId.set(entry.id);
    await this.library.remove(entry.id);
    this.pendingEntryId.set(null);
  }

  protected changeCategoryFilter(event: Event): void {
    const select = event.target;

    if (select instanceof HTMLSelectElement) {
      this.selectedCategoryId.set(select.value);
    }
  }

  protected changePriorityFilter(event: Event): void {
    const select = event.target;

    if (select instanceof HTMLSelectElement) {
      this.selectedPriorityLaneId.set(select.value);
    }
  }

  protected toggleFilterPanel(): void {
    this.isFilterPanelExpanded.update((isExpanded) => !isExpanded);
  }

  protected applyFilters(): void {
    this.filters.markAllAsTouched();

    if (this.filters.invalid) {
      return;
    }

    const value = this.filters.getRawValue();
    this.appliedFilters.set({
      query: value.query,
      mediaType: value.mediaType,
      releaseStatus: value.releaseStatus,
      minRating: value.minRating,
      genreId: value.genreId,
      country: value.country,
      yearFrom: value.yearFrom,
      yearTo: value.yearTo,
      suggestedByUserId: value.suggestedByUserId,
      sharedListId: value.sharedListId,
      sort: value.sort,
    });

    if (this.isMobileLibraryLayout()) {
      this.isFilterPanelExpanded.set(false);
    }
  }

  protected clearFilters(): void {
    this.filters.reset(DEFAULT_LIBRARY_FILTERS);
    this.appliedFilters.set(DEFAULT_LIBRARY_FILTERS);
    this.selectedCategoryId.set('all');
    this.selectedPriorityLaneId.set('all');
  }
}

function readWatchStatus(value: unknown): WatchStatus {
  return isWatchStatus(value) ? value : 'to_watch';
}

function isWatchStatus(value: unknown): value is WatchStatus {
  return value === 'to_watch' || value === 'watching' || value === 'watched';
}

function yearRangeValidator(control: AbstractControl): ValidationErrors | null {
  const yearFrom = control.get('yearFrom')?.value as number | null;
  const yearTo = control.get('yearTo')?.value as number | null;

  return yearFrom !== null && yearTo !== null && yearFrom > yearTo ? { yearRange: true } : null;
}

function uniqueOptions(
  options: { value: string; label: string }[],
): { value: string; label: string }[] {
  return [...new Map(options.map((option) => [option.value, option])).values()].sort(
    (left, right) => left.label.localeCompare(right.label, undefined, { sensitivity: 'base' }),
  );
}

function countActiveLibraryFilters(filters: LibraryAdvancedFilters): number {
  return [
    filters.query.trim().length > 0,
    filters.mediaType !== '',
    filters.releaseStatus !== '',
    filters.minRating !== null,
    filters.genreId !== null,
    filters.country !== '',
    filters.yearFrom !== null,
    filters.yearTo !== null,
    filters.suggestedByUserId !== '',
    filters.sharedListId !== '',
    filters.sort !== 'recent',
  ].filter(Boolean).length;
}
