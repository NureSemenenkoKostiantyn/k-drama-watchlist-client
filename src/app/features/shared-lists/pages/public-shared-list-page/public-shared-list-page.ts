import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { OpenGraphMetadataService } from '../../../../core/open-graph-metadata.service';
import { buildCollectionStructuredData } from '../../../../core/seo-structured-data';
import { PublicSharedListsService } from '../../data-access/public-shared-lists.service';
import { PublicSharedListDetails } from '../../models/shared-list';

@Component({
  selector: 'app-public-shared-list-page',
  imports: [RouterLink],
  templateUrl: './public-shared-list-page.html',
  styleUrl: './public-shared-list-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicSharedListPage implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly publicLists = inject(PublicSharedListsService);
  private readonly document = inject(DOCUMENT);
  private readonly openGraph = inject(OpenGraphMetadataService);
  protected readonly list = signal<PublicSharedListDetails | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

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
      this.error.set('This shared-list link is invalid.');
      this.loading.set(false);
      return;
    }
    try {
      const list = await this.publicLists.get(publicSlug);
      this.list.set(list);
      const title = `${list.title} · Drama Watch`;
      const imageUrl = preferredMediaImage(list.items.map((item) => item.media));
      const description =
        list.description ??
        `Explore ${list.itemCount} ${list.itemCount === 1 ? 'title' : 'titles'} in ${list.title}, a shared Drama Watch list.`;
      const canonicalUrl = `${this.document.location.origin}/lists/public/${encodeURIComponent(publicSlug)}`;
      this.openGraph.set({
        title,
        description,
        canonicalUrl,
        ...(imageUrl ? { imageUrl, imageAlt: `Preview of ${list.title}` } : {}),
        allowIndexing: list.visibility === 'public',
        structuredData: buildCollectionStructuredData({
          name: list.title,
          description,
          canonicalUrl,
          itemCount: list.itemCount,
          items: list.items.map((item) => item.media),
        }),
      });
    } catch (error: unknown) {
      this.error.set(
        error instanceof Error ? error.message : 'This shared list is unavailable.',
      );
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
