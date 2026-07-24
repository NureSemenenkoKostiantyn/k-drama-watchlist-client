import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { PriorityLane } from '../models/priority';
import { PriorityService } from './priority.service';

describe('PriorityService', () => {
  let service: PriorityService;
  let http: HttpTestingController;
  const lane: PriorityLane = {
    id: 'lane-1',
    name: 'Must watch',
    position: 0,
    isDefault: true,
    createdAt: '2026-07-24T10:00:00.000Z',
    updatedAt: '2026-07-24T10:00:00.000Z',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PriorityService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('loads and creates priority lanes', async () => {
    const loadResult = service.load();
    const loadRequest = http.expectOne('/api/priority-lanes');
    expect(loadRequest.request.method).toBe('GET');
    loadRequest.flush([lane]);
    await expect(loadResult).resolves.toBe(true);

    const createResult = service.create('Watch tonight');
    const createRequest = http.expectOne('/api/priority-lanes');
    expect(createRequest.request.method).toBe('POST');
    expect(createRequest.request.body).toEqual({ name: 'Watch tonight' });
    const created = {
      ...lane,
      id: 'lane-2',
      name: 'Watch tonight',
      position: 1,
      isDefault: false,
    };
    createRequest.flush(created);

    await expect(createResult).resolves.toEqual(created);
    expect(service.lanes()).toEqual([lane, created]);
  });

  it('sends complete lane and item order arrays', async () => {
    const laneOrderResult = service.reorderLanes(['lane-2', 'lane-1']);
    const laneRequest = http.expectOne('/api/priority-lanes/reorder');
    expect(laneRequest.request.body).toEqual({
      laneIds: ['lane-2', 'lane-1'],
    });
    laneRequest.flush([
      { ...lane, id: 'lane-2', position: 0 },
      { ...lane, position: 1 },
    ]);
    await expect(laneOrderResult).resolves.toBe(true);

    const itemOrderResult = service.reorderItems([
      {
        laneId: 'lane-1',
        itemIds: ['entry-2'],
      },
      {
        laneId: 'lane-2',
        itemIds: ['entry-1'],
      },
    ]);
    const itemRequest = http.expectOne('/api/priority-lanes/reorder-items');
    expect(itemRequest.request.body).toEqual({
      lanes: [
        {
          laneId: 'lane-1',
          itemIds: ['entry-2'],
        },
        {
          laneId: 'lane-2',
          itemIds: ['entry-1'],
        },
      ],
    });
    itemRequest.flush(null);
    await expect(itemOrderResult).resolves.toBe(true);
  });
});
