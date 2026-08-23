import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { ActivityService } from './activity.service';

describe('ActivityService', () => {
  it('loads a protected page of friend activity', async () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const service = TestBed.inject(ActivityService);
    const http = TestBed.inject(HttpTestingController);

    const promise = service.list(2, 10);
    const request = http.expectOne('/api/activity?page=2&limit=10');
    expect(request.request.method).toBe('GET');
    request.flush({ page: 2, totalPages: 2, totalResults: 11, items: [] });

    await expect(promise).resolves.toMatchObject({ page: 2, totalResults: 11 });
    http.verify();
  });
});
