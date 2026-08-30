import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

import { MediaPoster } from '../../../../shared/components/media-poster/media-poster';
import { Category } from '../../../categories/models/category';
import { EntryCategoryPicker } from '../../../categories/components/entry-category-picker/entry-category-picker';
import { ProgressControls } from '../progress-controls/progress-controls';
import { LibraryEntry, WatchStatus } from '../../models/library';

@Component({
  selector: 'app-library-entry-card',
  imports: [RouterLink, EntryCategoryPicker, MediaPoster, ProgressControls],
  templateUrl: './library-entry-card.html',
  styleUrl: './library-entry-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LibraryEntryCard {
  readonly entry = input.required<LibraryEntry>();
  readonly categories = input.required<Category[]>();
  readonly pending = input(false);
  readonly isListView = input(false);

  readonly statusChange = output<WatchStatus>();
  readonly removeRequested = output<void>();

  protected displayYear(): string {
    const media = this.entry().media;
    return (media.firstAirDate ?? media.releaseDate)?.slice(0, 4) ?? 'Year unknown';
  }

  protected changeStatus(event: Event): void {
    const select = event.target;

    if (select instanceof HTMLSelectElement && isWatchStatus(select.value)) {
      this.statusChange.emit(select.value);
    }
  }
}

function isWatchStatus(value: unknown): value is WatchStatus {
  return value === 'to_watch' || value === 'watching' || value === 'watched';
}
