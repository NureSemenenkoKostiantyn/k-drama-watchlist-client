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
    categoryIds: [],
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
    expect(service.entries()[0]?.status).toBe('watching');
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
    expect(service.entries()).toEqual([]);
    const request = http.expectOne('/api/library/entry-1');

    expect(request.request.method).toBe('DELETE');
    request.flush(null);

    await expect(removeResult).resolves.toBe(true);
    expect(service.entries()).toEqual([]);
  });

  it('updates progress and replaces the entry in local state', async () => {
    const loadResult = service.load();
    http.expectOne('/api/library').flush([entry]);
    await loadResult;

    const updatedEntry: LibraryEntry = {
      ...entry,
      status: 'watching',
      progress: {
        currentSeason: 1,
        currentEpisode: 2,
        completedEpisodes: 2,
        totalEpisodesSnapshot: 16,
        completedSeasonNumbers: [],
        includeSpecials: false,
        updatedAt: '2026-07-24T10:00:00.000Z',
      },
    };
    const result = service.updateProgress(entry.id, {
      currentSeason: 1,
      currentEpisode: 2,
      includeSpecials: false,
    });
    expect(service.entries()[0]).toMatchObject({
      status: 'watching',
      progress: {
        currentSeason: 1,
        currentEpisode: 2,
        completedEpisodes: 2,
      },
    });
    const request = http.expectOne('/api/library/entry-1/progress');

    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({
      currentSeason: 1,
      currentEpisode: 2,
      includeSpecials: false,
    });
    request.flush(updatedEntry);

    await expect(result).resolves.toEqual(updatedEntry);
    expect(service.entries()[0]?.progress?.currentEpisode).toBe(2);
  });

  it('updates personal metadata through the dedicated endpoints', async () => {
    const loadResult = service.load();
    http.expectOne('/api/library').flush([entry]);
    await loadResult;

    const ratingResult = service.updateRating(entry.id, 8.5);
    expect(service.entries()[0]?.rating).toBe(8.5);
    const ratingRequest = http.expectOne('/api/library/entry-1/rating');
    expect(ratingRequest.request.body).toEqual({ rating: 8.5 });
    ratingRequest.flush({ ...entry, rating: 8.5 });
    await expect(ratingResult).resolves.toMatchObject({ rating: 8.5 });

    const descriptionResult = service.updateDescription(entry.id, 'A private note');
    expect(service.entries()[0]?.description).toBe('A private note');
    const descriptionRequest = http.expectOne('/api/library/entry-1');
    expect(descriptionRequest.request.body).toEqual({ description: 'A private note' });
    descriptionRequest.flush({ ...entry, rating: 8.5, description: 'A private note' });
    await expect(descriptionResult).resolves.toMatchObject({
      description: 'A private note',
    });

    const playbackResult = service.updatePlaybackPreference(entry.id, {
      audio: {
        type: 'dubbed',
        languageCode: 'uk',
      },
      subtitleLanguageCode: 'en',
    });
    expect(service.entries()[0]?.playbackPreference).toEqual({
      audio: {
        type: 'dubbed',
        languageCode: 'uk',
      },
      subtitleLanguageCode: 'en',
    });
    const playbackRequest = http.expectOne('/api/library/entry-1/playback-preference');
    expect(playbackRequest.request.body).toEqual({
      audio: {
        type: 'dubbed',
        languageCode: 'uk',
      },
      subtitleLanguageCode: 'en',
    });
    playbackRequest.flush({
      ...entry,
      rating: 8.5,
      description: 'A private note',
      playbackPreference: {
        audio: {
          type: 'dubbed',
          languageCode: 'uk',
        },
        subtitleLanguageCode: 'en',
      },
    });

    await expect(playbackResult).resolves.toMatchObject({
      playbackPreference: {
        audio: {
          type: 'dubbed',
          languageCode: 'uk',
        },
        subtitleLanguageCode: 'en',
      },
    });
  });

  it('assigns categories and removes deleted references from local state', async () => {
    const loadResult = service.load();
    http.expectOne('/api/library').flush([entry]);
    await loadResult;

    const updateResult = service.updateCategories(entry.id, ['category-1']);
    expect(service.entries()[0]?.categoryIds).toEqual(['category-1']);
    const request = http.expectOne('/api/library/entry-1');

    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({
      categoryIds: ['category-1'],
    });
    request.flush({
      ...entry,
      categoryIds: ['category-1'],
    });
    await expect(updateResult).resolves.toMatchObject({
      categoryIds: ['category-1'],
    });

    service.removeCategoryReference('category-1');
    expect(service.entries()[0]?.categoryIds).toEqual([]);
  });

  it('applies complete priority orders and clears omitted entries', async () => {
    const secondEntry: LibraryEntry = {
      ...entry,
      id: 'entry-2',
      mediaId: 'media-2',
    };
    const loadResult = service.load();
    http.expectOne('/api/library').flush([
      {
        ...entry,
        priorityLaneId: 'lane-1',
        priorityPosition: 0,
      },
      secondEntry,
    ]);
    await loadResult;

    service.applyPriorityOrder('lane-1', ['entry-2']);

    expect(service.entries()).toEqual([
      entry,
      {
        ...secondEntry,
        priorityLaneId: 'lane-1',
        priorityPosition: 0,
      },
    ]);
  });

  it('rolls back failed optimistic updates and removals', async () => {
    const prioritizedEntry: LibraryEntry = {
      ...entry,
      priorityLaneId: 'lane-1',
      priorityPosition: 0,
    };
    const loadResult = service.load();
    http.expectOne('/api/library').flush([prioritizedEntry]);
    await loadResult;

    const statusResult = service.setStatus('tv', 1, 'watching');
    expect(service.entries()[0]).toMatchObject({ status: 'watching' });
    expect(service.entries()[0]?.priorityLaneId).toBeUndefined();
    http.expectOne('/api/library/entry-1/status').flush(
      { message: 'Unavailable' },
      { status: 503, statusText: 'Service unavailable' },
    );

    await expect(statusResult).resolves.toBeNull();
    expect(service.entries()[0]).toEqual(prioritizedEntry);
    expect(service.error()).toContain('library could not be updated');

    const removeResult = service.remove(entry.id);
    expect(service.entries()).toEqual([]);
    http.expectOne('/api/library/entry-1').flush(
      { message: 'Unavailable' },
      { status: 503, statusText: 'Service unavailable' },
    );

    await expect(removeResult).resolves.toBe(false);
    expect(service.entries()).toEqual([prioritizedEntry]);
    expect(service.error()).toContain('title could not be removed');
  });
});
