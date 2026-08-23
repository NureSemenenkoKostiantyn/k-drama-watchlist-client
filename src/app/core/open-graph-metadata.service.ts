import { DOCUMENT } from '@angular/common';
import { inject, Injectable } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

export interface OpenGraphPageMetadata {
  title: string;
  description: string;
  canonicalUrl: string;
  imageUrl?: string;
  imageAlt?: string;
  allowIndexing: boolean;
}

const managedMetaSelectors = [
  "name='robots'",
  "name='description'",
  "property='og:type'",
  "property='og:site_name'",
  "property='og:title'",
  "property='og:description'",
  "property='og:url'",
  "property='og:image'",
  "property='og:image:alt'",
  "name='twitter:card'",
  "name='twitter:title'",
  "name='twitter:description'",
  "name='twitter:image'",
] as const;

@Injectable({ providedIn: 'root' })
export class OpenGraphMetadataService {
  private readonly document = inject(DOCUMENT);
  private readonly meta = inject(Meta);
  private readonly title = inject(Title);

  prepare(): void {
    this.meta.updateTag({ name: 'robots', content: 'noindex, nofollow' });
  }

  set(metadata: OpenGraphPageMetadata): void {
    const description = normalizeDescription(metadata.description);
    this.title.setTitle(metadata.title);
    this.meta.updateTag({
      name: 'robots',
      content: metadata.allowIndexing ? 'index, follow' : 'noindex, nofollow',
    });
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ property: 'og:site_name', content: 'Drama Watch' });
    this.meta.updateTag({ property: 'og:title', content: metadata.title });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:url', content: metadata.canonicalUrl });
    this.meta.updateTag({
      name: 'twitter:card',
      content: metadata.imageUrl ? 'summary_large_image' : 'summary',
    });
    this.meta.updateTag({ name: 'twitter:title', content: metadata.title });
    this.meta.updateTag({ name: 'twitter:description', content: description });

    if (metadata.imageUrl) {
      this.meta.updateTag({ property: 'og:image', content: metadata.imageUrl });
      this.meta.updateTag({
        property: 'og:image:alt',
        content: metadata.imageAlt ?? metadata.title,
      });
      this.meta.updateTag({ name: 'twitter:image', content: metadata.imageUrl });
    } else {
      this.meta.removeTag("property='og:image'");
      this.meta.removeTag("property='og:image:alt'");
      this.meta.removeTag("name='twitter:image'");
    }

    this.setCanonicalLink(metadata.canonicalUrl);
  }

  clear(): void {
    for (const selector of managedMetaSelectors) {
      this.meta.removeTag(selector);
    }
    this.document.head.querySelector('link[data-drama-watch-canonical="true"]')?.remove();
  }

  private setCanonicalLink(url: string): void {
    let link = this.document.head.querySelector<HTMLLinkElement>(
      'link[data-drama-watch-canonical="true"]',
    );
    if (!link) {
      link = this.document.createElement('link');
      link.rel = 'canonical';
      link.dataset['dramaWatchCanonical'] = 'true';
      this.document.head.append(link);
    }
    link.href = url;
  }
}

function normalizeDescription(value: string): string {
  const normalized = value.trim().replace(/\s+/g, ' ');
  return normalized.length <= 200 ? normalized : `${normalized.slice(0, 199).trimEnd()}…`;
}
