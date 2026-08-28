export type StatisticsStatus = 'to_watch' | 'watching' | 'watched';

export interface StatisticsTotals {
  library: number;
  toWatch: number;
  watching: number;
  watched: number;
  movies: number;
  tv: number;
  rated: number;
  completedEpisodes: number;
  averageRating?: number;
}

export interface StatisticsRatingBucket {
  rating: number;
  count: number;
}

export interface StatisticsGenreBucket {
  genreId: number;
  count: number;
}

export interface StatisticsCountryBucket {
  countryCode: string;
  count: number;
}

export interface StatisticsMonthBucket {
  month: string;
  count: number;
}

export interface StatisticsOverview {
  totals: StatisticsTotals;
  ratingDistribution: StatisticsRatingBucket[];
  topGenres: StatisticsGenreBucket[];
  topCountries: StatisticsCountryBucket[];
  completedByMonth: StatisticsMonthBucket[];
}
