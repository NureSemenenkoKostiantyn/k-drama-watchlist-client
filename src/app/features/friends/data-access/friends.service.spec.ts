import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';

import { Friendship, FriendshipsOverview } from '../models/friendship';
import { FriendsService } from './friends.service';

describe('FriendsService', () => {
  let service: FriendsService;
  let http: HttpTestingController;
  const friendship: Friendship = {
    id: 'friendship-1',
    status: 'pending',
    direction: 'outgoing',
    user: {
      id: 'user-2',
      username: 'dahyun.fan',
      displayUsername: 'Dahyun.Fan',
      name: 'Dahyun Fan',
      joinedAt: '2026-07-20T10:00:00.000Z',
    },
    createdAt: '2026-07-26T15:00:00.000Z',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        FriendsService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(FriendsService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('loads all friendship buckets', async () => {
    const overview: FriendshipsOverview = {
      friends: [],
      incomingRequests: [],
      outgoingRequests: [friendship],
    };
    const result = service.list();
    http.expectOne('/api/friends').flush(overview);

    await expect(result).resolves.toEqual(overview);
  });

  it('sends and accepts friend requests', async () => {
    const requested = service.request('dahyun.fan');
    const request = http.expectOne('/api/friends/request');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ username: 'dahyun.fan' });
    request.flush(friendship);
    await expect(requested).resolves.toEqual(friendship);

    const acceptedFriendship: Friendship = {
      ...friendship,
      status: 'accepted',
      direction: 'incoming',
    };
    const accepted = service.accept(friendship.id);
    const acceptRequest = http.expectOne(
      '/api/friends/friendship-1/accept',
    );
    expect(acceptRequest.request.method).toBe('POST');
    acceptRequest.flush(acceptedFriendship);
    await expect(accepted).resolves.toEqual(acceptedFriendship);
  });

  it('rejects and removes relationships', async () => {
    const rejected = service.reject(friendship.id);
    const rejectRequest = http.expectOne(
      '/api/friends/friendship-1/reject',
    );
    expect(rejectRequest.request.method).toBe('POST');
    rejectRequest.flush(null);
    await expect(rejected).resolves.toBeNull();

    const deleted = service.delete(friendship.id);
    const deleteRequest = http.expectOne(
      '/api/friends/friendship-1',
    );
    expect(deleteRequest.request.method).toBe('DELETE');
    deleteRequest.flush(null);
    await expect(deleted).resolves.toBeNull();
  });
});
