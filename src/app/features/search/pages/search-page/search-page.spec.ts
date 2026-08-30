import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { LibraryService } from '../../../library/data-access/library.service';
import { MediaService } from '../../data-access/media.service';
import { SearchPage } from './search-page';

describe('SearchPage', () => {
  const search = vi.fn();

  beforeEach(async () => {
    vi.clearAllMocks();
    search.mockReturnValue(
      of({
        page: 1,
        totalPages: 1,
        totalResults: 1,
        results: [
          {
            id: 'tv:1',
            tmdbId: 1,
            mediaType: 'tv',
            title: 'Goblin',
            originalTitle: '도깨비',
            overview: 'A goblin searches for the person who can end his immortal life.',
            posterUrl: 'https://image.tmdb.org/t/p/w500/goblin.jpg',
            firstAirDate: '2016-12-02',
            originCountry: ['KR'],
            genreIds: [18],
            tmdbVoteAverage: 8.6,
          },
        ],
      }),
    );

    await TestBed.configureTestingModule({
      imports: [SearchPage],
      providers: [
        provideRouter([{ path: 'search', component: SearchPage }]),
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
          provide: MediaService,
          useValue: { search },
        },
      ],
    }).compileComponents();
  });

  it('renders normalized results and applies the K-drama filter', async () => {
    const fixture = TestBed.createComponent(SearchPage);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const query = root.querySelector<HTMLInputElement>('#media-query');
    const koreanOnly = root.querySelector<HTMLInputElement>('input[type="checkbox"]');

    if (!query || !koreanOnly) {
      throw new Error('Search form controls were not rendered');
    }

    query.value = 'Goblin';
    query.dispatchEvent(new Event('input'));
    koreanOnly.checked = true;
    koreanOnly.dispatchEvent(new Event('change'));
    root.querySelector('form')?.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(search).toHaveBeenCalledWith({
      query: 'Goblin',
      type: 'tv',
      page: 1,
      country: 'KR',
    });
    expect(root.querySelector('.media-card h2')?.textContent).toContain('Goblin');
    expect(root.querySelector('.media-card__original-title')?.textContent).toContain('도깨비');
    expect(root.querySelector('.media-card img')?.getAttribute('src')).toContain('goblin.jpg');
  });

  it('does not search with an empty query', async () => {
    const fixture = TestBed.createComponent(SearchPage);
    fixture.detectChanges();

    (fixture.nativeElement as HTMLElement)
      .querySelector('form')
      ?.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(search).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('.search-form__error')).not.toBeNull();
  });

  it('loads a navbar search from the URL query', async () => {
    const router = TestBed.inject(Router);
    await router.navigate(['/search'], { queryParams: { q: 'Goblin' } });
    const fixture = TestBed.createComponent(SearchPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(
      (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>('#media-query')?.value,
    ).toBe('Goblin');
    expect(search).toHaveBeenCalledWith({
      query: 'Goblin',
      type: 'all',
      page: 1,
    });
  });

  it('restores filters and pagination from browser history query parameters', async () => {
    const router = TestBed.inject(Router);
    await router.navigate(['/search'], {
      queryParams: {
        q: 'Parasite',
        type: 'movie',
        korean: '1',
        page: '3',
      },
    });
    const fixture = TestBed.createComponent(SearchPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelector<HTMLInputElement>('#media-query')?.value).toBe('Parasite');
    expect(root.querySelector<HTMLInputElement>('input[type="checkbox"]')?.checked).toBe(true);
    expect(search).toHaveBeenCalledWith({
      query: 'Parasite',
      type: 'tv',
      page: 3,
      country: 'KR',
    });
  });
});
