import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { readApiErrorMessage } from '../../../../core/api/api-error';
import { NotificationsService } from '../../data-access/notifications.service';
import {
  NotificationItem,
  NotificationType,
} from '../../models/notification';

@Component({
  selector: 'app-notifications-page',
  imports: [DatePipe, RouterLink],
  templateUrl: './notifications-page.html',
  styleUrl: './notifications-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationsPage implements OnInit {
  protected readonly notifications = inject(NotificationsService);
  protected readonly isLoading = signal(true);
  protected readonly activeId = signal<string | null>(null);
  protected readonly isMarkingAll = signal(false);
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    void this.load();
  }

  protected message(notification: NotificationItem): string {
    const actor =
      notification.actor?.name ??
      notification.actor?.displayUsername ??
      'Someone';

    switch (notification.type) {
      case 'friend_request':
        return `${actor} sent you a friend request.`;
      case 'friend_request_accepted':
        return `${actor} accepted your friend request.`;
      case 'suggestion_received':
        return `${actor} suggested a title for you.`;
      case 'shared_list_invite':
        return `${actor} invited you to a shared list.`;
      case 'shared_list_comment':
        return `${actor} commented on a shared title.`;
      case 'comment_reply':
        return `${actor} replied to your comment.`;
      case 'wheel_invite':
        return `${actor} shared a wheel with you.`;
      case 'shared_item_updated':
        return `${actor} updated a shared title.`;
    }
  }

  protected label(type: NotificationType): string {
    switch (type) {
      case 'friend_request':
        return 'Friend request';
      case 'friend_request_accepted':
        return 'New friend';
      case 'suggestion_received':
        return 'Recommendation';
      case 'shared_list_invite':
        return 'List invitation';
      case 'shared_list_comment':
        return 'New comment';
      case 'comment_reply':
        return 'Reply';
      case 'wheel_invite':
        return 'Shared wheel';
      case 'shared_item_updated':
        return 'Shared update';
    }
  }

  protected target(notification: NotificationItem): string {
    switch (notification.type) {
      case 'friend_request':
      case 'friend_request_accepted':
        return '/friends';
      case 'suggestion_received':
        return '/suggestions';
      case 'wheel_invite':
        return notification.entityId
          ? `/wheels/${notification.entityId}`
          : '/wheels';
      case 'shared_list_invite':
      case 'shared_list_comment':
      case 'comment_reply':
      case 'shared_item_updated':
        return notification.entityId
          ? `/lists/${notification.entityId}`
          : '/lists';
      default:
        return '/notifications';
    }
  }

  protected markRead(notification: NotificationItem): void {
    if (notification.isRead || this.activeId() !== null) {
      return;
    }

    this.activeId.set(notification.id);
    this.error.set(null);
    void this.notifications
      .markRead(notification.id)
      .catch((error: unknown) => {
        this.error.set(
          readApiErrorMessage(
            error,
            'The notification could not be updated.',
          ),
        );
      })
      .finally(() => {
        this.activeId.set(null);
      });
  }

  protected async markAllRead(): Promise<void> {
    if (this.isMarkingAll() || this.notifications.unreadCount() === 0) {
      return;
    }

    this.isMarkingAll.set(true);
    this.error.set(null);

    try {
      await this.notifications.markAllRead();
    } catch (error: unknown) {
      this.error.set(
        readApiErrorMessage(
          error,
          'Notifications could not be marked as read.',
        ),
      );
    } finally {
      this.isMarkingAll.set(false);
    }
  }

  private async load(): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      await this.notifications.refresh();
    } catch (error: unknown) {
      this.error.set(
        readApiErrorMessage(
          error,
          'Notifications are unavailable right now.',
        ),
      );
    } finally {
      this.isLoading.set(false);
    }
  }
}
