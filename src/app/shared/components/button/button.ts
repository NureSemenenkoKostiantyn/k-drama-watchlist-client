import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-button',
  templateUrl: './button.html',
  styleUrl: './button.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.ui-button-host--full-width]': 'fullWidth()',
  },
})
export class Button {
  readonly type = input<'button' | 'submit' | 'reset'>('button');
  readonly variant = input<'primary' | 'secondary' | 'danger'>('primary');
  readonly density = input<'comfortable' | 'compact'>('comfortable');
  readonly disabled = input(false);
  readonly fullWidth = input(false);
  readonly busy = input(false);
}
