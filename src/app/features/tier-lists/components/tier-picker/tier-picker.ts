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
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { readApiErrorMessage } from '../../../../core/api/api-error';
import { Button } from '../../../../shared/components/button/button';
import { FormField } from '../../../../shared/components/form-field/form-field';
import { MediaPoster } from '../../../../shared/components/media-poster/media-poster';
import { LibraryService } from '../../../library/data-access/library.service';
import { MediaService } from '../../../search/data-access/media.service';
import { TierMedia } from '../../models/tier-list';

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
  readonly added = output<TierMedia[]>();
  protected readonly library = inject(LibraryService);
  private readonly media = inject(MediaService);
  protected readonly query = new FormControl('', { nonNullable: true });
  protected readonly source = signal<'library' | 'search'>('library');
  protected readonly watchedOnly = signal(true);
  protected readonly results = signal<TierMedia[]>([]);
  protected readonly selected = signal<TierMedia[]>([]);
  protected readonly searching = signal(false);
  protected readonly error = signal('');
  protected readonly page = signal(1);
  protected readonly hasNext = signal(false);
  private lastQuery = '';
  protected readonly candidates = computed(() =>
    this.source() === 'search'
      ? this.results()
      : this.library
          .entries()
          .filter((entry) => !this.watchedOnly() || entry.status === 'watched')
          .map((entry) => entry.media),
  );
  protected readonly selection = computed(() =>
    this.selected().filter((item) => !this.existing().includes(item.id)),
  );
  protected readonly maximum = computed(() =>
    Math.min(50, Math.max(0, 300 - this.existing().length)),
  );

  ngOnInit(): void {
    void this.library.load();
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
    const byId = new Map(
      [...this.selection(), ...this.candidates()]
        .filter((item) => !this.existing().includes(item.id))
        .map((item) => [item.id, item]),
    );
    this.selected.set([...byId.values()].slice(0, this.maximum()));
  }

  protected async search(page = 1): Promise<void> {
    if (this.searching()) return;
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
