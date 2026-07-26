import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { PublicUserProfile } from '../models/public-user-profile';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;
  let http: HttpTestingController;
  const profile: PublicUserProfile = {
    id: 'user-1',
    username: 'dahyun.fan',
    displayUsername: 'Dahyun.Fan',
    name: 'Dahyun Fan',
    joinedAt: '2026-07-20T10:00:00.000Z',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(UsersService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('loads a public profile by username', async () => {
    const result = service.getByUsername('dahyun.fan');
    const request = http.expectOne('/api/users/dahyun.fan');

    expect(request.request.method).toBe('GET');
    request.flush(profile);
    await expect(result).resolves.toEqual(profile);
  });

  it('searches username prefixes with an explicit result limit', async () => {
    const result = service.search('dah', 5);
    const request = http.expectOne(
      (candidate) =>
        candidate.url === '/api/users/search' &&
        candidate.params.get('q') === 'dah' &&
        candidate.params.get('limit') === '5',
    );

    expect(request.request.method).toBe('GET');
    request.flush([profile]);
    await expect(result).resolves.toEqual([profile]);
  });
});
