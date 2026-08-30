import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { TelegramService } from './telegram.service';

describe('TelegramService', () => {
  let service: TelegramService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(TelegramService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads connection state and creates a short-lived bot link', async () => {
    const load = service.load();
    const loadRequest = http.expectOne('/api/telegram/connection');
    expect(loadRequest.request.method).toBe('GET');
    loadRequest.flush({
      enabled: true,
      connected: false,
      botUsername: 'DramaWatchBot',
    });

    await expect(load).resolves.toEqual({
      enabled: true,
      connected: false,
      botUsername: 'DramaWatchBot',
    });

    const create = service.createLink();
    const createRequest = http.expectOne('/api/telegram/link');
    expect(createRequest.request.method).toBe('POST');
    expect(createRequest.request.body).toEqual({});
    createRequest.flush({
      deepLink: 'https://t.me/DramaWatchBot?start=link_token',
      expiresAt: '2026-08-30T13:20:00.000Z',
    });

    await expect(create).resolves.toEqual({
      deepLink: 'https://t.me/DramaWatchBot?start=link_token',
      expiresAt: '2026-08-30T13:20:00.000Z',
    });
  });

  it('clears connected identity after disconnecting', async () => {
    const load = service.load();
    http.expectOne('/api/telegram/connection').flush({
      enabled: true,
      connected: true,
      botUsername: 'DramaWatchBot',
      telegramUsername: 'viewer',
    });
    await load;

    const disconnect = service.disconnect();
    const request = http.expectOne('/api/telegram/connection');
    expect(request.request.method).toBe('DELETE');
    request.flush(null);

    await expect(disconnect).resolves.toBe(true);
    expect(service.connection()).toEqual({
      enabled: true,
      connected: false,
      botUsername: 'DramaWatchBot',
      miniAppUrl: undefined,
    });
  });
});

