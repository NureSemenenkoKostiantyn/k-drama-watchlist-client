import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { DiscoveryService } from '../../data-access/discovery.service';
import { DiscoveryHome } from '../../models/discovery-home';
import { HomePage } from './home-page';

describe('HomePage', () => {
  let fixture: ComponentFixture<HomePage>;
  const home: DiscoveryHome = {
    featured: {
      id: 'tv:1',
      tmdbId: 1,
      mediaType: 'tv',
      title: 'Goblin',
      originalTitle: '도깨비',
      overview: 'A supernatural romance.',
      backdropUrl: 'https://image.tmdb.org/t/p/w780/goblin.jpg',
      firstAirDate: '2016-12-02',
      originCountry: ['KR'],
      genreIds: [18],
      tmdbVoteAverage: 8.6,
    },
    shelves: [
      {
        key: 'popular_kdramas',
        title: 'Popular K-dramas',
        description: 'Popular now.',
        items: [],
      },
      {
        key: 'airing_kdramas',
        title: 'Currently airing',
        description: 'Airing now.',
        items: [],
      },
      {
        key: 'top_rated_kdramas',
        title: 'Top-rated K-dramas',
        description: 'Highly rated.',
        items: [],
      },
      {
        key: 'new_kdramas',
        title: 'New K-drama releases',
        description: 'New releases.',
        items: [],
      },
      {
        key: 'popular_movies',
        title: 'Popular movies',
        description: 'Popular films.',
        items: [
          {
            id: 'movie:2',
            tmdbId: 2,
            mediaType: 'movie',
            title: 'Parasite',
            originalTitle: '기생충',
            posterUrl: 'https://image.tmdb.org/t/p/w500/parasite.jpg',
            releaseDate: '2019-05-30',
            originCountry: ['KR'],
            genreIds: [18],
            tmdbVoteAverage: 8.5,
          },
        ],
      },
    ],
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomePage],
      providers: [
        provideRouter([]),
        {
          provide: DiscoveryService,
          useValue: {
            getHome: () => of(home),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HomePage);
    fixture.detectChanges();
  });

  it('renders the K-drama portal and cached discovery shelves', async () => {
    await fixture.whenStable();
    fixture.detectChanges();
    const page = fixture.nativeElement as HTMLElement;

    expect(page.querySelector('h1')?.textContent).toContain('Goblin');
    expect(page.textContent).toContain('Popular movies');
    expect(page.textContent).toContain('Parasite');
    expect(page.querySelectorAll('.discovery-card')).toHaveLength(1);
  });
});
