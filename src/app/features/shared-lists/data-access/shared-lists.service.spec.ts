import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { SharedListDetails } from '../models/shared-list';
import { SharedListsService } from './shared-lists.service';

describe('SharedListsService', () => {
  let service: SharedListsService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(SharedListsService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('accepts a role-bearing invite and stores the joined list', async () => {
    const promise = service.acceptInvite('secure-token');
    const request = http.expectOne('/api/list-invites/secure-token/accept');
    expect(request.request.method).toBe('POST');
    request.flush({ ...list, role: 'editor' });

    await expect(promise).resolves.toEqual(expect.objectContaining({ role: 'editor' }));
    expect(service.activeList()?.id).toBe(list.id);
    expect(service.lists()[0]?.role).toBe('editor');
  });

  it('replaces item order with the server-authoritative response', async () => {
    const load = service.loadList(list.id);
    http.expectOne(`/api/lists/${list.id}`).flush(list);
    await load;

    const reordered = [...list.items].reverse().map((item, position) => ({ ...item, position }));
    const promise = service.reorder(list.id, reordered.map((item) => item.id));
    const request = http.expectOne(`/api/lists/${list.id}/reorder`);
    expect(request.request.body).toEqual({ itemIds: ['item-2', 'item-1'] });
    request.flush(reordered);

    await expect(promise).resolves.toBe(true);
    expect(service.activeList()?.items.map((item) => item.id)).toEqual(['item-2', 'item-1']);
  });
});

const list: SharedListDetails = {
  id: 'list-1',
  title: 'Weekend dramas',
  visibility: 'private',
  role: 'owner',
  itemCount: 2,
  members: [],
  items: [
    {
      id: 'item-1',
      mediaId: 'media-1',
      position: 0,
      media: {
        id: 'media-1',
        tmdbId: 1,
        mediaType: 'tv',
        title: 'Goblin',
        originalTitle: 'Goblin',
        originCountry: ['KR'],
        genreIds: [],
        seasons: [],
      },
      createdAt: '2026-08-22T12:00:00.000Z',
      updatedAt: '2026-08-22T12:00:00.000Z',
    },
    {
      id: 'item-2',
      mediaId: 'media-2',
      position: 1,
      media: {
        id: 'media-2',
        tmdbId: 2,
        mediaType: 'movie',
        title: 'Parasite',
        originalTitle: 'Parasite',
        originCountry: ['KR'],
        genreIds: [],
        seasons: [],
      },
      createdAt: '2026-08-22T12:00:00.000Z',
      updatedAt: '2026-08-22T12:00:00.000Z',
    },
  ],
  createdAt: '2026-08-22T12:00:00.000Z',
  updatedAt: '2026-08-22T12:00:00.000Z',
};
