import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  OnInit,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { readApiErrorMessage } from '../../../../core/api/api-error';
import { FriendsService } from '../../data-access/friends.service';
import { MediaFriendActivity } from '../../models/friendship';

@Component({
  selector: 'app-media-friend-context',
  imports: [RouterLink],
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

  protected initials(activity: MediaFriendActivity): string {
    return (
      activity.user.name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toUpperCase() || '?'
    );
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
