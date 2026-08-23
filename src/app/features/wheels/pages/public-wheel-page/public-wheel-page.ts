import { DatePipe, DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { OpenGraphMetadataService } from '../../../../core/open-graph-metadata.service';
import { PublicWheelsService } from '../../data-access/public-wheels.service';
import { PublicWheelDetails } from '../../models/wheel';

@Component({
  selector: 'app-public-wheel-page',
  imports: [DatePipe, RouterLink],
  templateUrl: './public-wheel-page.html',
  styleUrl: './public-wheel-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicWheelPage implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly publicWheels = inject(PublicWheelsService);
  private readonly document = inject(DOCUMENT);
  private readonly openGraph = inject(OpenGraphMetadataService);
  protected readonly wheel = signal<PublicWheelDetails | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly enabledItems = computed(
    () => this.wheel()?.items.filter((item) => item.isEnabled) ?? [],
  );

  ngOnInit(): void {
    this.openGraph.prepare();
    void this.load();
  }

  ngOnDestroy(): void {
    this.openGraph.clear();
  }

  private async load(): Promise<void> {
    const publicSlug = this.route.snapshot.paramMap.get('publicSlug') ?? '';
    if (!publicSlug) {
      this.error.set('This wheel link is invalid.');
      this.loading.set(false);
      return;
    }
    try {
      const wheel = await this.publicWheels.get(publicSlug);
      this.wheel.set(wheel);
      const title = `${wheel.title} · Drama Watch`;
      const imageUrl = preferredMediaImage(wheel.items.map((item) => item.media));
      this.openGraph.set({
        title,
        description:
          wheel.description ??
          `Explore ${wheel.itemCount} ${wheel.itemCount === 1 ? 'candidate' : 'candidates'} on ${wheel.title}, a Drama Watch wheel.`,
        canonicalUrl: `${this.document.location.origin}/wheels/public/${encodeURIComponent(publicSlug)}`,
        ...(imageUrl ? { imageUrl, imageAlt: `Preview of ${wheel.title}` } : {}),
        allowIndexing: wheel.visibility === 'public',
      });
    } catch (error: unknown) {
      this.error.set(error instanceof Error ? error.message : 'This wheel is unavailable.');
    } finally {
      this.loading.set(false);
    }
  }
}

function preferredMediaImage(
  media: { backdropUrl?: string; posterUrl?: string }[],
): string | undefined {
  return (
    media.find((item) => item.backdropUrl)?.backdropUrl ??
    media.find((item) => item.posterUrl)?.posterUrl
  );
}
