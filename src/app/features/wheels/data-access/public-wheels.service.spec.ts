import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { PublicWheelDetails } from '../models/wheel';
import { PublicWheelsService } from './public-wheels.service';

describe('PublicWheelsService', () => {
  it('loads an anonymous public-safe wheel by slug', async () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const service = TestBed.inject(PublicWheelsService);
    const http = TestBed.inject(HttpTestingController);

    const promise = service.get('publicwheel_slug');
    const request = http.expectOne('/api/public/wheels/publicwheel_slug');
    expect(request.request.method).toBe('GET');
    request.flush(publicWheel);

    await expect(promise).resolves.toEqual(publicWheel);
    http.verify();
  });
});

const publicWheel: PublicWheelDetails = {
  title: 'Friday night',
  visibility: 'unlisted',
  publicSlug: 'publicwheel_slug',
  selectionMode: 'fully_random',
  itemCount: 0,
  enabledItemCount: 0,
  items: [],
  members: [],
  history: [],
  createdAt: '2026-08-23T12:00:00.000Z',
  updatedAt: '2026-08-23T12:00:00.000Z',
};
