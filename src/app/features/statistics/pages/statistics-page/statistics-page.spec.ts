import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { StatisticsService } from '../../data-access/statistics.service';
import { StatisticsPage } from './statistics-page';

describe('StatisticsPage', () => {
  let fixture: ComponentFixture<StatisticsPage>;
  const getOverview = vi.fn().mockResolvedValue({
    totals: {
      library: 8,
      toWatch: 3,
      watching: 2,
      watched: 3,
      movies: 2,
      tv: 6,
      rated: 3,
      completedEpisodes: 24,
      averageRating: 8.67,
    },
    ratingDistribution: [{ rating: 9, count: 2 }],
    topGenres: [{ genreId: 18, count: 6 }],
    topCountries: [{ countryCode: 'KR', count: 7 }],
    completedByMonth: [
      { month: '2026-07', count: 1 },
      { month: '2026-08', count: 2 },
    ],
  });

  beforeEach(async () => {
    getOverview.mockClear();
    await TestBed.configureTestingModule({
      imports: [StatisticsPage],
      providers: [provideRouter([]), { provide: StatisticsService, useValue: { getOverview } }],
    }).compileComponents();
    fixture = TestBed.createComponent(StatisticsPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('renders exact personal library statistics', () => {
    const page = fixture.nativeElement as HTMLElement;
    expect(getOverview).toHaveBeenCalledOnce();
    expect(page.querySelector('h1')?.textContent).toContain('Statistics');
    expect(page.textContent).toContain('24');
    expect(page.textContent).toContain('Drama');
    expect(page.textContent).toContain('South Korea');
    expect(page.textContent).toContain('8.67');
  });
});
