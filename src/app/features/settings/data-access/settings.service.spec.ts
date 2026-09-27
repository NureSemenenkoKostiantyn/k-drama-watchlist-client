import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { SettingsService } from './settings.service';

describe('SettingsService', () => {
  let service: SettingsService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(SettingsService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('loads and updates reusable user settings', async () => {
    const loaded = service.load();
    http.expectOne('/api/settings').flush({
      libraryVisibility: 'private',
      activityVisibility: 'private',
      telegramNotifications: { friendRequests: false, titleSuggestions: false },
    });
    await expect(loaded).resolves.toEqual({
      libraryVisibility: 'private',
      activityVisibility: 'private',
      telegramNotifications: { friendRequests: false, titleSuggestions: false },
    });
    expect(service.libraryVisibility()).toBe('private');
    expect(service.activityVisibility()).toBe('private');

    const updated = service.updateLibraryVisibility('friends');
    const request = http.expectOne('/api/settings');
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({
      libraryVisibility: 'friends',
    });
    request.flush({
      libraryVisibility: 'friends',
      activityVisibility: 'private',
      telegramNotifications: { friendRequests: false, titleSuggestions: false },
    });

    await expect(updated).resolves.toEqual({
      libraryVisibility: 'friends',
      activityVisibility: 'private',
      telegramNotifications: { friendRequests: false, titleSuggestions: false },
    });
    expect(service.libraryVisibility()).toBe('friends');

    const notificationsUpdated = service.updateTelegramFriendRequestNotifications(true);
    const notificationRequest = http.expectOne('/api/settings');
    expect(notificationRequest.request.method).toBe('PATCH');
    expect(notificationRequest.request.body).toEqual({
      telegramNotifications: { friendRequests: true },
    });
    notificationRequest.flush({
      libraryVisibility: 'friends',
      activityVisibility: 'private',
      telegramNotifications: { friendRequests: true, titleSuggestions: false },
    });
    await expect(notificationsUpdated).resolves.toMatchObject({
      telegramNotifications: { friendRequests: true },
    });
    expect(service.telegramFriendRequestNotifications()).toBe(true);

    const suggestionsUpdated = service.updateTelegramTitleSuggestionNotifications(true);
    const suggestionRequest = http.expectOne('/api/settings');
    expect(suggestionRequest.request.method).toBe('PATCH');
    expect(suggestionRequest.request.body).toEqual({
      telegramNotifications: { titleSuggestions: true },
    });
    suggestionRequest.flush({
      libraryVisibility: 'friends',
      activityVisibility: 'private',
      telegramNotifications: { friendRequests: true, titleSuggestions: true },
    });
    await expect(suggestionsUpdated).resolves.toMatchObject({
      telegramNotifications: { titleSuggestions: true },
    });
    expect(service.telegramTitleSuggestionNotifications()).toBe(true);
  });

  it('does not restore settings from a request started before session state was cleared', async () => {
    const loaded = service.load();
    const request = http.expectOne('/api/settings');

    service.clear();
    request.flush({
      libraryVisibility: 'public',
      activityVisibility: 'friends',
      telegramNotifications: { friendRequests: true, titleSuggestions: true },
    });

    await expect(loaded).resolves.toEqual({
      libraryVisibility: 'public',
      activityVisibility: 'friends',
      telegramNotifications: { friendRequests: true, titleSuggestions: true },
    });
    expect(service.settings()).toBeNull();
    expect(service.libraryVisibility()).toBe('private');
    expect(service.activityVisibility()).toBe('private');
    expect(service.isLoading()).toBe(false);
  });
});
