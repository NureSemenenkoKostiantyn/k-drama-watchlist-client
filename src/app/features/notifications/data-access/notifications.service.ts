import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../../environments/environment';
import {
  MarkAllNotificationsResponse,
  NotificationItem,
  NotificationsOverview,
} from '../models/notification';

const EMPTY_OVERVIEW: NotificationsOverview = {
  items: [],
  unreadCount: 0,
};

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/notifications`;
  private readonly overviewState =
    signal<NotificationsOverview>(EMPTY_OVERVIEW);
  private refreshInFlight: Promise<NotificationsOverview> | null = null;
  private stateVersion = 0;

  readonly items = computed(() => this.overviewState().items);
  readonly unreadCount = computed(
    () => this.overviewState().unreadCount,
  );

  refresh(): Promise<NotificationsOverview> {
    if (this.refreshInFlight) {
      return this.refreshInFlight;
    }

    const refreshVersion = this.stateVersion;
    const request = firstValueFrom(
      this.http.get<NotificationsOverview>(this.baseUrl),
    )
      .then((overview) => {
        if (this.stateVersion === refreshVersion) {
          this.overviewState.set(overview);
        }
        return overview;
      })
      .finally(() => {
        if (this.refreshInFlight === request) {
          this.refreshInFlight = null;
        }
      });
    this.refreshInFlight = request;
    return request;
  }

  async markRead(notificationId: string): Promise<void> {
    const current = this.overviewState().items.find(
      (item) => item.id === notificationId,
    );

    if (current?.isRead) {
      return;
    }

    await firstValueFrom(
      this.http.post<void>(
        `${this.baseUrl}/${notificationId}/read`,
        {},
      ),
    );
    const readAt = new Date().toISOString();
    this.overviewState.update((overview) => ({
      items: overview.items.map((item) =>
        item.id === notificationId
          ? { ...item, isRead: true, readAt }
          : item,
      ),
      unreadCount: Math.max(0, overview.unreadCount - 1),
    }));
  }

  async markAllRead(): Promise<number> {
    if (this.overviewState().unreadCount === 0) {
      return 0;
    }

    const response = await firstValueFrom(
      this.http.post<MarkAllNotificationsResponse>(
        `${this.baseUrl}/read-all`,
        {},
      ),
    );
    const readAt = new Date().toISOString();
    this.overviewState.update((overview) => ({
      items: overview.items.map((item): NotificationItem =>
        item.isRead ? item : { ...item, isRead: true, readAt },
      ),
      unreadCount: 0,
    }));
    return response.updatedCount;
  }

  clear(): void {
    this.stateVersion += 1;
    this.refreshInFlight = null;
    this.overviewState.set(EMPTY_OVERVIEW);
  }
}
