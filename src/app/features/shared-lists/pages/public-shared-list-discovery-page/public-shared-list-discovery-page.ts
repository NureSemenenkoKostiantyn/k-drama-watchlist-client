import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { RouterLink } from '@angular/router';

import { OpenGraphMetadataService } from '../../../../core/open-graph-metadata.service';
import { buildDiscoveryStructuredData } from '../../../../core/seo-structured-data';
import { PublicSharedListsService } from '../../data-access/public-shared-lists.service';
import { PublicSharedListDiscovery } from '../../models/shared-list';

@Component({
  selector: 'app-public-shared-list-discovery-page',
  imports: [RouterLink],
  templateUrl: './public-shared-list-discovery-page.html',
  styleUrl: './public-shared-list-discovery-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicSharedListDiscoveryPage implements OnInit, OnDestroy {
  private readonly publicLists = inject(PublicSharedListsService);
  private readonly document = inject(DOCUMENT);
  private readonly openGraph = inject(OpenGraphMetadataService);
  protected readonly result = signal<PublicSharedListDiscovery | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly requestedPage = signal(1);

  ngOnInit(): void {
    this.updateMetadata();
    void this.load(1);
  }

  ngOnDestroy(): void {
    this.openGraph.clear();
  }

  protected load(page: number): void {
    if (page < 1 || this.loading() && this.result() !== null) return;
    void this.loadPage(page);
  }

  private async loadPage(page: number): Promise<void> {
    this.requestedPage.set(page);
    this.loading.set(true);
    this.error.set(null);
    try {
      const result = await this.publicLists.discover(page);
      this.result.set(result);
      this.updateMetadata(result);
    } catch (error: unknown) {
      this.error.set(
        error instanceof Error ? error.message : 'Public watchlists could not be loaded.',
      );
    } finally {
      this.loading.set(false);
    }
  }

  private updateMetadata(result?: PublicSharedListDiscovery): void {
    const title = 'Discover public watchlists · Drama Watch';
    const description =
      'Discover public drama and movie watchlists created by the Drama Watch community.';
    const canonicalUrl = `${this.document.location.origin}/lists/discover`;
    this.openGraph.set({
      title,
      description,
      canonicalUrl,
      allowIndexing: true,
      structuredData: buildDiscoveryStructuredData(
        title,
        description,
        canonicalUrl,
        (result?.items ?? []).map((list) => ({
          name: list.title,
          ...(list.description ? { description: list.description } : {}),
          url: `${this.document.location.origin}/lists/public/${encodeURIComponent(list.publicSlug)}`,
        })),
      ),
    });
  }
}
