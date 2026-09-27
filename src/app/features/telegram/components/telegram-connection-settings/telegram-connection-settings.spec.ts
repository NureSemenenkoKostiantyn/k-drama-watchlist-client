import { signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { SettingsService } from '../../../settings/data-access/settings.service';
import { TelegramService } from '../../data-access/telegram.service';
import { TelegramConnectionSettingsComponent } from './telegram-connection-settings';

describe('TelegramConnectionSettingsComponent', () => {
  const connection = signal({
    enabled: true,
    connected: false,
    botUsername: 'DramaWatchBot',
  });
  const createLink = vi.fn().mockResolvedValue({
    deepLink: 'https://t.me/DramaWatchBot?start=link_token',
    expiresAt: '2026-08-30T13:20:00.000Z',
  });
  const friendRequestNotifications = signal(false);
  const titleSuggestionNotifications = signal(false);
  const updateTelegramFriendRequestNotifications = vi.fn().mockResolvedValue({
    libraryVisibility: 'private',
    activityVisibility: 'private',
    telegramNotifications: { friendRequests: true, titleSuggestions: false },
  });
  const updateTelegramTitleSuggestionNotifications = vi.fn().mockResolvedValue({
    libraryVisibility: 'private',
    activityVisibility: 'private',
    telegramNotifications: { friendRequests: false, titleSuggestions: true },
  });

  beforeEach(async () => {
    createLink.mockClear();
    updateTelegramFriendRequestNotifications.mockClear();
    updateTelegramTitleSuggestionNotifications.mockClear();
    friendRequestNotifications.set(false);
    titleSuggestionNotifications.set(false);
    connection.set({
      enabled: true,
      connected: false,
      botUsername: 'DramaWatchBot',
    });

    await TestBed.configureTestingModule({
      imports: [TelegramConnectionSettingsComponent],
      providers: [
        {
          provide: SettingsService,
          useValue: {
            telegramFriendRequestNotifications: friendRequestNotifications.asReadonly(),
            telegramTitleSuggestionNotifications: titleSuggestionNotifications.asReadonly(),
            isLoading: signal(false).asReadonly(),
            error: signal<string | null>(null).asReadonly(),
            load: vi.fn().mockResolvedValue({
              libraryVisibility: 'private',
              activityVisibility: 'private',
              telegramNotifications: { friendRequests: false, titleSuggestions: false },
            }),
            updateTelegramFriendRequestNotifications,
            updateTelegramTitleSuggestionNotifications,
          },
        },
        {
          provide: TelegramService,
          useValue: {
            connection: connection.asReadonly(),
            isLoading: signal(false).asReadonly(),
            error: signal<string | null>(null).asReadonly(),
            load: vi.fn().mockResolvedValue(connection()),
            createLink,
            disconnect: vi.fn().mockResolvedValue(true),
          },
        },
      ],
    }).compileComponents();
  });

  it('saves explicit title suggestion notification consent independently', async () => {
    connection.set({
      enabled: true,
      connected: true,
      botUsername: 'DramaWatchBot',
    });
    const fixture = TestBed.createComponent(TelegramConnectionSettingsComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const checkboxes = fixture.debugElement.queryAll(
      By.css('.telegram-settings__notifications input'),
    );
    const checkbox = checkboxes[1].nativeElement as HTMLInputElement;
    checkbox.checked = true;
    checkbox.dispatchEvent(new Event('change', { bubbles: true }));
    await fixture.whenStable();

    expect(updateTelegramTitleSuggestionNotifications).toHaveBeenCalledWith(true);
    expect(updateTelegramFriendRequestNotifications).not.toHaveBeenCalled();
  });

  it('saves explicit friend request notification consent for a connected account', async () => {
    connection.set({
      enabled: true,
      connected: true,
      botUsername: 'DramaWatchBot',
    });
    const fixture = TestBed.createComponent(TelegramConnectionSettingsComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const checkbox = fixture.debugElement.query(
      By.css('.telegram-settings__notifications input'),
    ).nativeElement as HTMLInputElement;
    checkbox.checked = true;
    checkbox.dispatchEvent(new Event('change', { bubbles: true }));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(updateTelegramFriendRequestNotifications).toHaveBeenCalledWith(true);
    expect(fixture.nativeElement.textContent).toContain(
      'Telegram notification preference saved.',
    );
  });

  it('creates a one-time link before offering to open Telegram', async () => {
    const fixture = TestBed.createComponent(TelegramConnectionSettingsComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const button = fixture.debugElement.query(By.css('app-button')).nativeElement as HTMLElement;
    button.click();
    await fixture.whenStable();
    fixture.detectChanges();

    const link = fixture.debugElement.query(By.css('.telegram-settings__connect'))
      .nativeElement as HTMLAnchorElement;
    expect(createLink).toHaveBeenCalledOnce();
    expect(link.href).toContain('t.me/DramaWatchBot?start=link_token');
    expect(link.textContent).toContain('Continue in Telegram');
  });
});

