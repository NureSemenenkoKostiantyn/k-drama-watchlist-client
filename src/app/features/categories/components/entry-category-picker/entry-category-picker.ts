import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';

import { LibraryService } from '../../../library/data-access/library.service';
import { LibraryEntry } from '../../../library/models/library';
import { Category } from '../../models/category';

@Component({
  selector: 'app-entry-category-picker',
  templateUrl: './entry-category-picker.html',
  styleUrl: './entry-category-picker.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntryCategoryPicker {
  private readonly library = inject(LibraryService);

  readonly entry = input.required<LibraryEntry>();
  readonly categories = input.required<readonly Category[]>();
  protected readonly selectedIds = signal<ReadonlySet<string>>(new Set());
  protected readonly isSaving = signal(false);
  protected readonly saved = signal(false);

  constructor() {
    effect(() => {
      this.selectedIds.set(new Set(this.entry().categoryIds));
    });
  }

  protected toggle(categoryId: string, event: Event): void {
    const inputElement = event.target;

    if (!(inputElement instanceof HTMLInputElement)) {
      return;
    }

    const next = new Set(this.selectedIds());

    if (inputElement.checked) {
      next.add(categoryId);
    } else {
      next.delete(categoryId);
    }

    this.selectedIds.set(next);
    this.saved.set(false);
  }

  protected async save(): Promise<void> {
    if (this.isSaving()) {
      return;
    }

    this.isSaving.set(true);
    const result = await this.library.updateCategories(
      this.entry().id,
      [...this.selectedIds()],
    );
    this.isSaving.set(false);
    this.saved.set(result !== null);
  }
}
