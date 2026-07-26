export type ShareCardTemplate =
  | 'rating'
  | 'progress'
  | 'recommendation'
  | 'completed'
  | 'wheel_result';

export type ShareCardFormat = 'square' | 'story' | 'landscape';
export type ShareCardTheme = 'light' | 'dark' | 'poster';

export interface ShareCardProgress {
  currentSeason: number;
  currentEpisode: number;
  completedEpisodes: number;
  totalEpisodes?: number;
}

export interface ShareCardSource {
  kind: 'media' | 'wheel_result';
  title: string;
  originalTitle?: string;
  posterUrl?: string;
  backdropUrl?: string;
  username?: string;
  status?: 'to_watch' | 'watching' | 'watched';
  rating?: number;
  description?: string;
  progress?: ShareCardProgress;
  wheelTitle?: string;
}

export interface ShareCardConfiguration {
  template: ShareCardTemplate;
  format: ShareCardFormat;
  theme: ShareCardTheme;
  includeRating: boolean;
  includeDescription: boolean;
  includeProgress: boolean;
  includeUsername: boolean;
}

export interface ShareCardExportRequest {
  source: ShareCardSource;
  configuration: ShareCardConfiguration;
}

export const shareCardDimensions: Record<
  ShareCardFormat,
  Readonly<{ width: number; height: number }>
> = {
  square: { width: 1080, height: 1080 },
  story: { width: 1080, height: 1920 },
  landscape: { width: 1200, height: 630 },
};
