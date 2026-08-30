import { signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

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

  beforeEach(async () => {
    createLink.mockClear();
    connection.set({
      enabled: true,
      connected: false,
      botUsername: 'DramaWatchBot',
    });

    await TestBed.configureTestingModule({
      imports: [TelegramConnectionSettingsComponent],
      providers: [
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

