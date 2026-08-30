import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  OnInit,
  signal,
} from '@angular/core';

import { readApiErrorMessage } from '../../../../core/api/api-error';
import { PageState } from '../../../../shared/components/page-state/page-state';
import { PublicUserLink } from '../../../../shared/components/public-user-link/public-user-link';
import { FriendsService } from '../../data-access/friends.service';
import { MediaFriendActivity } from '../../models/friendship';

@Component({
  selector: 'app-media-friend-context',
  imports: [PageState, PublicUserLink],
  templateUrl: './media-friend-context.html',
  styleUrl: './media-friend-context.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MediaFriendContextComponent implements OnInit {
  private readonly friendsService = inject(FriendsService);

  readonly mediaType = input.required<'movie' | 'tv'>();
  readonly tmdbId = input.required<number>();

  protected readonly activities = signal<MediaFriendActivity[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly averageRating = computed(() => {
    const ratings = this.activities().flatMap((activity) =>
      activity.rating === undefined ? [] : [activity.rating],
    );

    if (ratings.length === 0) {
      return null;
    }

    return (
      ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
    ).toFixed(1);
  });

  ngOnInit(): void {
    void this.load();
  }

  protected statusLabel(status: MediaFriendActivity['status']): string {
    if (status === 'to_watch') {
      return 'Wants to watch';
    }

    return status === 'watching' ? 'Watching' : 'Watched';
  }

  private async load(): Promise<void> {
    try {
      const context = await this.friendsService.mediaContext(
        this.mediaType(),
        this.tmdbId(),
      );
      this.activities.set(context.friends);
    } catch (error: unknown) {
      this.error.set(
        readApiErrorMessage(
          error,
          'Friend activity is unavailable right now.',
        ),
      );
    } finally {
      this.isLoading.set(false);
    }
  }
}
