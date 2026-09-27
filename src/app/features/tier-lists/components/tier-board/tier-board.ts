import { BreakpointObserver } from '@angular/cdk/layout';
import { CdkDrag, CdkDragDrop, CdkDropList, CdkDropListGroup } from '@angular/cdk/drag-drop';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { NgTemplateOutlet } from '@angular/common';
import { map } from 'rxjs';
import { Button } from '../../../../shared/components/button/button';
import { DialogPanel } from '../../../../shared/components/dialog-panel/dialog-panel';
import { IconButton } from '../../../../shared/components/icon-button/icon-button';
import { TierPoster } from '../tier-poster/tier-poster';
import { TierMedia, TierRow, TIER_COLORS } from '../../models/tier-list';
import { TierMove, UNRANKED } from '../../utils/tier-layout';

@Component({
  selector: 'app-tier-board',
  imports: [
    CdkDrag,
    CdkDropList,
    CdkDropListGroup,
    Button,
    DialogPanel,
    IconButton,
    TierPoster,
    RouterLink,
    NgTemplateOutlet,
  ],
  templateUrl: './tier-board.html',
  styleUrl: './tier-board.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TierBoard {
  readonly tiers = input.required<TierRow[]>();
  readonly unranked = input<TierMedia[] | null>(null);
  readonly editable = input(false);
  readonly allowAdd = input(true);
  readonly allowRemove = input(true);
  readonly busy = input(false);
  readonly saving = input(false);
  readonly error = input('');
  readonly moved = output<TierMove>();
  readonly removed = output<string>();
  readonly editTier = output<string>();
  readonly addRequested = output<void>();
  protected readonly colors = TIER_COLORS;
  protected readonly selectedId = signal<string | null>(null);
  protected readonly filter = signal('');
  protected readonly tray = computed<TierRow>(() => ({
    id: UNRANKED,
    label: 'Unranked',
    color: 'gray',
    items: (this.unranked() ?? []).filter((item) =>
      `${item.title} ${item.originalTitle}`
        .toLocaleLowerCase()
        .includes(this.filter().trim().toLocaleLowerCase()),
    ),
  }));
  protected readonly mobile = toSignal(
    inject(BreakpointObserver)
      .observe('(max-width: 48rem)')
      .pipe(map((state) => state.matches)),
    { initialValue: true },
  );
  protected readonly rows = computed(() => [
    ...this.tiers(),
    ...(this.unranked() === null
      ? []
      : [{ id: UNRANKED, label: 'Unranked', color: 'gray' as const, items: this.unranked()! }]),
  ]);
  protected readonly selection = computed(() => {
    for (const row of this.rows()) {
      const index = row.items.findIndex((item) => item.id === this.selectedId());
      if (index >= 0) return { row, index, item: row.items[index] };
    }
    return null;
  });

  protected drop(event: CdkDragDrop<TierRow>): void {
    if (!this.editable() || this.busy() || this.mobile()) return;
    const media = event.item.data as TierMedia;
    let index = event.currentIndex;
    if (event.container.data.id === UNRANKED && this.filter().trim()) {
      // Map the filtered drop position to the full tray without losing hidden titles.
      const visible = this.tray().items.filter((item) => item.id !== media.id);
      const full = (this.unranked() ?? []).filter((item) => item.id !== media.id);
      const anchor = visible[index];
      index = anchor ? full.findIndex((item) => item.id === anchor.id) : full.length;
    }
    this.moved.emit({
      mediaId: media.id,
      targetId: event.container.data.id,
      index,
    });
  }

  protected move(targetId: string, index: number): void {
    const item = this.selection()?.item;
    if (item && this.editable() && !this.busy())
      this.moved.emit({ mediaId: item.id, targetId, index });
  }

  protected changeTier(targetId: string): void {
    if (targetId === this.selection()?.row.id) return;
    this.move(targetId, this.rows().find((row) => row.id === targetId)?.items.length ?? 0);
  }
}
