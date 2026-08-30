import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-media-poster',
  templateUrl: './media-poster.html',
  styleUrl: './media-poster.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.ui-media-poster--empty]': '!posterUrl()',
  },
})
export class MediaPoster {
  readonly posterUrl = input<string | null>();
  readonly title = input.required<string>();
  readonly alt = input<string>();
  readonly decorative = input(false);
  readonly fallback = input<'label' | 'initial'>('label');
  readonly eager = input(false);

  protected readonly imageAlt = computed(() =>
    this.decorative() ? '' : (this.alt() ?? `${this.title()} poster`),
  );
  protected readonly fallbackText = computed(() =>
    this.fallback() === 'initial' ? (this.title().trim().slice(0, 1).toUpperCase() || '?') : 'No poster',
  );
}
