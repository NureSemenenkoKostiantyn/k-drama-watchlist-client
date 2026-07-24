import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { ActivatedRoute, RouterLink, RouterLinkActive } from '@angular/router';

import { LibraryService } from '../../data-access/library.service';
import { LibraryEntry, WatchStatus } from '../../models/library';

@Component({
  selector: 'app-library-page',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './library-page.html',
  styleUrl: './library-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LibraryPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  protected readonly library = inject(LibraryService);
  protected readonly status = readWatchStatus(this.route.snapshot.data['status']);
  protected readonly pendingEntryId = signal<string | null>(null);
  protected readonly entries = computed(() =>
    this.library.entries().filter((entry) => entry.status === this.status),
  );
  protected readonly heading =
    this.status === 'to_watch'
      ? 'To watch'
      : this.status === 'watching'
        ? 'Watching'
        : 'Watched';

  ngOnInit(): void {
    void this.library.load();
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
}

function readWatchStatus(value: unknown): WatchStatus {
  return isWatchStatus(value) ? value : 'to_watch';
}

function isWatchStatus(value: unknown): value is WatchStatus {
  return value === 'to_watch' || value === 'watching' || value === 'watched';
}
