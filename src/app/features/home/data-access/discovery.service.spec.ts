import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { DiscoveryHome } from '../models/discovery-home';
import { DiscoveryService } from './discovery.service';

describe('DiscoveryService', () => {
  let service: DiscoveryService;
  let http: HttpTestingController;
  const response: DiscoveryHome = {
    shelves: [],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(DiscoveryService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('loads the shared discovery portal response', () => {
    service.getHome().subscribe((result) => {
      expect(result).toEqual(response);
    });
    const request = http.expectOne('/api/discovery/home');

    expect(request.request.method).toBe('GET');
    request.flush(response);
  });

  it('reuses the shared discovery response during its client TTL', async () => {
    const first = firstValueFrom(service.getHome());
    const second = firstValueFrom(service.getHome());

    const request = http.expectOne('/api/discovery/home');
    request.flush(response);
    await expect(Promise.all([first, second])).resolves.toEqual([
      response,
      response,
    ]);

    const cached = firstValueFrom(service.getHome());

    http.expectNone('/api/discovery/home');
    await expect(cached).resolves.toEqual(response);
  });
});
