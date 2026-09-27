import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { readApiErrorMessage } from '../../../core/api/api-error';
import { Button } from '../../../shared/components/button/button';
import { ConfirmationDialog } from '../../../shared/components/confirmation-dialog/confirmation-dialog';
import { FormField } from '../../../shared/components/form-field/form-field';
import { PageState } from '../../../shared/components/page-state/page-state';
import { TierBoard } from '../components/tier-board/tier-board';
import { TierPicker } from '../components/tier-picker/tier-picker';
import { TierRowsEditor } from '../components/tier-rows-editor/tier-rows-editor';
import { TierExportService } from '../data-access/tier-export.service';
import { TierListsService } from '../data-access/tier-lists.service';
import { TierLayout, TierList, TierMedia, TierVisibility } from '../models/tier-list';
import { layoutOf, moveTitle, TierMove } from '../utils/tier-layout';

@Component({
  selector: 'app-tier-list-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    Button,
    ConfirmationDialog,
    FormField,
    PageState,
    TierBoard,
    TierPicker,
    TierRowsEditor,
  ],
  templateUrl: './tier-list-page.html',
  styleUrl: './tier-pages.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TierListPage {
  private readonly api = inject(TierListsService);
  private readonly exporter = inject(TierExportService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder).nonNullable;
  protected readonly board = signal<TierList | null>(null);
  protected readonly loading = signal(true);
  protected readonly busy = signal(false);
  protected readonly exporting = signal(false);
  protected readonly conflict = signal(false);
  protected readonly error = signal('');
  protected readonly notice = signal('');
  protected readonly undoLayout = signal<TierLayout | null>(null);
  protected readonly confirm = signal<{ type: 'board' | 'item'; id: string } | null>(null);
  protected readonly locked = computed(() => this.busy() || this.conflict() || this.loading());
  protected readonly existing = computed(() =>
    this.board()
      ? [...this.board()!.tiers.flatMap((row) => row.items), ...this.board()!.unranked].map(
          (item) => item.id,
        )
      : [],
  );
  protected readonly form = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(100)]],
    description: ['', Validators.maxLength(1000)],
    visibility: this.fb.control<TierVisibility>('private'),
  });
  private generation = 0;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.generation++);
    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe(() => {
      void this.load();
    });
  }

  protected async load(): Promise<void> {
    const generation = ++this.generation;
    this.loading.set(true);
    this.error.set('');
    this.conflict.set(false);
    this.board.set(null);
    this.undoLayout.set(null);
    this.confirm.set(null);
    try {
      const board = await this.api.get(this.route.snapshot.paramMap.get('tierListId') ?? '');
      if (generation !== this.generation) return;
      this.board.set(board);
      this.form.reset({
        title: board.title,
        description: board.description,
        visibility: board.visibility,
      });
      this.notice.set('All changes saved');
    } catch (error) {
      if (generation === this.generation)
        this.error.set(readApiErrorMessage(error, 'This tier list is unavailable.'));
    } finally {
      if (generation === this.generation) {
        this.loading.set(false);
        this.busy.set(false);
      }
    }
  }

  protected async saveSettings(): Promise<void> {
    const board = this.board();
    const value = this.form.getRawValue();
    if (!board || this.form.invalid || !value.title.trim()) return;
    await this.mutate(() =>
      this.api.update(board.id, { ...value, title: value.title.trim(), revision: board.revision }),
    );
  }

  protected move(move: TierMove): void {
    const board = this.board();
    if (board) void this.saveLayout(moveTitle(board, move));
  }
  protected async saveLayout(layout: TierLayout): Promise<void> {
    const board = this.board();
    if (!board) return;
    const previous = layoutOf(board);
    if (await this.mutate(() => this.api.layout(board.id, { ...layout, revision: board.revision })))
      this.undoLayout.set(previous);
  }
  protected async undo(): Promise<void> {
    const board = this.board();
    const previous = this.undoLayout();
    if (!board || !previous) return;
    if (
      await this.mutate(() => this.api.layout(board.id, { ...previous, revision: board.revision }))
    )
      this.undoLayout.set(null);
  }
  protected async add(items: TierMedia[]): Promise<void> {
    const board = this.board();
    if (!board) return;
    if (
      await this.mutate(() =>
        this.api.add(board.id, {
          revision: board.revision,
          items: items.map(({ mediaType, tmdbId }) => ({ mediaType, tmdbId })),
        }),
      )
    )
      this.undoLayout.set(null);
  }

  protected async duplicate(): Promise<void> {
    const generation = this.generation;
    const board = this.board();
    if (!board || this.locked()) return;
    this.busy.set(true);
    this.error.set('');
    try {
      const copy = await this.api.duplicate(board.id, board.revision);
      if (generation !== this.generation) return;
      await this.router.navigate(['/tier-lists', copy.id]);
    } catch (error) {
      this.handleError(error);
    } finally {
      this.busy.set(false);
    }
  }

  protected async confirmDelete(): Promise<void> {
    const board = this.board();
    const action = this.confirm();
    if (!board || !action || this.locked()) return;
    if (action.type === 'item') {
      if (
        await this.mutate(() =>
          this.api.remove(board.id, { revision: board.revision, mediaId: action.id }),
        )
      ) {
        this.confirm.set(null);
        this.undoLayout.set(null);
      }
    } else {
      this.busy.set(true);
      this.error.set('');
      const generation = this.generation;
      try {
        await this.api.delete(board.id, board.revision);
        if (generation !== this.generation) return;
        await this.router.navigate(['/tier-lists']);
      } catch (error) {
        this.handleError(error);
        this.confirm.set(null);
      } finally {
        this.busy.set(false);
      }
    }
  }

  protected async export(share = false): Promise<void> {
    const board = this.board();
    if (!board || this.exporting()) return;
    this.exporting.set(true);
    try {
      this.notice.set(await this.exporter.export(board, share));
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'PNG export failed.');
    } finally {
      this.exporting.set(false);
    }
  }

  protected async copyLink(): Promise<void> {
    const slug = this.board()?.publicSlug;
    if (!slug) return;
    try {
      await navigator.clipboard.writeText(`${location.origin}/api/public/tier-lists/share/${slug}`);
      this.notice.set('Share link copied');
    } catch {
      this.error.set('Clipboard unavailable. Open the public preview and copy its address.');
    }
  }

  private async mutate(request: () => Promise<TierList>): Promise<boolean> {
    if (this.locked()) return false;
    const generation = this.generation;
    this.busy.set(true);
    this.error.set('');
    this.notice.set('Saving…');
    try {
      const board = await request();
      if (generation !== this.generation) return false;
      this.board.set(board);
      this.notice.set('All changes saved');
      return true;
    } catch (error) {
      if (generation === this.generation) this.handleError(error);
      return false;
    } finally {
      if (generation === this.generation) this.busy.set(false);
    }
  }

  private handleError(error: unknown): void {
    this.conflict.set(error instanceof HttpErrorResponse && error.status === 409);
    this.error.set(
      readApiErrorMessage(error, 'Changes could not be saved. Your last saved board is unchanged.'),
    );
    this.notice.set('Not saved');
  }
}
