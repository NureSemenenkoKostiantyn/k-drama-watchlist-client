import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { ActivatedRoute, RouterLink, RouterLinkActive } from '@angular/router';

import { CategoryManager } from '../../../categories/components/category-manager/category-manager';
import { EntryCategoryPicker } from '../../../categories/components/entry-category-picker/entry-category-picker';
import { CategoriesService } from '../../../categories/data-access/categories.service';
import { ProgressControls } from '../../components/progress-controls/progress-controls';
import { LibraryService } from '../../data-access/library.service';
import { LibraryEntry, WatchStatus } from '../../models/library';

@Component({
  selector: 'app-library-page',
  imports: [
    RouterLink,
    RouterLinkActive,
    CategoryManager,
    EntryCategoryPicker,
    ProgressControls,
  ],
  templateUrl: './library-page.html',
  styleUrl: './library-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LibraryPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  protected readonly library = inject(LibraryService);
  protected readonly categories = inject(CategoriesService);
  protected readonly status = readWatchStatus(this.route.snapshot.data['status']);
  protected readonly pendingEntryId = signal<string | null>(null);
  protected readonly selectedCategoryId = signal('all');
  protected readonly entries = computed(() =>
    this.library
      .entries()
      .filter((entry) => entry.status === this.status)
      .filter(
        (entry) =>
          this.selectedCategoryId() === 'all' ||
          entry.categoryIds.includes(this.selectedCategoryId()),
      ),
  );
  protected readonly heading =
    this.status === 'to_watch'
      ? 'To watch'
      : this.status === 'watching'
        ? 'Watching'
        : 'Watched';

  constructor() {
    effect(() => {
      const selectedCategoryId = this.selectedCategoryId();

      if (
        selectedCategoryId !== 'all' &&
        !this.categories
          .categories()
          .some((category) => category.id === selectedCategoryId)
      ) {
        this.selectedCategoryId.set('all');
      }
    });
  }

  ngOnInit(): void {
    void this.library.load();
    void this.categories.load();
  }

  protected displayYear(entry: LibraryEntry): string {
    return (entry.media.firstAirDate ?? entry.media.releaseDate)?.slice(0, 4) ?? 'Year unknown';
  }

  protected async changeStatus(entry: LibraryEntry, event: Event): Promise<void> {
    const select = event.target;

    if (!(select instanceof HTMLSelectElement) || !isWatchStatus(select.value)) {
      return;
    }

    this.pendingEntryId.set(entry.id);
    await this.library.setStatus(entry.media.mediaType, entry.media.tmdbId, select.value);
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
}

function readWatchStatus(value: unknown): WatchStatus {
  return isWatchStatus(value) ? value : 'to_watch';
}

function isWatchStatus(value: unknown): value is WatchStatus {
  return value === 'to_watch' || value === 'watching' || value === 'watched';
}
