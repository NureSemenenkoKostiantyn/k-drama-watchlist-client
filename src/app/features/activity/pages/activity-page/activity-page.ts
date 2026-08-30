import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { MediaPoster } from '../../../../shared/components/media-poster/media-poster';
import { PageState } from '../../../../shared/components/page-state/page-state';
import { Pagination } from '../../../../shared/components/pagination/pagination';
import { PublicUserLink } from '../../../../shared/components/public-user-link/public-user-link';
import { UserAvatar } from '../../../../shared/components/user-avatar/user-avatar';
import { ActivityService } from '../../data-access/activity.service';
import { ActivityFeed, ActivityFeedItem } from '../../models/activity';

@Component({
  selector: 'app-activity-page',
  imports: [DatePipe, RouterLink, MediaPoster, PageState, Pagination, PublicUserLink, UserAvatar],
  templateUrl: './activity-page.html',
  styleUrl: './activity-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityPage implements OnInit {
  private readonly activityService = inject(ActivityService);
  protected readonly feed = signal<ActivityFeed | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly requestedPage = signal(1);

  ngOnInit(): void {
    void this.loadPage(1);
  }

  protected load(page: number): void {
    if (page < 1 || (this.loading() && this.feed() !== null)) return;
    void this.loadPage(page);
  }

  protected message(item: ActivityFeedItem): string {
    if (item.type === 'library_added') {
      return item.status === 'watching'
        ? 'started watching'
        : item.status === 'watched'
          ? 'added as watched'
          : 'added to their watchlist';
    }
    if (item.type === 'library_rated') {
      return `rated ${item.rating?.toFixed(1) ?? '—'} / 10`;
    }
    if (item.status === 'watching') return 'started watching';
    if (item.status === 'watched') return 'finished watching';
    return 'moved back to their watchlist';
  }

  private async loadPage(page: number): Promise<void> {
    this.requestedPage.set(page);
    this.loading.set(true);
    this.error.set(null);
    try {
      this.feed.set(await this.activityService.list(page));
    } catch (error: unknown) {
      this.error.set(
        error instanceof Error ? error.message : 'Friend activity could not be loaded.',
      );
    } finally {
      this.loading.set(false);
    }
  }
}
