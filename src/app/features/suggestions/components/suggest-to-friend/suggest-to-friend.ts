import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  OnInit,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { readApiErrorMessage } from '../../../../core/api/api-error';
import { FriendsService } from '../../../friends/data-access/friends.service';
import { Friendship } from '../../../friends/models/friendship';
import { MediaDetails } from '../../../search/models/media';
import { SuggestionsService } from '../../data-access/suggestions.service';

@Component({
  selector: 'app-suggest-to-friend',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './suggest-to-friend.html',
  styleUrl: './suggest-to-friend.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuggestToFriend implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly friendsService = inject(FriendsService);
  private readonly suggestionsService = inject(SuggestionsService);

  readonly media = input.required<MediaDetails>();
  protected readonly friends = signal<Friendship[]>([]);
  protected readonly isLoadingFriends = signal(true);
  protected readonly isSending = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly notice = signal<string | null>(null);
  protected readonly form = this.formBuilder.nonNullable.group({
    username: ['', Validators.required],
    message: ['', Validators.maxLength(500)],
  });

  ngOnInit(): void {
    void this.loadFriends();
  }

  protected async send(): Promise<void> {
    if (this.form.invalid || this.isSending()) {
      this.form.markAllAsTouched();
      return;
    }

    const media = this.media();
    const input = this.form.getRawValue();
    this.isSending.set(true);
    this.error.set(null);
    this.notice.set(null);

    try {
      const suggestion = await this.suggestionsService.create({
        username: input.username,
        mediaType: media.mediaType,
        tmdbId: media.tmdbId,
        ...(input.message.trim()
          ? { message: input.message.trim() }
          : {}),
      });
      this.notice.set(
        `${media.title} was suggested to @${suggestion.user.displayUsername}.`,
      );
      this.form.controls.message.setValue('');
    } catch (error: unknown) {
      this.error.set(
        readApiErrorMessage(
          error,
          'The suggestion could not be sent. Please try again.',
        ),
      );
    } finally {
      this.isSending.set(false);
    }
  }

  private async loadFriends(): Promise<void> {
    this.isLoadingFriends.set(true);
    this.error.set(null);

    try {
      const overview = await this.friendsService.list();
      this.friends.set(overview.friends);

      const firstFriend = overview.friends[0];

      if (firstFriend) {
        this.form.controls.username.setValue(
          firstFriend.user.username,
        );
      }
    } catch (error: unknown) {
      this.error.set(
        readApiErrorMessage(
          error,
          'Friends are unavailable right now. Please try again.',
        ),
      );
    } finally {
      this.isLoadingFriends.set(false);
    }
  }
}
