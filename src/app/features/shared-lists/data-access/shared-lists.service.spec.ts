import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { SharedListDetails } from '../models/shared-list';
import { SharedListsService } from './shared-lists.service';

describe('SharedListsService', () => {
  let service: SharedListsService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
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

  it('creates a targeted invitation for an exact username', async () => {
    const promise = service.createInvite(list.id, 'friend', 'commenter');
    const request = http.expectOne(`/api/lists/${list.id}/invites`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ username: 'friend', role: 'commenter' });
    request.flush(invitation);

    await expect(promise).resolves.toEqual(invitation);
  });

  it('lists and revokes owner-scoped pending invitations', async () => {
    const pending = service.listInvites(list.id);
    const listRequest = http.expectOne(`/api/lists/${list.id}/invites`);
    expect(listRequest.request.method).toBe('GET');
    listRequest.flush([invitation]);
    await expect(pending).resolves.toEqual([invitation]);

    const revoked = service.revokeInvite(list.id, invitation.id);
    const revokeRequest = http.expectOne(`/api/lists/${list.id}/invites/${invitation.id}`);
    expect(revokeRequest.request.method).toBe('DELETE');
    revokeRequest.flush(null);
    await expect(revoked).resolves.toBe(true);
  });

  it('updates visibility and retains the server-issued public slug', async () => {
    const shared = { ...list, visibility: 'unlisted' as const, publicSlug: 'abcdefghijklmnop' };
    const promise = service.update(list.id, { visibility: 'unlisted' });
    const request = http.expectOne(`/api/lists/${list.id}`);
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ visibility: 'unlisted' });
    request.flush(shared);

    await expect(promise).resolves.toEqual(shared);
    expect(service.activeList()?.publicSlug).toBe('abcdefghijklmnop');
  });

  it('replaces item order with the server-authoritative response', async () => {
    const load = service.loadList(list.id);
    http.expectOne(`/api/lists/${list.id}`).flush(list);
    await load;

    const reordered = [...list.items].reverse().map((item, position) => ({ ...item, position }));
    const promise = service.reorder(
      list.id,
      reordered.map((item) => item.id),
    );
    const request = http.expectOne(`/api/lists/${list.id}/reorder`);
    expect(request.request.body).toEqual({ itemIds: ['item-2', 'item-1'] });
    request.flush(reordered);

    await expect(promise).resolves.toBe(true);
    expect(service.activeList()?.items.map((item) => item.id)).toEqual(['item-2', 'item-1']);
  });

  it('updates a member role with the server-authoritative member', async () => {
    const load = service.loadList(list.id);
    http.expectOne(`/api/lists/${list.id}`).flush(list);
    await load;

    const updatedMember = { ...member, role: 'commenter' as const };
    const promise = service.updateMember(list.id, member.user.id, 'commenter');
    const request = http.expectOne(`/api/lists/${list.id}/members/${member.user.id}`);
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ role: 'commenter' });
    request.flush(updatedMember);

    await expect(promise).resolves.toEqual(updatedMember);
    expect(service.activeList()?.members).toEqual([updatedMember]);
  });

  it('removes a member from the active list after the server confirms it', async () => {
    const load = service.loadList(list.id);
    http.expectOne(`/api/lists/${list.id}`).flush(list);
    await load;

    const promise = service.removeMember(list.id, member.user.id);
    const request = http.expectOne(`/api/lists/${list.id}/members/${member.user.id}`);
    expect(request.request.method).toBe('DELETE');
    request.flush(null);

    await expect(promise).resolves.toBe(true);
    expect(service.activeList()?.members).toEqual([]);
  });
});

const member = {
  user: {
    id: 'user-2',
    username: 'friend',
    displayUsername: 'Friend',
    name: 'Friend',
    joinedAt: '2026-08-01T12:00:00.000Z',
  },
  role: 'editor' as const,
  joinedAt: '2026-08-22T12:00:00.000Z',
};

const invitation = {
  id: 'invite-1',
  acceptUrl: 'http://localhost:4200/lists/invites/secure-token',
  target: member.user,
  role: 'commenter' as const,
  expiresAt: '2026-08-29T12:00:00.000Z',
  createdAt: '2026-08-22T12:00:00.000Z',
};

const list: SharedListDetails = {
  id: 'list-1',
  title: 'Weekend dramas',
  visibility: 'private',
  role: 'owner',
  itemCount: 2,
  members: [member],
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
