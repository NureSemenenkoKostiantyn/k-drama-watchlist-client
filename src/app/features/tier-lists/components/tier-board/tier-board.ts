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
import { map } from 'rxjs';
import { Button } from '../../../../shared/components/button/button';
import { FormField } from '../../../../shared/components/form-field/form-field';
import { MediaPoster } from '../../../../shared/components/media-poster/media-poster';
import { TierMedia, TierRow, TIER_COLORS } from '../../models/tier-list';
import { TierMove, UNRANKED } from '../../utils/tier-layout';

@Component({
  selector: 'app-tier-board',
  imports: [CdkDrag, CdkDropList, CdkDropListGroup, Button, FormField, MediaPoster, RouterLink],
  templateUrl: './tier-board.html',
  styleUrl: './tier-board.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TierBoard {
  readonly tiers = input.required<TierRow[]>();
  readonly unranked = input<TierMedia[] | null>(null);
  readonly editable = input(false);
  readonly busy = input(false);
  readonly moved = output<TierMove>();
  readonly removed = output<string>();
  protected readonly colors = TIER_COLORS;
  protected readonly selectedId = signal<string | null>(null);
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
    this.moved.emit({
      mediaId: media.id,
      targetId: event.container.data.id,
      index: event.currentIndex,
    });
  }

  protected move(targetId: string, index: number): void {
    const item = this.selection()?.item;
    if (item && this.editable() && !this.busy())
      this.moved.emit({ mediaId: item.id, targetId, index });
  }

  protected changeTier(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const targetId = select.value;
    // Keep the control aligned with the saved board until the server confirms the move.
    select.value = this.selection()?.row.id ?? targetId;
    this.move(targetId, this.rows().find((row) => row.id === targetId)?.items.length ?? 0);
  }
}
