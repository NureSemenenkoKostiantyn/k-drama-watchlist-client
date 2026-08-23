import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
} from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { readApiErrorMessage } from '../../../../core/api/api-error';
import {
  MEDIA_COUNTRY_OPTIONS,
  MEDIA_GENRE_OPTIONS,
  MEDIA_SORT_OPTIONS,
} from '../../../../shared/media-filter-options';
import { WatchStatus } from '../../../library/models/library';
import { MediaSummary, MediaType } from '../../../search/models/media';
import { PublicLibraryService } from '../../data-access/public-library.service';
import { UsersService } from '../../data-access/users.service';
import {
  PublicLibraryFilters,
  PublicLibraryResponse,
  PublicLibrarySort,
} from '../../models/public-library';
import { PublicUserProfile } from '../../models/public-user-profile';

type LibraryView = 'grid' | 'list';

@Component({
  selector: 'app-friend-library-page',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './friend-library-page.html',
  styleUrls: [
    './friend-library-page.scss',
    './friend-library-filters.scss',
    './friend-library-states.scss',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FriendLibraryPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly users = inject(UsersService);
  private readonly publicLibrary = inject(PublicLibraryService);
  private userId: string | null = null;

  protected readonly profile = signal<PublicUserProfile | null>(null);
  protected readonly library = signal<PublicLibraryResponse | null>(null);
  protected readonly isLoading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly view = signal<LibraryView>('grid');
  protected readonly genreOptions = MEDIA_GENRE_OPTIONS;
  protected readonly countryOptions = MEDIA_COUNTRY_OPTIONS;
  protected readonly sortOptions: readonly {
    value: PublicLibrarySort;
    label: string;
  }[] = MEDIA_SORT_OPTIONS;
  protected readonly filters = new FormGroup(
    {
      status: new FormControl<WatchStatus | ''>('', {
        nonNullable: true,
      }),
      mediaType: new FormControl<MediaType | ''>('', {
        nonNullable: true,
      }),
      minRating: new FormControl<number | null>(null),
      genreId: new FormControl<number | null>(null),
      country: new FormControl('', { nonNullable: true }),
      yearFrom: new FormControl<number | null>(null),
      yearTo: new FormControl<number | null>(null),
      sort: new FormControl<PublicLibrarySort>('recent', {
        nonNullable: true,
      }),
    },
    { validators: yearRangeValidator },
  );

  ngOnInit(): void {
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const userId = params.get('userId');

        if (!userId) {
          this.error.set('This library link is invalid.');
          this.isLoading.set(false);
          return;
        }

        this.userId = userId;
        void this.loadProfile(userId);
        void this.loadLibrary(1);
      });
  }

  protected applyFilters(): void {
    this.filters.markAllAsTouched();

    if (this.filters.invalid) {
      return;
    }

    void this.loadLibrary(1);
  }

  protected clearFilters(): void {
    this.filters.reset({
      status: '',
      mediaType: '',
      minRating: null,
      genreId: null,
      country: '',
      yearFrom: null,
      yearTo: null,
      sort: 'recent',
    });
    void this.loadLibrary(1);
  }

  protected goToPage(page: number): void {
    const library = this.library();

    if (!library || page < 1 || page > library.totalPages || page === library.page) {
      return;
    }

    void this.loadLibrary(page);
  }

  protected statusLabel(status: WatchStatus): string {
    if (status === 'to_watch') {
      return 'To watch';
    }

    return status === 'watching' ? 'Watching' : 'Watched';
  }

  protected visibilityLabel(visibility: PublicLibraryResponse['visibility']): string {
    if (visibility === 'friends') {
      return 'Friends-only library';
    }

    return visibility === 'public' ? 'Public library' : 'Private owner preview';
  }

  protected displayYear(media: MediaSummary): string | null {
    return (media.firstAirDate ?? media.releaseDate)?.slice(0, 4) ?? null;
  }

  protected initials(profile: PublicUserProfile): string {
    return (
      profile.name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toUpperCase() || '?'
    );
  }

  private async loadProfile(userId: string): Promise<void> {
    try {
      this.profile.set(await this.users.getById(userId));
    } catch {
      this.profile.set(null);
    }
  }

  private async loadLibrary(page: number): Promise<void> {
    if (!this.userId) {
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);

    try {
      const response = await this.publicLibrary.get(
        this.userId,
        this.buildFilters(page),
      );
      this.library.set(response);
      this.profile.set(response.user);
    } catch (error: unknown) {
      this.library.set(null);
      this.error.set(readApiErrorMessage(error, 'This library is unavailable right now.'));
    } finally {
      this.isLoading.set(false);
    }
  }

  private buildFilters(page: number): PublicLibraryFilters {
    const values = this.filters.getRawValue();
    const country = values.country.trim().toUpperCase();

    return {
      page,
      limit: 24,
      ...(values.status ? { status: values.status } : {}),
      ...(values.mediaType ? { mediaType: values.mediaType } : {}),
      ...(values.minRating === null ? {} : { minRating: values.minRating }),
      ...(values.genreId === null ? {} : { genreId: values.genreId }),
      ...(country ? { country } : {}),
      ...(values.yearFrom === null ? {} : { yearFrom: values.yearFrom }),
      ...(values.yearTo === null ? {} : { yearTo: values.yearTo }),
      sort: values.sort,
    };
  }
}

function yearRangeValidator(control: AbstractControl): ValidationErrors | null {
  const yearFrom = control.get('yearFrom')?.value as number | null | undefined;
  const yearTo = control.get('yearTo')?.value as number | null | undefined;

  return yearFrom !== null &&
    yearFrom !== undefined &&
    yearTo !== null &&
    yearTo !== undefined &&
    yearFrom > yearTo
    ? { yearRange: true }
    : null;
}
