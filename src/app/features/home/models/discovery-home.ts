import { MediaSummary } from '../../search/models/media';

export type DiscoveryShelfKey =
  | 'airing_kdramas'
  | 'new_kdramas'
  | 'popular_kdramas'
  | 'popular_movies'
  | 'top_rated_kdramas';

export interface DiscoveryShelf {
  key: DiscoveryShelfKey;
  title: string;
  description: string;
  items: MediaSummary[];
}

export interface DiscoveryHome {
  featured?: MediaSummary;
  shelves: DiscoveryShelf[];
}
