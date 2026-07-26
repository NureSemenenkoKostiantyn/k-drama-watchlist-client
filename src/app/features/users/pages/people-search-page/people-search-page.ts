import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { readApiErrorMessage } from '../../../../core/api/api-error';
import { FriendsService } from '../../../friends/data-access/friends.service';
import {
  Friendship,
  FriendshipsOverview,
} from '../../../friends/models/friendship';
import { UsersService } from '../../data-access/users.service';
import { PublicUserProfile } from '../../models/public-user-profile';

@Component({
  selector: 'app-people-search-page',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './people-search-page.html',
  styleUrls: [
    './people-search-page.scss',
    './people-search-page-relationships.scss',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PeopleSearchPage implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly users = inject(UsersService);
  private readonly friends = inject(FriendsService);
  protected readonly results = signal<PublicUserProfile[]>([]);
  protected readonly friendships = signal<FriendshipsOverview>(
    emptyFriendships(),
  );
  protected readonly isLoading = signal(false);
  protected readonly isLoadingFriendships = signal(true);
  protected readonly activeAction = signal<string | null>(null);
  protected readonly hasSearched = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly friendshipError = signal<string | null>(null);
  protected readonly notice = signal<string | null>(null);
  protected readonly searchForm = this.formBuilder.nonNullable.group({
    query: [
      '',
      [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(50),
        Validators.pattern(/^[\p{L}\p{M}\p{N} ._'’-]+$/u),
      ],
    ],
  });

  ngOnInit(): void {
    void this.loadFriendships();
  }

  protected async search(): Promise<void> {
    if (this.searchForm.invalid || this.isLoading()) {
      this.searchForm.markAllAsTouched();
      return;
    }

    const query = this.searchForm.controls.query.value.trim();
    this.isLoading.set(true);
    this.hasSearched.set(true);
    this.error.set(null);

    try {
      this.results.set(await this.users.search(query));
    } catch (error: unknown) {
      this.results.set([]);
      this.error.set(
        readApiErrorMessage(
          error,
          'People search is unavailable right now. Please try again.',
        ),
      );
    } finally {
      this.isLoading.set(false);
    }
  }

  protected relationshipFor(userId: string): Friendship | null {
    const overview = this.friendships();
    return (
      overview.friends.find((item) => item.user.id === userId) ??
      overview.incomingRequests.find(
        (item) => item.user.id === userId,
      ) ??
      overview.outgoingRequests.find(
        (item) => item.user.id === userId,
      ) ??
      null
    );
  }

  protected async requestFriend(
    profile: PublicUserProfile,
  ): Promise<void> {
    await this.runAction(profile.id, async () => {
      const friendship = await this.friends.request(profile.username);
      this.friendships.update((overview) => ({
        ...overview,
        outgoingRequests: [
          friendship,
          ...overview.outgoingRequests,
        ],
      }));
      this.notice.set(`Friend request sent to @${profile.displayUsername}.`);
    });
  }

  protected async acceptFriendship(
    friendship: Friendship,
  ): Promise<void> {
    await this.runAction(friendship.id, async () => {
      const accepted = await this.friends.accept(friendship.id);
      this.friendships.update((overview) => ({
        ...overview,
        friends: [accepted, ...overview.friends],
        incomingRequests: overview.incomingRequests.filter(
          (item) => item.id !== friendship.id,
        ),
      }));
      this.notice.set(`You and @${friendship.user.displayUsername} are now friends.`);
    });
  }

  protected async rejectFriendship(
    friendship: Friendship,
  ): Promise<void> {
    await this.runAction(friendship.id, async () => {
      await this.friends.reject(friendship.id);
      this.removeFromOverview(friendship.id);
      this.notice.set('Friend request declined.');
    });
  }

  protected async removeFriendship(
    friendship: Friendship,
  ): Promise<void> {
    await this.runAction(friendship.id, async () => {
      await this.friends.delete(friendship.id);
      this.removeFromOverview(friendship.id);
      this.notice.set(
        friendship.status === 'accepted'
          ? `@${friendship.user.displayUsername} was removed from your friends.`
          : 'Friend request cancelled.',
      );
    });
  }

  protected isActing(key: string): boolean {
    return this.activeAction() === key;
  }

  protected initials(profile: PublicUserProfile): string {
    return profile.name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toLocaleUpperCase())
      .join('');
  }

  private async loadFriendships(): Promise<void> {
    this.isLoadingFriendships.set(true);
    this.friendshipError.set(null);

    try {
      this.friendships.set(await this.friends.list());
    } catch (error: unknown) {
      this.friendshipError.set(
        readApiErrorMessage(
          error,
          'Your friendships are unavailable right now. Please try again.',
        ),
      );
    } finally {
      this.isLoadingFriendships.set(false);
    }
  }

  private async runAction(
    key: string,
    action: () => Promise<void>,
  ): Promise<void> {
    if (this.activeAction() !== null) {
      return;
    }

    this.activeAction.set(key);
    this.friendshipError.set(null);
    this.notice.set(null);

    try {
      await action();
    } catch (error: unknown) {
      this.friendshipError.set(
        readApiErrorMessage(
          error,
          'The friendship could not be updated. Please try again.',
        ),
      );
    } finally {
      this.activeAction.set(null);
    }
  }

  private removeFromOverview(friendshipId: string): void {
    this.friendships.update((overview) => ({
      friends: overview.friends.filter(
        (item) => item.id !== friendshipId,
      ),
      incomingRequests: overview.incomingRequests.filter(
        (item) => item.id !== friendshipId,
      ),
      outgoingRequests: overview.outgoingRequests.filter(
        (item) => item.id !== friendshipId,
      ),
    }));
  }
}

function emptyFriendships(): FriendshipsOverview {
  return {
    friends: [],
    incomingRequests: [],
    outgoingRequests: [],
  };
}
