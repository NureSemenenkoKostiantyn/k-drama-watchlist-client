import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { WheelsService } from './wheels.service';
import { WheelDetails } from '../models/wheel';

describe('WheelsService', () => {
  let service: WheelsService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(WheelsService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('loads private wheel summaries', async () => {
    const promise = service.load();
    http.expectOne('/api/wheels').flush([
      {
        id: 'wheel-1',
        title: 'Friday',
        visibility: 'private',
        selectionMode: 'fully_random',
        itemCount: 0,
        enabledItemCount: 0,
        createdAt: '2026-07-24T10:00:00.000Z',
        updatedAt: '2026-07-24T10:00:00.000Z',
      },
    ]);

    await expect(promise).resolves.toBe(true);
    expect(service.wheels()).toHaveLength(1);
    expect(service.wheels()[0]?.title).toBe('Friday');
  });

  it('creates a wheel and adds it to local summaries', async () => {
    const promise = service.create({
      title: 'Weekend',
      description: 'Pick one',
      selectionMode: 'avoid_recent_winners',
    });
    const request = http.expectOne('/api/wheels');
    expect(request.request.method).toBe('POST');
    request.flush({
      ...wheel,
      id: 'wheel-2',
      title: 'Weekend',
      description: 'Pick one',
      selectionMode: 'avoid_recent_winners',
    });

    await expect(promise).resolves.toEqual(
      expect.objectContaining({ id: 'wheel-2' }),
    );
    expect(service.wheels()[0]).toEqual(
      expect.objectContaining({
        id: 'wheel-2',
        title: 'Weekend',
      }),
    );
  });

  it('records the backend-selected winner in local wheel state', async () => {
    const loadPromise = service.loadWheel(wheel.id);
    http.expectOne(`/api/wheels/${wheel.id}`).flush(wheel);
    await loadPromise;

    const spinPromise = service.spin(wheel.id);
    const request = http.expectOne(`/api/wheels/${wheel.id}/spin`);
    expect(request.request.method).toBe('POST');
    request.flush({
      spinId: 'spin-1',
      selectedItem: {
        wheelItemId: 'item-1',
        mediaId: 'media-1',
        title: 'Goblin',
        posterUrl: 'https://image.example/goblin.jpg',
      },
    });

    await expect(spinPromise).resolves.toEqual(
      expect.objectContaining({ spinId: 'spin-1' }),
    );
    expect(service.activeWheel()?.items[0]?.selectionCount).toBe(1);
    expect(service.history()[0]).toEqual(
      expect.objectContaining({
        spinId: 'spin-1',
        selectedItem: expect.objectContaining({
          wheelItemId: 'item-1',
        }),
      }),
    );
  });
});

const wheel: WheelDetails = {
  id: 'wheel-1',
  title: 'Friday',
  visibility: 'private',
  selectionMode: 'fully_random',
  itemCount: 1,
  enabledItemCount: 1,
  createdAt: '2026-07-24T10:00:00.000Z',
  updatedAt: '2026-07-24T10:00:00.000Z',
  items: [
    {
      id: 'item-1',
      mediaId: 'media-1',
      position: 0,
      weight: 1,
      isEnabled: true,
      selectionCount: 0,
      createdAt: '2026-07-24T10:00:00.000Z',
      updatedAt: '2026-07-24T10:00:00.000Z',
      media: {
        id: 'tv:1',
        tmdbId: 1,
        mediaType: 'tv',
        title: 'Goblin',
        originalTitle: 'Goblin',
        originCountry: ['KR'],
        genreIds: [18],
      },
    },
  ],
};
