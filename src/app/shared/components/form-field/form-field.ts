import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  input,
} from '@angular/core';

@Component({
  selector: 'app-form-field',
  templateUrl: './form-field.html',
  styleUrl: './form-field.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    '[class.ui-form-field--compact]': "density() === 'compact'",
    '[class.ui-form-field--muted-label]': 'mutedLabel()',
  },
})
export class FormField {
  readonly label = input.required<string>();
  readonly inputId = input.required<string>();
  readonly hint = input<string>();
  readonly hintId = input<string>();
  readonly error = input<string>();
  readonly errorId = input<string>();
  readonly density = input<'comfortable' | 'compact'>('comfortable');
  readonly mutedLabel = input(false);
}
