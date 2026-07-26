import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';

import { NotificationsService } from '../../data-access/notifications.service';
import { NotificationItem } from '../../models/notification';
import { NotificationsPage } from './notifications-page';

describe('NotificationsPage', () => {
  let fixture: ComponentFixture<NotificationsPage>;
  const item = {
    id: 'notification-1',
    type: 'suggestion_received',
    actor: {
      id: 'user-1',
      username: 'dahyun',
      displayUsername: 'Dahyun',
      name: 'Dahyun',
      joinedAt: '2026-07-20T10:00:00.000Z',
    },
    entityId: 'suggestion-1',
    isRead: false,
    createdAt: '2026-07-26T12:00:00.000Z',
  } satisfies NotificationItem;
  const items = signal<NotificationItem[]>([item]);
  const unreadCount = signal(1);
  const refresh = vi.fn().mockResolvedValue({
    items: [item],
    unreadCount: 1,
  });
  const markRead = vi.fn().mockImplementation(() => {
    items.set([{ ...item, isRead: true }]);
    unreadCount.set(0);
    return Promise.resolve();
  });

  beforeEach(async () => {
    items.set([item]);
    unreadCount.set(1);
    refresh.mockClear();
    markRead.mockClear();

    await TestBed.configureTestingModule({
      imports: [NotificationsPage],
      providers: [
        provideRouter([]),
        {
          provide: NotificationsService,
          useValue: {
            items: items.asReadonly(),
            unreadCount: unreadCount.asReadonly(),
            refresh,
            markRead,
            markAllRead: vi.fn().mockResolvedValue(1),
          },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(NotificationsPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('renders and marks a recommendation notification read', async () => {
    const root = fixture.nativeElement as HTMLElement;

    expect(root.textContent).toContain(
      'Dahyun suggested a title for you.',
    );
    expect(root.textContent).toContain('1unread');

    const markReadButton = Array.from(
      root.querySelectorAll<HTMLButtonElement>('article button'),
    )[0];
    markReadButton?.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(markRead).toHaveBeenCalledWith('notification-1');
    expect(root.textContent).toContain('0unread');
  });

  it('links wheel invitations directly to the shared wheel', () => {
    items.set([
      {
        ...item,
        type: 'wheel_invite',
        entityId: 'wheel-1',
      },
    ]);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelector('article a')?.getAttribute('href')).toBe(
      '/wheels/wheel-1',
    );
    expect(root.textContent).toContain('shared a wheel with you');
  });
});
