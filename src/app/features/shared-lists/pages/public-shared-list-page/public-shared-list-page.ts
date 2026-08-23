import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';

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
  private readonly meta = inject(Meta);
  private readonly title = inject(Title);
  protected readonly list = signal<PublicSharedListDetails | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.meta.updateTag({ name: 'robots', content: 'noindex, nofollow' });
    void this.load();
  }

  ngOnDestroy(): void {
    this.meta.removeTag("name='robots'");
    this.meta.removeTag("name='description'");
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
      this.title.setTitle(`${list.title} · Drama Watch`);
      this.meta.updateTag({
        name: 'robots',
        content: list.visibility === 'public' ? 'index, follow' : 'noindex, nofollow',
      });
      this.meta.updateTag({
        name: 'description',
        content:
          list.description ??
          `Browse ${list.itemCount} ${list.itemCount === 1 ? 'title' : 'titles'} on ${list.title}.`,
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
