import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';

import { PublicSharedListsService } from '../../data-access/public-shared-lists.service';
import { PublicSharedListDetails } from '../../models/shared-list';
import { PublicSharedListPage } from './public-shared-list-page';

describe('PublicSharedListPage indexing', () => {
  let fixture: ComponentFixture<PublicSharedListPage>;
  const get = vi.fn();

  beforeEach(async () => {
    get.mockReset();
    await TestBed.configureTestingModule({
      imports: [PublicSharedListPage],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ publicSlug: 'list-slug' }) } },
        },
        { provide: PublicSharedListsService, useValue: { get } },
      ],
    }).compileComponents();
  });

  afterEach(() => {
    fixture?.destroy();
    TestBed.inject(Meta).removeTag("name='robots'");
    TestBed.inject(Meta).removeTag("name='description'");
  });

  it('allows indexing for a public list and sets a descriptive title', async () => {
    get.mockResolvedValue(buildList('public'));
    fixture = TestBed.createComponent(PublicSharedListPage);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(TestBed.inject(Meta).getTag("name='robots'")?.content).toBe('index, follow');
    expect(TestBed.inject(Meta).getTag("property='og:title'")?.content).toBe(
      'Weekend dramas · Drama Watch',
    );
    expect(TestBed.inject(Title).getTitle()).toBe('Weekend dramas · Drama Watch');
  });

  it('prevents indexing for an unlisted direct link', async () => {
    get.mockResolvedValue(buildList('unlisted'));
    fixture = TestBed.createComponent(PublicSharedListPage);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(TestBed.inject(Meta).getTag("name='robots'")?.content).toBe(
      'noindex, nofollow',
    );
  });
});

function buildList(
  visibility: PublicSharedListDetails['visibility'],
): PublicSharedListDetails {
  return {
    title: 'Weekend dramas',
    visibility,
    publicSlug: 'list-slug',
    itemCount: 0,
    members: [],
    items: [],
    createdAt: '2026-08-23T12:00:00.000Z',
    updatedAt: '2026-08-23T12:00:00.000Z',
  };
}
