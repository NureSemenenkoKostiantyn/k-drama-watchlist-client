import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MediaPoster } from '../../../../shared/components/media-poster/media-poster';
import { TierMedia } from '../../models/tier-list';

@Component({
  selector: 'app-tier-poster',
  imports: [MediaPoster, RouterLink],
  template: `
    @if (editable()) {
      <button
        type="button"
        class="poster"
        [class.selected]="selected()"
        [attr.aria-pressed]="selected()"
        [attr.aria-label]="'Arrange ' + item().title"
        [disabled]="busy()"
        (click)="chosen.emit(item().id)"
      >
        <app-media-poster
          [posterUrl]="item().posterUrl"
          [title]="item().title"
          [decorative]="true"
          fallback="initial"
        />
        <span class="caption" [class.missing]="!item().posterUrl">{{ item().title }}</span>
      </button>
    } @else {
      <a
        class="poster"
        [routerLink]="['/media', item().mediaType, item().tmdbId]"
        [attr.aria-label]="item().title"
      >
        <app-media-poster
          [posterUrl]="item().posterUrl"
          [title]="item().title"
          [decorative]="true"
          fallback="initial"
        />
        <span class="caption" [class.missing]="!item().posterUrl">{{ item().title }}</span>
      </a>
    }
  `,
  styles: `
    :host {
      display: block;
      min-width: 0;
    }
    .poster {
      position: relative;
      display: block;
      width: 100%;
      aspect-ratio: 2 / 3;
      overflow: hidden;
      padding: 0;
      border: 0;
      border-radius: 0;
      background: var(--color-surface-raised);
      color: #fff;
    }
    button {
      cursor: grab;
    }
    .poster.selected {
      outline: 3px solid var(--color-accent);
      outline-offset: -3px;
    }
    .caption {
      position: absolute;
      inset: auto 0 0;
      padding: 0.35rem;
      background: #110d19eb;
      font-size: 0.7rem;
      line-height: 1.25;
      overflow-wrap: anywhere;
      opacity: 0;
      pointer-events: none;
      max-height: 100%;
      overflow: hidden;
    }
    .poster:hover .caption,
    .poster:focus-visible .caption,
    .selected .caption,
    .caption.missing {
      opacity: 1;
    }
    @media (max-width: 48rem) {
      button {
        cursor: pointer;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TierPoster {
  readonly item = input.required<TierMedia>();
  readonly editable = input(false);
  readonly selected = input(false);
  readonly busy = input(false);
  readonly chosen = output<string>();
}
