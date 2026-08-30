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

  it('authenticates a Mini App request with raw Telegram init data', async () => {
    const authentication = service.authenticateMiniApp('query_id=test&hash=signed');
    const request = http.expectOne('/api/telegram/mini-app/session');

    expect(request.request.method).toBe('POST');
    expect(request.request.headers.get('X-Telegram-Init-Data')).toBe(
      'query_id=test&hash=signed',
    );
    request.flush({
      account: {
        id: '507f1f77bcf86cd799439011',
        username: 'demo_viewer',
        displayUsername: 'Demo_Viewer',
        name: 'Demo Viewer',
        joinedAt: '2026-01-01T00:00:00.000Z',
      },
      telegramDisplayName: 'Demo Viewer',
    });

    await expect(authentication).resolves.toMatchObject({
      account: { username: 'demo_viewer' },
    });
  });

  it('uses authenticated Mini App data for search and library actions', async () => {
    const authentication = service.authenticateMiniApp('auth_date=1&hash=signed');
    http.expectOne('/api/telegram/mini-app/session').flush({
      account: {
        id: '507f1f77bcf86cd799439011',
        username: 'demo_viewer',
        displayUsername: 'Demo_Viewer',
        name: 'Demo Viewer',
        joinedAt: '2026-01-01T00:00:00.000Z',
      },
      telegramDisplayName: 'Demo Viewer',
    });
    await authentication;

    const library = service.loadMiniAppLibrary();
    const libraryRequest = http.expectOne('/api/telegram/mini-app/library');
    expect(libraryRequest.request.headers.get('X-Telegram-Init-Data')).toBe(
      'auth_date=1&hash=signed',
    );
    libraryRequest.flush([]);
    await expect(library).resolves.toEqual([]);

    const search = service.searchMiniApp('Goblin', 'tv');
    const searchRequest = http.expectOne(
      (request) =>
        request.url === '/api/telegram/mini-app/search' &&
        request.params.get('q') === 'Goblin' &&
        request.params.get('type') === 'tv',
    );
    searchRequest.flush({ page: 1, totalPages: 0, totalResults: 0, results: [] });
    await expect(search).resolves.toMatchObject({ results: [] });

    const media = {
      id: 'tv:1396',
      tmdbId: 1396,
      mediaType: 'tv' as const,
      title: 'Goblin',
      originalTitle: 'Goblin',
      originCountry: ['KR'],
      genreIds: [],
    };
    const add = service.addFromMiniApp(media, 'to_watch');
    const addRequest = http.expectOne('/api/telegram/mini-app/library');
    expect(addRequest.request.method).toBe('POST');
    expect(addRequest.request.body).toEqual({
      mediaType: 'tv',
      tmdbId: 1396,
      status: 'to_watch',
    });
    addRequest.flush({ id: 'entry-1' });
    await expect(add).resolves.toMatchObject({ id: 'entry-1' });

    const status = service.updateMiniAppStatus('entry-1', 'watching');
    const statusRequest = http.expectOne(
      '/api/telegram/mini-app/library/entry-1/status',
    );
    expect(statusRequest.request.body).toEqual({ status: 'watching' });
    statusRequest.flush({ id: 'entry-1', status: 'watching' });
    await status;

    const progress = service.updateMiniAppProgress('entry-1', {
      currentSeason: 1,
      currentEpisode: 2,
      includeSpecials: false,
    });
    const progressRequest = http.expectOne(
      '/api/telegram/mini-app/library/entry-1/progress',
    );
    expect(progressRequest.request.body).toEqual({
      currentSeason: 1,
      currentEpisode: 2,
      includeSpecials: false,
    });
    progressRequest.flush({ id: 'entry-1' });
    await progress;
  });
});
