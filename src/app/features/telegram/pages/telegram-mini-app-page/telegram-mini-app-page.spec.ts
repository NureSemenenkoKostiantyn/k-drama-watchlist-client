import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';

import { TelegramService } from '../../data-access/telegram.service';
import { TelegramMiniAppPage } from './telegram-mini-app-page';

describe('TelegramMiniAppPage', () => {
  const authenticateMiniApp = vi.fn().mockResolvedValue({
    account: {
      id: '507f1f77bcf86cd799439011',
      username: 'demo_viewer',
      displayUsername: 'Demo_Viewer',
      name: 'Demo Viewer',
      joinedAt: '2026-01-01T00:00:00.000Z',
    },
    telegramDisplayName: 'Demo Viewer',
  });
  const loadMiniAppLibrary = vi.fn().mockResolvedValue([]);
  const originalTelegram = Object.getOwnPropertyDescriptor(window, 'Telegram');

  beforeEach(async () => {
    authenticateMiniApp.mockClear();
    loadMiniAppLibrary.mockClear();
    Object.defineProperty(window, 'Telegram', {
      configurable: true,
      value: undefined,
    });

    await TestBed.configureTestingModule({
      imports: [TelegramMiniAppPage],
      providers: [
        provideRouter([]),
        {
          provide: TelegramService,
          useValue: {
            authenticateMiniApp,
            loadMiniAppLibrary,
          },
        },
      ],
    }).compileComponents();
  });

  afterAll(() => {
    if (originalTelegram) {
      Object.defineProperty(window, 'Telegram', originalTelegram);
      return;
    }

    Reflect.deleteProperty(window, 'Telegram');
  });

  it('does not treat the loaded SDK alone as a Mini App launch', async () => {
    const ready = vi.fn();
    const expand = vi.fn();
    setTelegramWebApp({ initData: '', ready, expand });

    const fixture = TestBed.createComponent(TelegramMiniAppPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(ready).not.toHaveBeenCalled();
    expect(expand).not.toHaveBeenCalled();
    expect(authenticateMiniApp).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain(
      'This page is designed to open inside the Drama Watch Telegram bot.',
    );
  });

  it('initializes when Telegram provides signed launch data', async () => {
    const ready = vi.fn();
    const expand = vi.fn();
    setTelegramWebApp({ initData: 'auth_date=1&hash=signed', ready, expand });

    const fixture = TestBed.createComponent(TelegramMiniAppPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(ready).toHaveBeenCalledOnce();
    expect(expand).toHaveBeenCalledOnce();
    expect(authenticateMiniApp).toHaveBeenCalledWith('auth_date=1&hash=signed');
    expect(loadMiniAppLibrary).toHaveBeenCalledOnce();
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('Connected as');
    });
  });
});

function setTelegramWebApp(webApp: {
  initData: string;
  ready: () => void;
  expand: () => void;
}): void {
  Object.defineProperty(window, 'Telegram', {
    configurable: true,
    value: { WebApp: webApp },
  });
}
