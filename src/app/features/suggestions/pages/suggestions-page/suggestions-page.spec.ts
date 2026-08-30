import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';

import { SuggestionsService } from '../../data-access/suggestions.service';
import { Suggestion } from '../../models/suggestion';
import { SuggestionsPage } from './suggestions-page';

describe('SuggestionsPage', () => {
  let fixture: ComponentFixture<SuggestionsPage>;
  const suggestion = {
    id: 'suggestion-1',
    status: 'pending',
    direction: 'received',
    user: {
      id: 'user-1',
      username: 'dahyun.fan',
      displayUsername: 'Dahyun.Fan',
      name: 'Dahyun Fan',
      joinedAt: '2026-07-20T10:00:00.000Z',
    },
    media: {
      id: 'tv:1',
      tmdbId: 1,
      mediaType: 'tv',
      title: 'Goblin',
      originalTitle: 'Goblin',
      originCountry: ['KR'],
      genreIds: [18],
    },
    message: 'Watch this next',
    createdAt: '2026-07-26T10:00:00.000Z',
  } satisfies Suggestion;
  const list = vi.fn().mockResolvedValue({
    received: [suggestion],
    sent: [],
  });
  const accept = vi.fn().mockResolvedValue({
    ...suggestion,
    status: 'accepted',
  });

  beforeEach(async () => {
    list.mockClear();
    accept.mockClear();
    await TestBed.configureTestingModule({
      imports: [SuggestionsPage],
      providers: [
        provideRouter([]),
        {
          provide: SuggestionsService,
          useValue: {
            list,
            accept,
            dismiss: vi.fn(),
          },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(SuggestionsPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('renders received suggestions and accepts one into the library', async () => {
    const root = fixture.nativeElement as HTMLElement;

    expect(root.textContent).toContain('Goblin');
    expect(root.textContent).toContain('Watch this next');
    expect(
      root.querySelector<HTMLAnchorElement>('.item-meta a')?.getAttribute('href'),
    ).toBe('/users/user-1');
    const acceptButton = Array.from(
      root.querySelectorAll('button'),
    ).find((button) => button.textContent?.includes('Add to watchlist'));
    acceptButton?.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(accept).toHaveBeenCalledWith('suggestion-1');
    expect(root.textContent).toContain('Goblin is in your library.');

    const historyButton = Array.from(
      root.querySelectorAll<HTMLButtonElement>('app-segmented-control button'),
    ).find((button) => button.textContent?.includes('History'));
    historyButton?.click();
    fixture.detectChanges();

    expect(root.textContent).toContain('Accepted');
    expect(root.textContent).toContain('Suggested by');
  });
});
