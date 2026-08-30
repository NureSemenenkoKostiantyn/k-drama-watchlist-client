import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-page-state',
  templateUrl: './page-state.html',
  styleUrl: './page-state.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.ui-page-state--error]': "variant() === 'error'",
    '[class.ui-page-state--loading]': "variant() === 'loading'",
    '[class.ui-page-state--compact]': 'compact()',
    '[attr.role]': 'semanticRole()',
    '[attr.aria-live]': 'ariaLive()',
  },
})
export class PageState {
  readonly variant = input<'info' | 'loading' | 'error' | 'empty'>('info');
  readonly heading = input<string>();
  readonly message = input<string>();
  readonly compact = input(false);

  protected readonly semanticRole = computed(() =>
    this.variant() === 'error' ? 'alert' : 'status',
  );
  protected readonly ariaLive = computed(() =>
    this.variant() === 'error' ? 'assertive' : 'polite',
  );
}
