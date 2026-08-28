import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export type KeyboardReorderAction = 'before' | 'after' | 'previous-group' | 'next-group';

@Component({
  selector: 'app-keyboard-reorder-controls',
  templateUrl: './keyboard-reorder-controls.html',
  styleUrl: './keyboard-reorder-controls.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KeyboardReorderControls {
  readonly itemLabel = input.required<string>();
  readonly groupLabel = input('group');
  readonly orientation = input<'horizontal' | 'vertical'>('vertical');
  readonly disabled = input(false);
  readonly touchFriendly = input(false);
  readonly showPositionMoves = input(true);
  readonly showGroupMoves = input(false);
  readonly canMoveBefore = input(false);
  readonly canMoveAfter = input(false);
  readonly canMoveToPreviousGroup = input(false);
  readonly canMoveToNextGroup = input(false);
  readonly moveRequested = output<KeyboardReorderAction>();

  protected requestMove(action: KeyboardReorderAction, event: Event): void {
    event.stopPropagation();
    this.moveRequested.emit(action);
  }
}
