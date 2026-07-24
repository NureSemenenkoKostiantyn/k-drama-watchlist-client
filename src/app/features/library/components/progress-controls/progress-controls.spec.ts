import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { LibraryService } from '../../data-access/library.service';
import { LibraryEntry } from '../../models/library';
import { ProgressControls } from './progress-controls';

describe('ProgressControls', () => {
  const entry: LibraryEntry = {
    id: 'entry-1',
    mediaId: 'media-1',
    status: 'watching',
    media: {
      id: 'tv:1',
      tmdbId: 1,
      mediaType: 'tv',
      title: 'Goblin',
      originalTitle: 'Goblin',
      originCountry: ['KR'],
      genreIds: [18],
      totalEpisodes: 16,
      seasons: [{ seasonNumber: 1, name: 'Season 1', episodeCount: 16 }],
    },
    progress: {
      currentSeason: 1,
      currentEpisode: 2,
      completedEpisodes: 2,
      totalEpisodesSnapshot: 16,
      completedSeasonNumbers: [],
      includeSpecials: false,
      updatedAt: '2026-07-24T10:00:00.000Z',
    },
    createdAt: '2026-07-24T10:00:00.000Z',
    updatedAt: '2026-07-24T10:00:00.000Z',
  };

  it('increments an episode and offers an undo action', async () => {
    const updateProgress = vi.fn().mockResolvedValue({
      ...entry,
      progress: {
        ...entry.progress,
        currentEpisode: 3,
        completedEpisodes: 3,
      },
    });

    await TestBed.configureTestingModule({
      imports: [ProgressControls],
      providers: [
        {
          provide: LibraryService,
          useValue: {
            error: signal<string | null>(null).asReadonly(),
            updateProgress,
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(ProgressControls);
    fixture.componentRef.setInput('entry', entry);
    fixture.detectChanges();
    const increment = fixture.nativeElement.querySelector(
      '[data-action="increment"]',
    ) as HTMLButtonElement;

    increment.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(updateProgress).toHaveBeenCalledWith('entry-1', {
      currentSeason: 1,
      currentEpisode: 3,
      includeSpecials: false,
    });
    expect(fixture.nativeElement.textContent).toContain('Undo');
  });
});
