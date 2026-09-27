import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { LibraryService } from '../../../library/data-access/library.service';
import { LibraryEntry } from '../../../library/models/library';
import { MediaService } from '../../../search/data-access/media.service';
import { TierPicker } from './tier-picker';

function entry(id: number, status = 'watched', type = 'tv', genreIds = [18]): LibraryEntry {
  return {
    id: String(id),
    status,
    media: {
      id: `${type}:${id}`,
      mediaType: type,
      tmdbId: id,
      title: `Title ${id}`,
      originalTitle: `Title ${id}`,
      genreIds,
    },
  } as LibraryEntry;
}

describe('TierPicker', () => {
  async function setup(entries: LibraryEntry[]) {
    const library = {
      entries: signal(entries),
      isLoading: signal(false),
      error: signal<string | null>(null),
      load: vi.fn().mockResolvedValue(true),
    };
    await TestBed.configureTestingModule({
      imports: [TierPicker],
      providers: [{ provide: MediaService, useValue: { search: vi.fn() } }],
    })
      .overrideComponent(TierPicker, {
        set: { providers: [{ provide: LibraryService, useValue: library }] },
      })
      .compileComponents();
    const fixture = TestBed.createComponent(TierPicker);
    fixture.componentRef.setInput('existing', ['tv:1']);
    fixture.detectChanges();
    const added = vi.fn();
    fixture.componentInstance.added.subscribe(added);
    const root = fixture.nativeElement as HTMLElement;
    return { fixture, root, added, library };
  }
  it('keeps bulk tools collapsed and adds all matches beyond the visible page', async () => {
    const { fixture, root, added } = await setup(
      Array.from({ length: 125 }, (_, i) => entry(i + 1)),
    );
    expect(root.querySelector<HTMLDetailsElement>('.quick-add')?.open).toBe(false);
    expect(root.querySelectorAll('.candidate')).toHaveLength(60);
    fixture.componentInstance['addMatching']();
    expect(added.mock.lastCall?.[0]).toHaveLength(124);
    expect(added.mock.lastCall?.[0].at(-1).id).toBe('tv:125');
  });
  it('supports all-library and watched presets plus combined genre/type filters', async () => {
    const { fixture, added } = await setup([
      entry(1),
      entry(2, 'watching'),
      entry(3, 'watched', 'movie', [35]),
      entry(4),
    ]);
    fixture.componentInstance['preset']('all');
    fixture.detectChanges();
    fixture.componentInstance['addMatching']();
    expect(added.mock.lastCall?.[0].map((item: { id: string }) => item.id)).toEqual([
      'tv:2',
      'movie:3',
      'tv:4',
    ]);
    fixture.componentInstance['preset']('watched');
    fixture.detectChanges();
    fixture.componentInstance['filters'].patchValue({ genre: 35, type: 'movie' });
    fixture.detectChanges();
    fixture.componentInstance['addMatching']();
    expect(added.mock.lastCall?.[0].map((item: { id: string }) => item.id)).toEqual(['movie:3']);
  });
  it('never silently truncates an oversized bulk selection and blocks loading/error writes', async () => {
    const { fixture, root, added, library } = await setup(
      Array.from({ length: 302 }, (_, i) => entry(i + 1)),
    );
    fixture.componentInstance['addMatching']();
    expect(added).not.toHaveBeenCalled();
    expect(root.textContent).toContain('Narrow the filters');
    library.entries.set([entry(2)]);
    library.isLoading.set(true);
    fixture.detectChanges();
    fixture.componentInstance['addMatching']();
    expect(added).not.toHaveBeenCalled();
    library.isLoading.set(false);
    library.error.set('Offline');
    fixture.detectChanges();
    fixture.componentInstance['addMatching']();
    expect(added).not.toHaveBeenCalled();
  });
});
