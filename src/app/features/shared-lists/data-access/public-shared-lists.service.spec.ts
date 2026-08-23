import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { PublicSharedListDetails } from '../models/shared-list';
import { PublicSharedListsService } from './public-shared-lists.service';

describe('PublicSharedListsService', () => {
  it('loads an anonymous public-safe list by slug', async () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const service = TestBed.inject(PublicSharedListsService);
    const http = TestBed.inject(HttpTestingController);

    const promise = service.get('public-list-slug');
    const request = http.expectOne('/api/public/lists/public-list-slug');
    expect(request.request.method).toBe('GET');
    request.flush(publicList);

    await expect(promise).resolves.toEqual(publicList);
    http.verify();
  });
});

const publicList: PublicSharedListDetails = {
  title: 'Weekend dramas',
  visibility: 'unlisted',
  publicSlug: 'public-list-slug',
  itemCount: 0,
  members: [],
  items: [],
  createdAt: '2026-08-23T12:00:00.000Z',
  updatedAt: '2026-08-23T12:00:00.000Z',
};
