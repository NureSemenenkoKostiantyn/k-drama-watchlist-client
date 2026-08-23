import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import {
  MEDIA_COUNTRY_OPTIONS,
  MEDIA_GENRE_OPTIONS,
} from '../../../../shared/media-filter-options';
import { StatisticsService } from '../../data-access/statistics.service';
import { StatisticsOverview } from '../../models/statistics';

@Component({
  selector: 'app-statistics-page',
  imports: [DecimalPipe, RouterLink],
  templateUrl: './statistics-page.html',
  styleUrls: ['./statistics-page.scss', './statistics-charts.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatisticsPage implements OnInit {
  private readonly statisticsService = inject(StatisticsService);
  private readonly genres = new Map(
    MEDIA_GENRE_OPTIONS.map((option) => [option.value, option.label]),
  );
  private readonly countries = new Map(
    MEDIA_COUNTRY_OPTIONS.map((option) => [option.value, option.label]),
  );

  protected readonly statistics = signal<StatisticsOverview | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    void this.load();
  }

  protected retry(): void {
    void this.load();
  }

  protected percentage(value: number, total: number): number {
    return total === 0 ? 0 : Math.round((value / total) * 100);
  }

  protected barWidth(value: number, buckets: readonly { count: number }[]): number {
    if (value === 0) return 0;
    const maximum = Math.max(0, ...buckets.map((bucket) => bucket.count));
    return maximum === 0 ? 0 : Math.max(4, (value / maximum) * 100);
  }

  protected genreLabel(genreId: number): string {
    return this.genres.get(genreId) ?? `Genre ${genreId}`;
  }

  protected countryLabel(countryCode: string): string {
    return this.countries.get(countryCode) ?? countryCode;
  }

  protected monthLabel(month: string): string {
    const [year, monthNumber] = month.split('-').map(Number);
    if (!year || !monthNumber) return month;
    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      timeZone: 'UTC',
    }).format(new Date(Date.UTC(year, monthNumber - 1, 1)));
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      this.statistics.set(await this.statisticsService.getOverview());
    } catch (error: unknown) {
      this.error.set(
        error instanceof Error ? error.message : 'Your statistics could not be loaded.',
      );
    } finally {
      this.loading.set(false);
    }
  }
}
