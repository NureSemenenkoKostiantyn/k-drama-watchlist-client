import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { readApiErrorMessage } from '../../../../core/api/api-error';
import { MediaSummary } from '../../../search/models/media';
import { DiscoveryService } from '../../data-access/discovery.service';
import { DiscoveryHome } from '../../models/discovery-home';

@Component({
  selector: 'app-home-page',
  imports: [RouterLink],
  templateUrl: './home-page.html',
  styleUrls: [
    './home-page.scss',
    './home-page-shelves.scss',
    './home-page-mobile.scss',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage implements OnInit {
  private readonly discoveryService = inject(DiscoveryService);
  protected readonly home = signal<DiscoveryHome | null>(null);
  protected readonly isLoading = signal(true);
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    void this.load();
  }

  protected retry(): void {
    if (!this.isLoading()) {
      void this.load();
    }
  }

  protected displayYear(media: MediaSummary): string {
    return (
      (media.firstAirDate ?? media.releaseDate)?.slice(0, 4) ??
      'Date unknown'
    );
  }

  protected displayScore(media: MediaSummary): string | null {
    return media.tmdbVoteAverage === undefined
      ? null
      : media.tmdbVoteAverage.toFixed(1);
  }

  private async load(): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      this.home.set(
        await firstValueFrom(this.discoveryService.getHome()),
      );
    } catch (error: unknown) {
      this.home.set(null);
      this.error.set(
        readApiErrorMessage(
          error,
          'Discovery is unavailable right now. Please try again.',
        ),
      );
    } finally {
      this.isLoading.set(false);
    }
  }
}
