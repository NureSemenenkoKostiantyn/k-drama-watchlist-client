import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { firstValueFrom, startWith } from 'rxjs';
import { readApiErrorMessage } from '../../../../core/api/api-error';
import { Button } from '../../../../shared/components/button/button';
import { FormField } from '../../../../shared/components/form-field/form-field';
import { MediaPoster } from '../../../../shared/components/media-poster/media-poster';
import { MEDIA_GENRE_OPTIONS } from '../../../../shared/media-filter-options';
import { LibraryService } from '../../../library/data-access/library.service';
import { MediaService } from '../../../search/data-access/media.service';
import { TierMedia } from '../../models/tier-list';
import { filterTierLibrary, TierLibraryFilters } from '../../utils/tier-library';

@Component({
  selector: 'app-tier-picker',
  imports: [Button, FormField, MediaPoster, ReactiveFormsModule],
  providers: [LibraryService],
  templateUrl: './tier-picker.html',
  styleUrl: './tier-picker.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TierPicker implements OnInit {
  readonly existing = input.required<string[]>();
  readonly busy = input(false);
  readonly saveError = input('');
  readonly progress = input('');
  readonly added = output<TierMedia[]>();
  protected readonly library = inject(LibraryService);
  private readonly media = inject(MediaService);
  private readonly fb = inject(FormBuilder).nonNullable;
  protected readonly genres = MEDIA_GENRE_OPTIONS;
  protected readonly query = new FormControl('', { nonNullable: true });
  protected readonly filters = this.fb.group({
    status: this.fb.control<TierLibraryFilters['status']>('watched'),
    type: this.fb.control<TierLibraryFilters['type']>('all'),
    genre: this.fb.control<number | null>(null),
    query: '',
  });
  private readonly filterValues = toSignal(
    this.filters.valueChanges.pipe(startWith(this.filters.getRawValue())),
  );
  protected readonly source = signal<'library' | 'search'>('library');
  protected readonly results = signal<TierMedia[]>([]);
  protected readonly selected = signal<TierMedia[]>([]);
  protected readonly searching = signal(false);
  protected readonly error = signal('');
  protected readonly page = signal(1);
  protected readonly libraryPage = signal(1);
  protected readonly hasNext = signal(false);
  private lastQuery = '';
  protected readonly libraryMatches = computed(() =>
    filterTierLibrary(this.library.entries(), this.filterValues() as TierLibraryFilters),
  );
  protected readonly bulkItems = computed(() =>
    this.libraryMatches().filter((item) => !this.existing().includes(item.id)),
  );
  protected readonly candidates = computed(() =>
    this.source() === 'search'
      ? this.results()
      : this.libraryMatches().slice((this.libraryPage() - 1) * 60, this.libraryPage() * 60),
  );
  protected readonly libraryPages = computed(() =>
    Math.max(1, Math.ceil(this.libraryMatches().length / 60)),
  );
  protected readonly selection = computed(() =>
    this.selected().filter((item) => !this.existing().includes(item.id)),
  );
  protected readonly maximum = computed(() => Math.max(0, 300 - this.existing().length));
  protected readonly overCapacity = computed(() => this.bulkItems().length > this.maximum());

  ngOnInit(): void {
    void this.library.load();
  }

  protected setSource(source: 'library' | 'search'): void {
    if (!this.busy()) this.source.set(source);
  }
  protected preset(status: 'all' | 'watched'): void {
    if (this.busy()) return;
    this.filters.reset({ status, type: 'all', genre: null, query: '' });
    this.libraryPage.set(1);
  }
  protected toggle(item: TierMedia): void {
    if (this.busy() || this.existing().includes(item.id)) return;
    this.selected.update((items) =>
      items.some((value) => value.id === item.id)
        ? items.filter((value) => value.id !== item.id)
        : this.selection().length < this.maximum()
          ? [...this.selection(), item]
          : items,
    );
  }
  protected isSelected(id: string): boolean {
    return this.selection().some((item) => item.id === id);
  }
  protected selectVisible(): void {
    if (this.busy()) return;
    const byId = new Map(
      [...this.selection(), ...this.candidates()]
        .filter((item) => !this.existing().includes(item.id))
        .map((item) => [item.id, item]),
    );
    this.selected.set([...byId.values()].slice(0, this.maximum()));
  }
  protected addMatching(): void {
    if (
      this.busy() ||
      this.library.isLoading() ||
      this.library.error() ||
      this.overCapacity() ||
      !this.bulkItems().length
    )
      return;
    this.added.emit(this.bulkItems());
  }
  protected addSelected(): void {
    if (!this.busy() && this.selection().length && this.selection().length <= this.maximum())
      this.added.emit(this.selection());
  }
  protected async search(page = 1): Promise<void> {
    if (this.searching() || this.busy()) return;
    const query = page === 1 ? this.query.value.trim() : this.lastQuery;
    if (!query) return;
    this.searching.set(true);
    this.error.set('');
    try {
      const result = await firstValueFrom(this.media.search({ query, type: 'all', page }));
      this.results.set(result.results);
      this.page.set(page);
      this.hasNext.set(page < result.totalPages);
      this.lastQuery = query;
    } catch (error) {
      this.error.set(readApiErrorMessage(error, 'Search is unavailable. Please try again.'));
    } finally {
      this.searching.set(false);
    }
  }
}
