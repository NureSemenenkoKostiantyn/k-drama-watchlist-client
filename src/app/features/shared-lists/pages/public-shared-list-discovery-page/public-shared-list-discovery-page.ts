import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { Meta } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';

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
  private readonly meta = inject(Meta);
  protected readonly result = signal<PublicSharedListDiscovery | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly requestedPage = signal(1);

  ngOnInit(): void {
    this.meta.updateTag({ name: 'robots', content: 'index, follow' });
    this.meta.updateTag({
      name: 'description',
      content: 'Discover public drama and movie watchlists created by the Drama Watch community.',
    });
    void this.load(1);
  }

  ngOnDestroy(): void {
    this.meta.removeTag("name='robots'");
    this.meta.removeTag("name='description'");
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
      this.result.set(await this.publicLists.discover(page));
    } catch (error: unknown) {
      this.error.set(
        error instanceof Error ? error.message : 'Public watchlists could not be loaded.',
      );
    } finally {
      this.loading.set(false);
    }
  }
}
