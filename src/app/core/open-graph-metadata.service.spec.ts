import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { Meta, Title } from '@angular/platform-browser';

import { OpenGraphMetadataService } from './open-graph-metadata.service';

describe('OpenGraphMetadataService', () => {
  let service: OpenGraphMetadataService;
  let meta: Meta;
  let document: Document;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OpenGraphMetadataService);
    meta = TestBed.inject(Meta);
    document = TestBed.inject(DOCUMENT);
  });

  afterEach(() => service.clear());

  it('sets complete public metadata and a canonical link', () => {
    service.set({
      title: 'Weekend dramas · Drama Watch',
      description: 'A public list',
      canonicalUrl: 'https://dahyun.best/lists/public/weekend',
      imageUrl: 'https://image.tmdb.org/backdrop.jpg',
      imageAlt: 'Weekend dramas preview',
      allowIndexing: true,
      structuredData: {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'Weekend </script> dramas',
      },
    });

    expect(TestBed.inject(Title).getTitle()).toBe('Weekend dramas · Drama Watch');
    expect(meta.getTag("name='robots'")?.content).toBe('index, follow');
    expect(meta.getTag("property='og:title'")?.content).toBe('Weekend dramas · Drama Watch');
    expect(meta.getTag("name='twitter:card'")?.content).toBe('summary_large_image');
    expect(
      document.head.querySelector<HTMLLinkElement>('link[data-drama-watch-canonical="true"]')?.href,
    ).toBe('https://dahyun.best/lists/public/weekend');
    const structuredData = document.head.querySelector<HTMLScriptElement>(
      'script[data-drama-watch-structured-data="true"]',
    );
    expect(structuredData?.type).toBe('application/ld+json');
    expect(structuredData?.textContent).toContain('"@type":"CollectionPage"');
    expect(structuredData?.textContent).toContain('Weekend \\u003c/script> dramas');
  });

  it('marks unlisted pages noindex and removes stale image metadata', () => {
    service.set({
      title: 'First page',
      description: 'Has an image',
      canonicalUrl: 'https://dahyun.best/first',
      imageUrl: 'https://image.tmdb.org/poster.jpg',
      allowIndexing: true,
    });
    service.set({
      title: 'Private link',
      description: 'No image',
      canonicalUrl: 'https://dahyun.best/second',
      allowIndexing: false,
    });

    expect(meta.getTag("name='robots'")?.content).toBe('noindex, nofollow');
    expect(meta.getTag("property='og:image'")).toBeNull();
    expect(meta.getTag("name='twitter:card'")?.content).toBe('summary');
  });
});
