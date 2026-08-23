import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { WheelsService } from './wheels.service';
import { WheelDetails } from '../models/wheel';

describe('WheelsService', () => {
  let service: WheelsService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(WheelsService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('loads private wheel summaries', async () => {
    const promise = service.load();
    http.expectOne('/api/wheels').flush([
      {
        id: 'wheel-1',
        title: 'Friday',
        visibility: 'private',
        role: 'owner',
        selectionMode: 'fully_random',
        itemCount: 0,
        enabledItemCount: 0,
        createdAt: '2026-07-24T10:00:00.000Z',
        updatedAt: '2026-07-24T10:00:00.000Z',
      },
    ]);

    await expect(promise).resolves.toBe(true);
    expect(service.wheels()).toHaveLength(1);
    expect(service.wheels()[0]?.title).toBe('Friday');
  });

  it('creates a wheel and adds it to local summaries', async () => {
    const promise = service.create({
      title: 'Weekend',
      description: 'Pick one',
      selectionMode: 'avoid_recent_winners',
    });
    const request = http.expectOne('/api/wheels');
    expect(request.request.method).toBe('POST');
    request.flush({
      ...wheel,
      id: 'wheel-2',
      title: 'Weekend',
      description: 'Pick one',
      selectionMode: 'avoid_recent_winners',
    });

    await expect(promise).resolves.toEqual(
      expect.objectContaining({ id: 'wheel-2' }),
    );
    expect(service.wheels()[0]).toEqual(
      expect.objectContaining({
        id: 'wheel-2',
        title: 'Weekend',
      }),
    );
  });

  it('updates visibility and retains the server-issued public slug', async () => {
    const shared = { ...wheel, visibility: 'unlisted' as const, publicSlug: 'abcdefghijklmnop' };
    const promise = service.update(wheel.id, { visibility: 'unlisted' });
    const request = http.expectOne(`/api/wheels/${wheel.id}`);
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ visibility: 'unlisted' });
    request.flush(shared);

    await expect(promise).resolves.toEqual(shared);
    expect(service.activeWheel()?.publicSlug).toBe('abcdefghijklmnop');
  });

  it('records the backend-selected winner in local wheel state', async () => {
    const loadPromise = service.loadWheel(wheel.id);
    http.expectOne(`/api/wheels/${wheel.id}`).flush(wheel);
    await loadPromise;

    const spinPromise = service.spin(wheel.id);
    const request = http.expectOne(`/api/wheels/${wheel.id}/spin`);
    expect(request.request.method).toBe('POST');
    request.flush({
      spinId: 'spin-1',
      selectedItem: {
        wheelItemId: 'item-1',
        mediaId: 'media-1',
        title: 'Goblin',
        posterUrl: 'https://image.example/goblin.jpg',
      },
      spunBy: {
        id: 'user-2',
        username: 'mina',
        displayUsername: 'Mina',
        name: 'Mina',
        joinedAt: '2026-07-24T10:00:00.000Z',
      },
      createdAt: '2026-07-26T12:00:00.000Z',
    });

    await expect(spinPromise).resolves.toEqual(
      expect.objectContaining({ spinId: 'spin-1' }),
    );
    expect(service.activeWheel()?.items[0]?.selectionCount).toBe(1);
    expect(service.history()[0]).toEqual(
      expect.objectContaining({
        spinId: 'spin-1',
        selectedItem: expect.objectContaining({
          wheelItemId: 'item-1',
        }),
        spunBy: expect.objectContaining({ username: 'mina' }),
        createdAt: '2026-07-26T12:00:00.000Z',
      }),
    );
  });

  it('adds, changes, and removes a shared wheel member', async () => {
    const loadPromise = service.loadWheel(wheel.id);
    http.expectOne(`/api/wheels/${wheel.id}`).flush(wheel);
    await loadPromise;
    const member = {
      role: 'viewer' as const,
      user: {
        id: 'user-2',
        username: 'mina',
        displayUsername: 'Mina',
        name: 'Mina',
        joinedAt: '2026-07-20T10:00:00.000Z',
      },
    };

    const addPromise = service.addMember(wheel.id, {
      username: 'mina',
      role: 'viewer',
    });
    const addRequest = http.expectOne(
      `/api/wheels/${wheel.id}/members`,
    );
    expect(addRequest.request.method).toBe('POST');
    addRequest.flush(member);
    await expect(addPromise).resolves.toEqual(member);
    expect(service.activeWheel()?.members).toContainEqual(member);

    const updatePromise = service.updateMember(
      wheel.id,
      member.user.id,
      'editor',
    );
    const updateRequest = http.expectOne(
      `/api/wheels/${wheel.id}/members/${member.user.id}`,
    );
    expect(updateRequest.request.method).toBe('PATCH');
    updateRequest.flush({ ...member, role: 'editor' });
    await expect(updatePromise).resolves.toEqual(
      expect.objectContaining({ role: 'editor' }),
    );
    expect(service.activeWheel()?.members[1]?.role).toBe('editor');

    const removePromise = service.removeMember(
      wheel.id,
      member.user.id,
    );
    const removeRequest = http.expectOne(
      `/api/wheels/${wheel.id}/members/${member.user.id}`,
    );
    expect(removeRequest.request.method).toBe('DELETE');
    removeRequest.flush(null);
    await expect(removePromise).resolves.toBe(true);
    expect(service.activeWheel()?.members).toHaveLength(1);
  });
});

const wheel: WheelDetails = {
  id: 'wheel-1',
  title: 'Friday',
  visibility: 'private',
  role: 'owner',
  selectionMode: 'fully_random',
  itemCount: 1,
  enabledItemCount: 1,
  createdAt: '2026-07-24T10:00:00.000Z',
  updatedAt: '2026-07-24T10:00:00.000Z',
  members: [
    {
      role: 'owner',
      user: {
        id: 'user-1',
        username: 'dahyun',
        displayUsername: 'Dahyun',
        name: 'Dahyun',
        joinedAt: '2026-07-20T10:00:00.000Z',
      },
    },
  ],
  items: [
    {
      id: 'item-1',
      mediaId: 'media-1',
      position: 0,
      weight: 1,
      isEnabled: true,
      selectionCount: 0,
      createdAt: '2026-07-24T10:00:00.000Z',
      updatedAt: '2026-07-24T10:00:00.000Z',
      media: {
        id: 'tv:1',
        tmdbId: 1,
        mediaType: 'tv',
        title: 'Goblin',
        originalTitle: 'Goblin',
        originCountry: ['KR'],
        genreIds: [18],
      },
    },
  ],
};
