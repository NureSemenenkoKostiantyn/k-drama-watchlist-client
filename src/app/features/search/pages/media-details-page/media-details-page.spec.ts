import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { CategoriesService } from '../../../categories/data-access/categories.service';
import { AuthenticationService } from '../../../../core/auth/authentication.service';
import { LibraryService } from '../../../library/data-access/library.service';
import { FriendsService } from '../../../friends/data-access/friends.service';
import { SuggestionsService } from '../../../suggestions/data-access/suggestions.service';
import { MediaService } from '../../data-access/media.service';
import { MediaDetailsPage } from './media-details-page';

describe('MediaDetailsPage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MediaDetailsPage],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({
                mediaType: 'tv',
                tmdbId: '1',
              }),
            },
          },
        },
        {
          provide: AuthenticationService,
          useValue: {
            session: signal(null).asReadonly(),
          },
        },
        {
          provide: MediaService,
          useValue: {
            getDetails: () =>
              of({
                id: 'tv:1',
                tmdbId: 1,
                mediaType: 'tv',
                title: 'Goblin',
                originalTitle: '도깨비',
                overview: 'A goblin searches for the person who can end his immortal life.',
                firstAirDate: '2016-12-02',
                originCountry: ['KR'],
                genreIds: [18],
                totalEpisodes: 16,
                totalSeasons: 1,
                seasons: [
                  {
                    tmdbSeasonId: 10,
                    seasonNumber: 0,
                    name: 'Specials',
                    episodeCount: 2,
                  },
                  {
                    tmdbSeasonId: 11,
                    seasonNumber: 1,
                    name: 'Season 1',
                    episodeCount: 16,
                  },
                ],
              }),
          },
        },
        {
          provide: CategoriesService,
          useValue: {
            categories: signal([]).asReadonly(),
            load: vi.fn().mockResolvedValue(true),
          },
        },
        {
          provide: LibraryService,
          useValue: {
            entries: signal([]).asReadonly(),
            error: signal<string | null>(null).asReadonly(),
            load: vi.fn().mockResolvedValue(true),
            entryFor: vi.fn().mockReturnValue(undefined),
            setStatus: vi.fn().mockResolvedValue(null),
          },
        },
        {
          provide: FriendsService,
          useValue: {
            list: vi.fn().mockResolvedValue({
              friends: [],
              incomingRequests: [],
              outgoingRequests: [],
            }),
            mediaContext: vi.fn().mockResolvedValue({
              friends: [],
            }),
          },
        },
        {
          provide: SuggestionsService,
          useValue: {
            create: vi.fn(),
          },
        },
      ],
    }).compileComponents();
  });

  it('renders normalized details and separates specials from regular seasons', async () => {
    const fixture = TestBed.createComponent(MediaDetailsPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelector('h1')?.textContent).toContain('Goblin');
    expect(root.querySelector('.media-details__original-title')?.textContent).toContain('도깨비');
    expect(root.querySelectorAll('.season-list__grid article')).toHaveLength(1);
    expect(root.querySelector('.season-list__specials')?.textContent).toContain(
      'excluded from progress',
    );
  });
});
