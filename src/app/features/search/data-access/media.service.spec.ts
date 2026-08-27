import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { MediaService } from './media.service';

describe('MediaService', () => {
  let service: MediaService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(MediaService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('sends normalized search parameters to the relative API', () => {
    service
      .search({
        query: 'Goblin',
        type: 'tv',
        page: 2,
        country: 'KR',
      })
      .subscribe();

    const request = http.expectOne(
      (candidate) =>
        candidate.url === '/api/search' &&
        candidate.params.get('q') === 'Goblin' &&
        candidate.params.get('type') === 'tv' &&
        candidate.params.get('page') === '2' &&
        candidate.params.get('country') === 'KR',
    );

    expect(request.request.method).toBe('GET');
    request.flush({
      page: 2,
      totalPages: 2,
      totalResults: 1,
      results: [],
    });
  });

  it('loads and caches shared media details through the backend', async () => {
    const first = firstValueFrom(service.getDetails('movie', 496243));

    const request = http.expectOne('/api/media/movie/496243');
    expect(request.request.method).toBe('GET');
    request.flush({
      id: 'movie:496243',
      tmdbId: 496243,
      mediaType: 'movie',
      title: 'Parasite',
      originalTitle: '기생충',
      originCountry: ['KR'],
      genreIds: [35],
    });
    await expect(first).resolves.toMatchObject({ title: 'Parasite' });

    const cached = firstValueFrom(service.getDetails('movie', 496243));

    http.expectNone('/api/media/movie/496243');
    await expect(cached).resolves.toMatchObject({ title: 'Parasite' });
  });
});
