import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { PublicSharedListsService } from '../../data-access/public-shared-lists.service';
import { PublicSharedListDiscoveryPage } from './public-shared-list-discovery-page';

describe('PublicSharedListDiscoveryPage', () => {
  let fixture: ComponentFixture<PublicSharedListDiscoveryPage>;
  const discover = vi.fn().mockResolvedValue({
    page: 1,
    totalPages: 1,
    totalResults: 1,
    items: [
      {
        title: 'Weekend dramas',
        description: 'Slow-burn favorites',
        publicSlug: 'weekend-dramas',
        itemCount: 2,
        owner: {
          id: 'owner-id',
          username: 'owner',
          displayUsername: 'Owner',
          name: 'List Owner',
          joinedAt: '2026-08-23T12:00:00.000Z',
        },
        previewMedia: [
          {
            tmdbId: 1,
            mediaType: 'tv',
            title: 'Goblin',
            posterUrl: 'https://image.tmdb.org/goblin.jpg',
          },
        ],
        createdAt: '2026-08-23T12:00:00.000Z',
        updatedAt: '2026-08-23T12:00:00.000Z',
      },
    ],
  });

  beforeEach(async () => {
    discover.mockClear();
    await TestBed.configureTestingModule({
      imports: [PublicSharedListDiscoveryPage],
      providers: [
        provideRouter([]),
        { provide: PublicSharedListsService, useValue: { discover } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PublicSharedListDiscoveryPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('renders public list cards with owner and preview media', () => {
    const page = fixture.nativeElement as HTMLElement;
    expect(discover).toHaveBeenCalledWith(1);
    expect(page.querySelector('h1')?.textContent).toContain('Public watchlists');
    expect(page.querySelector('.public-list-card h2')?.textContent).toContain(
      'Weekend dramas',
    );
    expect(page.textContent).toContain('By Owner');
    expect(page.querySelector('.poster-stack img')?.getAttribute('src')).toBe(
      'https://image.tmdb.org/goblin.jpg',
    );
  });
});
