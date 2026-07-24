import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { vi } from 'vitest';

import { LibraryService } from '../../data-access/library.service';
import { LibraryEntry } from '../../models/library';
import { LibraryPage } from './library-page';

describe('LibraryPage', () => {
  const entry: LibraryEntry = {
    id: 'entry-1',
    mediaId: 'media-1',
    status: 'to_watch',
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

  beforeEach(async () => {
    const entries = signal([entry]);
    const isLoading = signal(false);
    const error = signal<string | null>(null);

    await TestBed.configureTestingModule({
      imports: [LibraryPage],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              data: { status: 'to_watch' },
            },
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
    expect(root.querySelector('.library-card h2')?.textContent).toContain('Goblin');
    expect(root.querySelector('.library-card img')?.getAttribute('src')).toContain('goblin.jpg');
  });
});
