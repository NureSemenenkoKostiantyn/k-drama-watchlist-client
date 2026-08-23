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
    });
    await expect(loaded).resolves.toEqual({
      libraryVisibility: 'private',
      activityVisibility: 'private',
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
    });

    await expect(updated).resolves.toEqual({
      libraryVisibility: 'friends',
      activityVisibility: 'private',
    });
    expect(service.libraryVisibility()).toBe('friends');
  });

  it('does not restore settings from a request started before session state was cleared', async () => {
    const loaded = service.load();
    const request = http.expectOne('/api/settings');

    service.clear();
    request.flush({
      libraryVisibility: 'public',
      activityVisibility: 'friends',
    });

    await expect(loaded).resolves.toEqual({
      libraryVisibility: 'public',
      activityVisibility: 'friends',
    });
    expect(service.settings()).toBeNull();
    expect(service.libraryVisibility()).toBe('private');
    expect(service.activityVisibility()).toBe('private');
    expect(service.isLoading()).toBe(false);
  });
});
