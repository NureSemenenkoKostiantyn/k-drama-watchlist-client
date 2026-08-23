import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { StatisticsService } from './statistics.service';

describe('StatisticsService', () => {
  let service: StatisticsService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(StatisticsService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads the owner statistics overview', async () => {
    const response = {
      totals: {
        library: 4,
        toWatch: 2,
        watching: 1,
        watched: 1,
        movies: 1,
        tv: 3,
        rated: 1,
        completedEpisodes: 7,
        averageRating: 9,
      },
      ratingDistribution: [{ rating: 9, count: 1 }],
      topGenres: [{ genreId: 18, count: 3 }],
      topCountries: [{ countryCode: 'KR', count: 4 }],
      completedByMonth: [{ month: '2026-08', count: 1 }],
    };
    const request = service.getOverview();
    http.expectOne('/api/statistics').flush(response);

    await expect(request).resolves.toEqual(response);
  });
});
