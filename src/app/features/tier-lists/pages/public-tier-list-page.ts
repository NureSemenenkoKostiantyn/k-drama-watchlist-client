import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnDestroy,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { readApiErrorMessage } from '../../../core/api/api-error';
import { OpenGraphMetadataService } from '../../../core/open-graph-metadata.service';
import { buildCollectionStructuredData } from '../../../core/seo-structured-data';
import { Button } from '../../../shared/components/button/button';
import { PageState } from '../../../shared/components/page-state/page-state';
import { PublicUserLink } from '../../../shared/components/public-user-link/public-user-link';
import { TierBoard } from '../components/tier-board/tier-board';
import { TierExportService } from '../data-access/tier-export.service';
import { TierListsService } from '../data-access/tier-lists.service';
import { PublicTierList } from '../models/tier-list';

@Component({
  selector: 'app-public-tier-list-page',
  imports: [RouterLink, Button, PageState, PublicUserLink, TierBoard],
  template: `
    <main class="page">
      <a routerLink="/">← Drama Watch</a>
      @if (loading()) {
        <app-page-state variant="loading" message="Loading tier list…" />
      }
      @if (error()) {
        <app-page-state variant="error" [message]="error()" />
      }
      @if (board(); as list) {
        <header>
          <p class="eyebrow">{{ list.visibility }} ranking · {{ list.itemCount }} titles</p>
          <h1>{{ list.title }}</h1>
          <p>{{ list.description }}</p>
          @if (list.owner; as owner) {
            <app-public-user-link
              [userId]="owner.id"
              [username]="owner.displayUsername"
              [name]="owner.name"
              [image]="owner.image"
              [showAvatar]="true"
            />
          }
        </header>
        <div class="actions">
          <app-button
            variant="secondary"
            [disabled]="exporting()"
            [busy]="exporting()"
            (click)="export()"
            >Download PNG</app-button
          ><app-button variant="secondary" [disabled]="exporting()" (click)="export(true)"
            >Share PNG</app-button
          >
        </div>
        <p class="status" role="status">{{ notice() }}</p>
        <app-tier-board [tiers]="rows()" />
        <p>
          This is a read-only ranking. <a routerLink="/tier-lists">Create your own tier list</a>.
        </p>
      }
    </main>
  `,
  styleUrl: './tier-pages.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicTierListPage implements OnDestroy {
  private readonly api = inject(TierListsService);
  private readonly exporter = inject(TierExportService);
  private readonly metadata = inject(OpenGraphMetadataService);
  private readonly document = inject(DOCUMENT);
  private readonly route = inject(ActivatedRoute);
  protected readonly board = signal<PublicTierList | null>(null);
  protected readonly rows = computed(
    () => this.board()?.tiers.map((row, index) => ({ ...row, id: String(index) })) ?? [],
  );
  protected readonly loading = signal(true);
  protected readonly exporting = signal(false);
  protected readonly notice = signal('');
  protected readonly error = signal('');
  private generation = 0;

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe(() => {
      void this.load();
    });
  }
  ngOnDestroy(): void {
    this.generation++;
    this.metadata.clear();
  }

  private async load(): Promise<void> {
    const generation = ++this.generation;
    this.metadata.clear();
    this.metadata.prepare();
    this.board.set(null);
    this.loading.set(true);
    this.error.set('');
    try {
      const slug = this.route.snapshot.paramMap.get('publicSlug') ?? '';
      const board = await this.api.getPublic(slug);
      if (generation !== this.generation) return;
      this.board.set(board);
      const canonicalUrl = `${this.document.location.origin}/tier-lists/public/${encodeURIComponent(slug)}`;
      const description =
        board.description || `Explore ${board.itemCount} ranked titles in ${board.title}.`;
      const items = board.tiers.flatMap((row) => row.items);
      const imageUrl = items.find((item) => item.posterUrl)?.posterUrl;
      this.metadata.set({
        title: `${board.title} · Drama Watch`,
        description,
        canonicalUrl,
        allowIndexing: board.visibility === 'public',
        ...(imageUrl ? { imageUrl } : {}),
        structuredData: buildCollectionStructuredData({
          name: board.title,
          description,
          canonicalUrl,
          itemCount: board.itemCount,
          items,
        }),
      });
    } catch (error) {
      if (generation === this.generation)
        this.error.set(
          readApiErrorMessage(error, 'This tier list is private, deleted, or unavailable.'),
        );
    } finally {
      if (generation === this.generation) this.loading.set(false);
    }
  }

  protected async export(share = false): Promise<void> {
    const board = this.board();
    if (!board || this.exporting()) return;
    this.exporting.set(true);
    try {
      this.notice.set(await this.exporter.export(board, share));
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'PNG export failed.');
    } finally {
      this.exporting.set(false);
    }
  }
}
