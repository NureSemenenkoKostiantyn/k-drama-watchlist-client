import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { PublicLibraryService } from './public-library.service';

describe('PublicLibraryService', () => {
  let service: PublicLibraryService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PublicLibraryService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('loads a filtered public-safe library page', async () => {
    const response = {
      user: {
        id: '507f1f77bcf86cd799439012',
        username: 'dahyun',
        displayUsername: 'Dahyun',
        name: 'Kim Dahyun',
        joinedAt: '2026-07-20T10:00:00.000Z',
      },
      visibility: 'friends' as const,
      isOwner: false,
      page: 2,
      totalPages: 3,
      totalResults: 30,
      items: [],
    };
    const result = service.get(response.user.id, {
      status: 'watched',
      mediaType: 'tv',
      minRating: 8,
      genreId: 18,
      country: 'KR',
      yearFrom: 2020,
      yearTo: 2024,
      sort: 'rating_desc',
      page: 2,
      limit: 12,
    });
    const request = http.expectOne(
      (candidate) =>
        candidate.url === `/api/users/${response.user.id}/library` &&
        candidate.params.get('status') === 'watched' &&
        candidate.params.get('mediaType') === 'tv' &&
        candidate.params.get('minRating') === '8' &&
        candidate.params.get('genreId') === '18' &&
        candidate.params.get('country') === 'KR' &&
        candidate.params.get('yearFrom') === '2020' &&
        candidate.params.get('yearTo') === '2024' &&
        candidate.params.get('sort') === 'rating_desc' &&
        candidate.params.get('page') === '2' &&
        candidate.params.get('limit') === '12',
    );

    expect(request.request.method).toBe('GET');
    request.flush(response);
    await expect(result).resolves.toEqual(response);
  });
});
