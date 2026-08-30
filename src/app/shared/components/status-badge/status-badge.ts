import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-status-badge',
  template: '<span><ng-content /></span>',
  styleUrl: './status-badge.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.ui-status-badge--accent]': "tone() === 'accent'",
    '[class.ui-status-badge--success]': "tone() === 'success'",
    '[class.ui-status-badge--warning]': "tone() === 'warning'",
  },
})
export class StatusBadge {
  readonly tone = input<'neutral' | 'accent' | 'success' | 'warning'>('neutral');
}
