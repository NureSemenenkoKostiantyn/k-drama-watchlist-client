import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { LibraryService } from '../../data-access/library.service';
import { LibraryEntry, UpdateProgressRequest } from '../../models/library';
import {
  currentProgressRequest,
  decrementEpisode,
  finishCurrentSeason,
  incrementEpisode,
  progressPercentage,
} from '../../utils/progress';

@Component({
  selector: 'app-progress-controls',
  imports: [ReactiveFormsModule],
  templateUrl: './progress-controls.html',
  styleUrl: './progress-controls.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgressControls {
  private readonly formBuilder = inject(FormBuilder);
  protected readonly library = inject(LibraryService);

  readonly entry = input.required<LibraryEntry>();
  protected readonly isSaving = signal(false);
  protected readonly undoRequest = signal<UpdateProgressRequest | null>(null);
  protected readonly progressForm = this.formBuilder.nonNullable.group({
    currentSeason: [1, [Validators.required, Validators.min(0)]],
    currentEpisode: [0, [Validators.required, Validators.min(0)]],
    includeSpecials: false,
  });

  constructor() {
    effect(() => {
      const progress = currentProgressRequest(this.entry());
      this.progressForm.setValue(
        {
          currentSeason: progress.currentSeason,
          currentEpisode: progress.currentEpisode,
          includeSpecials: progress.includeSpecials ?? false,
        },
        {
          emitEvent: false,
        },
      );
    });
  }

  protected progressPercent(): number {
    return progressPercentage(this.entry());
  }

  protected async increment(): Promise<void> {
    await this.runQuickAction(incrementEpisode);
  }

  protected async decrement(): Promise<void> {
    await this.runQuickAction(decrementEpisode);
  }

  protected async finishSeason(): Promise<void> {
    await this.runQuickAction(finishCurrentSeason);
  }

  protected async saveManualProgress(): Promise<void> {
    if (this.progressForm.invalid || this.isSaving()) {
      this.progressForm.markAllAsTouched();
      return;
    }

    await this.persist(this.progressForm.getRawValue(), currentProgressRequest(this.entry()));
  }

  protected async undo(): Promise<void> {
    const previous = this.undoRequest();

    if (!previous || this.isSaving()) {
      return;
    }

    this.isSaving.set(true);
    const result = await this.library.updateProgress(this.entry().id, previous);
    this.isSaving.set(false);

    if (result) {
      this.undoRequest.set(null);
    }
  }

  private async runQuickAction(
    action: (entry: LibraryEntry) => UpdateProgressRequest,
  ): Promise<void> {
    if (this.isSaving()) {
      return;
    }

    const previous = currentProgressRequest(this.entry());
    const next = action(this.entry());

    if (sameProgress(previous, next)) {
      return;
    }

    await this.persist(next, previous);
  }

  private async persist(
    next: UpdateProgressRequest,
    previous: UpdateProgressRequest,
  ): Promise<void> {
    this.isSaving.set(true);
    const result = await this.library.updateProgress(this.entry().id, next);
    this.isSaving.set(false);

    if (result) {
      this.undoRequest.set(previous);
    }
  }
}

function sameProgress(
  left: UpdateProgressRequest,
  right: UpdateProgressRequest,
): boolean {
  return (
    left.currentSeason === right.currentSeason &&
    left.currentEpisode === right.currentEpisode &&
    left.includeSpecials === right.includeSpecials
  );
}
