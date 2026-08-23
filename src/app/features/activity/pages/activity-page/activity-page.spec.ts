import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { ActivityService } from '../../data-access/activity.service';
import { ActivityPage } from './activity-page';

describe('ActivityPage', () => {
  let fixture: ComponentFixture<ActivityPage>;
  const list = vi.fn().mockResolvedValue({
    page: 1,
    totalPages: 1,
    totalResults: 1,
    items: [
      {
        id: 'activity-1',
        type: 'library_rated',
        actor: {
          id: 'friend-id',
          username: 'friend',
          displayUsername: 'Friend',
          name: 'Drama Friend',
          joinedAt: '2026-08-23T12:00:00.000Z',
        },
        media: {
          id: 'tv:1',
          tmdbId: 1,
          mediaType: 'tv',
          title: 'Goblin',
          originalTitle: '도깨비',
          posterUrl: 'https://image.tmdb.org/goblin.jpg',
          originCountry: ['KR'],
          genreIds: [18],
        },
        rating: 9,
        createdAt: '2026-08-23T12:00:00.000Z',
      },
    ],
  });

  beforeEach(async () => {
    list.mockClear();
    await TestBed.configureTestingModule({
      imports: [ActivityPage],
      providers: [provideRouter([]), { provide: ActivityService, useValue: { list } }],
    }).compileComponents();

    fixture = TestBed.createComponent(ActivityPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('renders public-safe friend and media activity', () => {
    const page = fixture.nativeElement as HTMLElement;
    expect(list).toHaveBeenCalledWith(1);
    expect(page.querySelector('h1')?.textContent).toContain('Friends activity');
    expect(page.textContent).toContain('Friend');
    expect(page.textContent).toContain('rated 9.0 / 10');
    expect(page.textContent).toContain('Goblin');
  });
});
