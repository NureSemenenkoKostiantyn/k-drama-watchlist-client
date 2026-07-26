import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import {
  ActivatedRoute,
  convertToParamMap,
  provideRouter,
} from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { PublicLibraryService } from '../../data-access/public-library.service';
import { UsersService } from '../../data-access/users.service';
import { FriendLibraryPage } from './friend-library-page';

describe('FriendLibraryPage', () => {
  const profile = {
    id: 'user-2',
    username: 'dahyun',
    displayUsername: 'Dahyun',
    name: 'Kim Dahyun',
    joinedAt: '2026-07-20T10:00:00.000Z',
  };
  const getLibrary = vi.fn().mockResolvedValue({
    user: profile,
    visibility: 'friends',
    isOwner: false,
    page: 1,
    totalPages: 1,
    totalResults: 1,
    items: [
      {
        status: 'watching',
        rating: 8.5,
        media: {
          id: 'tv:1',
          tmdbId: 1,
          mediaType: 'tv',
          title: 'Goblin',
          originalTitle: 'Goblin',
          posterUrl: 'https://image.tmdb.org/goblin.jpg',
          originCountry: ['KR'],
          genreIds: [18],
        },
      },
    ],
  });

  beforeEach(async () => {
    getLibrary.mockClear();
    await TestBed.configureTestingModule({
      imports: [FriendLibraryPage],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(convertToParamMap({ username: 'dahyun' })),
          },
        },
        {
          provide: UsersService,
          useValue: {
            getByUsername: vi.fn().mockResolvedValue(profile),
          },
        },
        {
          provide: PublicLibraryService,
          useValue: { get: getLibrary },
        },
      ],
    }).compileComponents();
  });

  it('renders the safe friend library projection', async () => {
    const fixture = TestBed.createComponent(FriendLibraryPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    expect(getLibrary).toHaveBeenCalledWith(
      'dahyun',
      expect.objectContaining({ page: 1, limit: 24 }),
    );
    expect(root.textContent).toContain("Kim Dahyun's library");
    expect(root.textContent).toContain('Friends-only library');
    expect(root.textContent).toContain('Goblin');
    expect(root.textContent).toContain('8.5 / 10');
    expect(root.textContent).toContain('Genre');
    expect(root.textContent).toContain('Drama');
    expect(root.textContent).toContain('South Korea');
    expect(root.textContent).toContain('Year from');
    expect(root.textContent).toContain('Year to');
    expect(root.textContent).toContain('Recently updated');
    expect(root.textContent).not.toContain('TMDB genre ID');
    expect(root.textContent).not.toContain('description');
  });

  it('rejects an inverted year range before requesting data', async () => {
    const fixture = TestBed.createComponent(FriendLibraryPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const yearFrom = fixture.debugElement.query(
      By.css('input[formControlName="yearFrom"]'),
    ).nativeElement as HTMLInputElement;
    const yearTo = fixture.debugElement.query(
      By.css('input[formControlName="yearTo"]'),
    ).nativeElement as HTMLInputElement;
    yearFrom.value = '2025';
    yearFrom.dispatchEvent(new Event('input'));
    yearTo.value = '2020';
    yearTo.dispatchEvent(new Event('input'));
    fixture.debugElement
      .query(By.css('form'))
      .triggerEventHandler('ngSubmit');
    fixture.detectChanges();

    expect(getLibrary).toHaveBeenCalledTimes(1);
    expect(
      (fixture.nativeElement as HTMLElement).textContent,
    ).toContain(
      'The starting year cannot be after the ending year.',
    );
  });
});
