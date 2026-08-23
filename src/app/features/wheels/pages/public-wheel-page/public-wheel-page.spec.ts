import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';

import { PublicWheelsService } from '../../data-access/public-wheels.service';
import { PublicWheelDetails } from '../../models/wheel';
import { PublicWheelPage } from './public-wheel-page';

describe('PublicWheelPage indexing', () => {
  let fixture: ComponentFixture<PublicWheelPage>;
  const get = vi.fn();

  beforeEach(async () => {
    get.mockReset();
    await TestBed.configureTestingModule({
      imports: [PublicWheelPage],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({ publicSlug: 'wheel-slug' }),
            },
          },
        },
        { provide: PublicWheelsService, useValue: { get } },
      ],
    }).compileComponents();
  });

  afterEach(() => fixture?.destroy());

  it('sets public wheel metadata after loading', async () => {
    get.mockResolvedValue(buildWheel());
    fixture = TestBed.createComponent(PublicWheelPage);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(TestBed.inject(Meta).getTag("name='robots'")?.content).toBe(
      'index, follow',
    );
    expect(TestBed.inject(Meta).getTag("property='og:title'")?.content).toBe(
      'Friday night · Drama Watch',
    );
    expect(TestBed.inject(Title).getTitle()).toBe(
      'Friday night · Drama Watch',
    );
  });
});

function buildWheel(): PublicWheelDetails {
  return {
    title: 'Friday night',
    visibility: 'public',
    publicSlug: 'wheel-slug',
    selectionMode: 'fully_random',
    itemCount: 0,
    enabledItemCount: 0,
    items: [],
    members: [],
    history: [],
    createdAt: '2026-08-24T12:00:00.000Z',
    updatedAt: '2026-08-24T12:00:00.000Z',
  };
}
