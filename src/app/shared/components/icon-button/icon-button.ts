import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-icon-button',
  templateUrl: './icon-button.html',
  styleUrl: './icon-button.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IconButton {
  readonly label = input.required<string>();
  readonly type = input<'button' | 'submit' | 'reset'>('button');
  readonly disabled = input(false);
  readonly pressed = input<boolean>();
  readonly controls = input<string>();
  readonly expanded = input<boolean>();
  readonly tone = input<'neutral' | 'accent' | 'danger'>('neutral');
  readonly activated = output<void>();
}
