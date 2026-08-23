import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
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
export class PublicSharedListPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly publicLists = inject(PublicSharedListsService);
  protected readonly list = signal<PublicSharedListDetails | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    void this.load();
  }

  private async load(): Promise<void> {
    const publicSlug = this.route.snapshot.paramMap.get('publicSlug') ?? '';
    if (!publicSlug) {
      this.error.set('This shared-list link is invalid.');
      this.loading.set(false);
      return;
    }
    try {
      this.list.set(await this.publicLists.get(publicSlug));
    } catch (error: unknown) {
      this.error.set(
        error instanceof Error ? error.message : 'This shared list is unavailable.',
      );
    } finally {
      this.loading.set(false);
    }
  }
}
