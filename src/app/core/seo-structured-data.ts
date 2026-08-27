export interface StructuredMediaItem {
  mediaType: 'movie' | 'tv';
  title: string;
  originalTitle?: string;
  overview?: string;
  posterUrl?: string;
  backdropUrl?: string;
  releaseDate?: string;
  firstAirDate?: string;
}

export interface StructuredCollectionInput {
  name: string;
  description: string;
  canonicalUrl: string;
  itemCount: number;
  items: StructuredMediaItem[];
}

export interface StructuredDiscoveryItem {
  name: string;
  description?: string;
  url: string;
}

export function buildCollectionStructuredData(
  input: StructuredCollectionInput,
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: input.name,
    description: input.description,
    url: input.canonicalUrl,
    isPartOf: websiteData(input.canonicalUrl),
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: input.itemCount,
      itemListElement: input.items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': item.mediaType === 'movie' ? 'Movie' : 'TVSeries',
          name: item.title,
          ...(item.originalTitle && item.originalTitle !== item.title
            ? { alternateName: item.originalTitle }
            : {}),
          ...(item.overview ? { description: item.overview } : {}),
          ...(item.backdropUrl ?? item.posterUrl
            ? { image: item.backdropUrl ?? item.posterUrl }
            : {}),
          ...(item.releaseDate ?? item.firstAirDate
            ? { datePublished: item.releaseDate ?? item.firstAirDate }
            : {}),
        },
      })),
    },
  };
}

export function buildDiscoveryStructuredData(
  name: string,
  description: string,
  canonicalUrl: string,
  items: StructuredDiscoveryItem[],
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name,
    description,
    url: canonicalUrl,
    isPartOf: websiteData(canonicalUrl),
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: items.length,
      itemListElement: items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'CollectionPage',
          name: item.name,
          ...(item.description ? { description: item.description } : {}),
          url: item.url,
        },
      })),
    },
  };
}

function websiteData(url: string): Record<string, string> {
  return {
    '@type': 'WebSite',
    name: 'Drama Watch',
    url: new URL(url).origin,
  };
}
