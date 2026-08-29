import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { vi } from 'vitest';

import { CategoriesService } from '../../../categories/data-access/categories.service';
import { PriorityService } from '../../../priority/data-access/priority.service';
import { LibraryService } from '../../data-access/library.service';
import { LibraryEntry } from '../../models/library';
import { LibraryPage } from './library-page';

describe('LibraryPage', () => {
  let breakpointState: BehaviorSubject<BreakpointState>;
  const entry: LibraryEntry = {
    id: 'entry-1',
    mediaId: 'media-1',
    status: 'to_watch',
    categoryIds: [],
    sharedLists: [],
    media: {
      id: 'tv:1',
      tmdbId: 1,
      mediaType: 'tv',
      title: 'Goblin',
      originalTitle: '도깨비',
      posterUrl: 'https://image.tmdb.org/t/p/w500/goblin.jpg',
      firstAirDate: '2016-12-02',
      originCountry: ['KR'],
      genreIds: [18],
    },
    createdAt: '2026-07-23T20:00:00.000Z',
    updatedAt: '2026-07-23T20:00:00.000Z',
  };
  const movieEntry: LibraryEntry = {
    id: 'entry-2',
    mediaId: 'media-2',
    status: 'to_watch',
    rating: 9,
    categoryIds: [],
    suggestedBy: {
      id: 'friend-1',
      username: 'jiwoo',
      displayUsername: 'Jiwoo',
      name: 'Jiwoo Kim',
      joinedAt: '2026-07-01T00:00:00.000Z',
    },
    sharedLists: [{ id: 'list-1', title: 'Weekend picks' }],
    media: {
      id: 'movie:496243',
      tmdbId: 496243,
      mediaType: 'movie',
      title: 'Parasite',
      originalTitle: '기생충',
      releaseDate: '2019-05-30',
      releaseStatus: 'ended',
      originCountry: ['KR'],
      genreIds: [18, 53],
    },
    createdAt: '2026-07-24T20:00:00.000Z',
    updatedAt: '2026-07-24T20:00:00.000Z',
  };

  beforeEach(async () => {
    breakpointState = new BehaviorSubject<BreakpointState>({ matches: false, breakpoints: {} });
    const entries = signal([entry, movieEntry]);
    const categories = signal([]);
    const isLoading = signal(false);
    const error = signal<string | null>(null);

    await TestBed.configureTestingModule({
      imports: [LibraryPage],
      providers: [
        provideRouter([]),
        {
          provide: BreakpointObserver,
          useValue: {
            observe: vi.fn().mockReturnValue(breakpointState),
          },
        },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              data: { status: 'to_watch' },
            },
          },
        },
        {
          provide: PriorityService,
          useValue: {
            lanes: signal([]).asReadonly(),
            load: vi.fn().mockResolvedValue(true),
          },
        },
        {
          provide: CategoriesService,
          useValue: {
            categories: categories.asReadonly(),
            error: signal<string | null>(null).asReadonly(),
            load: vi.fn().mockResolvedValue(true),
            clearError: vi.fn(),
          },
        },
        {
          provide: LibraryService,
          useValue: {
            entries: entries.asReadonly(),
            isLoading: isLoading.asReadonly(),
            error: error.asReadonly(),
            load: vi.fn().mockResolvedValue(true),
            setStatus: vi.fn().mockResolvedValue(entry),
            updateCategories: vi.fn().mockResolvedValue(entry),
            removeCategoryReference: vi.fn(),
            remove: vi.fn().mockResolvedValue(true),
          },
        },
      ],
    }).compileComponents();
  });

  it('renders the selected status collection', async () => {
    const fixture = TestBed.createComponent(LibraryPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelector('h1')?.textContent).toContain('To watch');
    expect(root.textContent).toContain('Goblin');
    expect(
      Array.from(root.querySelectorAll('.library-card img')).some((image) =>
        image.getAttribute('src')?.includes('goblin.jpg'),
      ),
    ).toBe(true);
  });

  it('applies title filters and switches between grid and list views', async () => {
    const fixture = TestBed.createComponent(LibraryPage);
    fixture.detectChanges();
    await fixture.whenStable();

    const root = fixture.nativeElement as HTMLElement;
    const query = root.querySelector<HTMLInputElement>('input[formControlName="query"]');
    const form = root.querySelector<HTMLFormElement>('.library-filters');

    expect(query).not.toBeNull();
    expect(form).not.toBeNull();

    query!.value = '기생충';
    query!.dispatchEvent(new Event('input'));
    form!.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    const titles = Array.from(root.querySelectorAll('.library-card h2')).map((title) =>
      title.textContent?.trim(),
    );
    expect(titles).toEqual(['Parasite']);
    expect(root.querySelector('.library-results > span')?.textContent).toContain('1 result');

    const listButton = Array.from(
      root.querySelectorAll<HTMLButtonElement>('.library-results button'),
    ).find((button) => button.textContent?.trim() === 'List');
    listButton?.click();
    fixture.detectChanges();

    expect(root.querySelector('.library-grid')?.classList).toContain('library-grid--list');
  });

  it('offers and applies suggestion-source and shared-list filters', async () => {
    const fixture = TestBed.createComponent(LibraryPage);
    fixture.detectChanges();
    await fixture.whenStable();

    const root = fixture.nativeElement as HTMLElement;
    const source = root.querySelector<HTMLSelectElement>(
      'select[formControlName="suggestedByUserId"]',
    );
    const sharedList = root.querySelector<HTMLSelectElement>(
      'select[formControlName="sharedListId"]',
    );
    const form = root.querySelector<HTMLFormElement>('.library-filters');

    expect(source?.textContent).toContain('@Jiwoo');
    expect(sharedList?.textContent).toContain('Weekend picks');

    source!.value = 'friend-1';
    source!.dispatchEvent(new Event('change'));
    sharedList!.value = 'list-1';
    sharedList!.dispatchEvent(new Event('change'));
    form!.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(
      Array.from(root.querySelectorAll('.library-card h2')).map((title) =>
        title.textContent?.trim(),
      ),
    ).toEqual(['Parasite']);
  });

  it('uses a collapsible filter panel on mobile and reports active filters', async () => {
    breakpointState.next({ matches: true, breakpoints: {} });
    const fixture = TestBed.createComponent(LibraryPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const toggle = root.querySelector<HTMLButtonElement>('.library-filter-toggle');
    const panel = root.querySelector<HTMLElement>('#library-filter-panel');

    expect(toggle?.getAttribute('aria-expanded')).toBe('false');
    expect(panel?.hidden).toBe(true);

    toggle?.click();
    fixture.detectChanges();

    expect(toggle?.getAttribute('aria-expanded')).toBe('true');
    expect(panel?.hidden).toBe(false);

    const query = root.querySelector<HTMLInputElement>('input[formControlName="query"]');
    const form = root.querySelector<HTMLFormElement>('.library-filters');
    query!.value = 'Goblin';
    query!.dispatchEvent(new Event('input'));
    form!.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(toggle?.getAttribute('aria-expanded')).toBe('false');
    expect(toggle?.textContent).toContain('1 active');
    expect(panel?.hidden).toBe(true);
  });
});
