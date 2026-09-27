import { BreakpointObserver } from '@angular/cdk/layout';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { OpenGraphMetadataService } from '../../../core/open-graph-metadata.service';
import { TierListsService } from '../data-access/tier-lists.service';
import { PublicTierListPage } from './public-tier-list-page';

describe('PublicTierListPage', () => {
  it.each(['public', 'unlisted'])(
    'keeps %s pages read-only with the correct indexing policy',
    async (visibility) => {
      const params = convertToParamMap({ publicSlug: 'abcdefghijklmnop' });
      const metadata = { set: vi.fn(), prepare: vi.fn(), clear: vi.fn() };
      await TestBed.configureTestingModule({
        imports: [PublicTierListPage],
        providers: [
          provideRouter([]),
          {
            provide: ActivatedRoute,
            useValue: { snapshot: { paramMap: params }, paramMap: of(params) },
          },
          { provide: OpenGraphMetadataService, useValue: metadata },
          { provide: BreakpointObserver, useValue: { observe: () => of({ matches: false }) } },
          {
            provide: TierListsService,
            useValue: {
              getPublic: vi
                .fn()
                .mockResolvedValue({
                  title: 'Top dramas',
                  description: '',
                  visibility,
                  publicSlug: 'abcdefghijklmnop',
                  itemCount: 0,
                  tiers: [{ label: 'S', color: 'red', items: [] }],
                }),
            },
          },
        ],
      }).compileComponents();
      const fixture = TestBed.createComponent(PublicTierListPage);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      const root = fixture.nativeElement as HTMLElement;
      expect(root.textContent).toContain('Top dramas');
      expect(root.textContent).not.toContain('Unranked');
      expect(root.querySelector('app-tier-board button')).toBeNull();
      expect(root.querySelector('app-tier-picker')).toBeNull();
      expect(metadata.set).toHaveBeenCalledWith(
        expect.objectContaining({
          allowIndexing: visibility === 'public',
          canonicalUrl: expect.stringContaining('/tier-lists/public/abcdefghijklmnop'),
        }),
      );
      fixture.destroy();
      expect(metadata.clear).toHaveBeenCalled();
    },
  );
});
