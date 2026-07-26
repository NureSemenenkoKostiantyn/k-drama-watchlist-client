import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';

import { NotificationsOverview } from '../models/notification';
import { NotificationsService } from './notifications.service';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let http: HttpTestingController;
  const overview: NotificationsOverview = {
    unreadCount: 1,
    items: [
      {
        id: 'notification-1',
        type: 'friend_request',
        isRead: false,
        createdAt: '2026-07-26T12:00:00.000Z',
      },
    ],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(NotificationsService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('loads unread state and marks one notification read', async () => {
    const refresh = service.refresh();
    http.expectOne('/api/notifications').flush(overview);
    await refresh;

    expect(service.unreadCount()).toBe(1);

    const markRead = service.markRead('notification-1');
    http
      .expectOne('/api/notifications/notification-1/read')
      .flush(null);
    await markRead;

    expect(service.unreadCount()).toBe(0);
    expect(service.items()[0]?.isRead).toBe(true);
  });

  it('marks all unread notifications read', async () => {
    const refresh = service.refresh();
    http.expectOne('/api/notifications').flush(overview);
    await refresh;

    const markAll = service.markAllRead();
    http
      .expectOne('/api/notifications/read-all')
      .flush({ updatedCount: 1 });

    await expect(markAll).resolves.toBe(1);
    expect(service.unreadCount()).toBe(0);
  });

  it('does not restore a previous account after state is cleared', async () => {
    const refresh = service.refresh();
    service.clear();
    http.expectOne('/api/notifications').flush(overview);
    await refresh;

    expect(service.items()).toEqual([]);
    expect(service.unreadCount()).toBe(0);
  });
});
