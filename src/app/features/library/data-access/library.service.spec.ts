import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { LibraryEntry } from '../models/library';
import { LibraryService } from './library.service';

describe('LibraryService', () => {
  let service: LibraryService;
  let http: HttpTestingController;

  const entry: LibraryEntry = {
    id: 'entry-1',
    mediaId: 'media-1',
    status: 'to_watch',
    media: {
      id: 'tv:1',
      tmdbId: 1,
      mediaType: 'tv',
      title: 'Goblin',
      originalTitle: '도깨비',
      originCountry: ['KR'],
      genreIds: [18],
    },
    createdAt: '2026-07-23T20:00:00.000Z',
    updatedAt: '2026-07-23T20:00:00.000Z',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(LibraryService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('loads the current user library', async () => {
    const result = service.load();
    const request = http.expectOne('/api/library');

    expect(request.request.method).toBe('GET');
    request.flush([entry]);

    await expect(result).resolves.toBe(true);
    expect(service.entries()).toEqual([entry]);
    expect(service.entryFor('tv', 1)).toEqual(entry);
  });

  it('creates a relationship for new media and updates its status later', async () => {
    const createResult = service.setStatus('tv', 1, 'to_watch');
    const createRequest = http.expectOne('/api/library');

    expect(createRequest.request.method).toBe('POST');
    expect(createRequest.request.body).toEqual({
      mediaType: 'tv',
      tmdbId: 1,
      status: 'to_watch',
    });
    createRequest.flush(entry);
    await expect(createResult).resolves.toEqual(entry);

    const updatedEntry: LibraryEntry = {
      ...entry,
      status: 'watching',
    };
    const updateResult = service.setStatus('tv', 1, 'watching');
    const updateRequest = http.expectOne('/api/library/entry-1/status');

    expect(updateRequest.request.method).toBe('PATCH');
    expect(updateRequest.request.body).toEqual({ status: 'watching' });
    updateRequest.flush(updatedEntry);

    await expect(updateResult).resolves.toEqual(updatedEntry);
    expect(service.entries()[0]?.status).toBe('watching');
  });

  it('removes only the personal relationship', async () => {
    const loadResult = service.load();
    http.expectOne('/api/library').flush([entry]);
    await loadResult;

    const removeResult = service.remove(entry.id);
    const request = http.expectOne('/api/library/entry-1');

    expect(request.request.method).toBe('DELETE');
    request.flush(null);

    await expect(removeResult).resolves.toBe(true);
    expect(service.entries()).toEqual([]);
  });
});
