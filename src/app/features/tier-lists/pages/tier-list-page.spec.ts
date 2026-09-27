import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { BreakpointObserver } from '@angular/cdk/layout';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { LibraryService } from '../../library/data-access/library.service';
import { TierPicker } from '../components/tier-picker/tier-picker';
import { TierListsService } from '../data-access/tier-lists.service';
import { TierList } from '../models/tier-list';
import { TierListPage } from './tier-list-page';
import { FocusModeService } from '../../../core/layout/focus-mode.service';

describe('TierListPage', () => {
  const media = {
    id: 'tv:1',
    mediaType: 'tv' as const,
    tmdbId: 1,
    title: 'Goblin',
    originalTitle: 'Goblin',
  };
  const original: TierList = {
    id: 'board',
    title: 'Favourites',
    description: '',
    visibility: 'private',
    source: 'manual',
    capacity: 300,
    revision: 2,
    itemCount: 1,
    createdAt: '2026-09-01',
    updatedAt: '2026-09-01',
    tiers: [
      { id: 's', label: 'S', color: 'red', items: [media] },
      { id: 'a', label: 'A', color: 'green', items: [] },
    ],
    unranked: [],
  };

  async function setup(initial: TierList = original) {
    const api = {
      get: vi.fn().mockResolvedValue(structuredClone(initial)),
      layout: vi.fn(),
      delete: vi.fn(),
      update: vi.fn(),
      add: vi.fn(),
    };
    const params = convertToParamMap({ tierListId: 'board' });
    await TestBed.configureTestingModule({
      imports: [TierListPage],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: params }, paramMap: of(params) },
        },
        { provide: TierListsService, useValue: api },
        { provide: BreakpointObserver, useValue: { observe: () => of({ matches: true }) } },
      ],
    })
      .overrideComponent(TierPicker, {
        set: {
          providers: [
            {
              provide: LibraryService,
              useValue: {
                load: vi.fn().mockResolvedValue(true),
                entries: signal([]),
                isLoading: signal(false),
                error: signal(null),
              },
            },
          ],
        },
      })
      .compileComponents();
    const fixture = TestBed.createComponent(TierListPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const click = (text: string) => {
      const button = [...root.querySelectorAll<HTMLButtonElement>('button')].find(
        (item) => item.textContent?.trim() === text,
      );
      expect(button).toBeTruthy();
      button!.click();
      fixture.detectChanges();
    };
    const move = () => {
      root.querySelector<HTMLButtonElement>('button.poster')!.click();
      fixture.detectChanges();
      root.querySelector<HTMLButtonElement>('button[aria-label="Move to A"]')!.click();
      fixture.detectChanges();
    };
    return { api, fixture, root, click, move };
  }

  it('waits for the authoritative arrangement and undoes using the new revision', async () => {
    const { api, fixture, root, click, move } = await setup();
    api.layout.mockResolvedValueOnce({
      ...original,
      revision: 3,
      tiers: [
        { ...original.tiers[0], items: [] },
        { ...original.tiers[1], items: [media] },
      ],
    });
    move();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(api.layout).toHaveBeenCalledWith('board', {
      revision: 2,
      tiers: [
        { id: 's', label: 'S', color: 'red', mediaIds: [] },
        { id: 'a', label: 'A', color: 'green', mediaIds: ['tv:1'] },
      ],
      unrankedMediaIds: [],
    });
    expect(root.querySelector('section[aria-label="A tier"]')?.textContent).toContain('Goblin');
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(
        [...root.querySelectorAll<HTMLButtonElement>('button')].find(
          (button) => button.textContent?.trim() === 'Undo',
        )?.disabled,
      ).toBe(false);
    });
    api.layout.mockResolvedValueOnce({ ...original, revision: 4 });
    click('Done');
    click('Undo');
    await fixture.whenStable();
    fixture.detectChanges();
    expect(api.layout.mock.lastCall?.[1]).toMatchObject({
      revision: 3,
      tiers: [
        { id: 's', mediaIds: ['tv:1'] },
        { id: 'a', mediaIds: [] },
      ],
    });
    expect(root.querySelector('section[aria-label="S tier"]')?.textContent).toContain('Goblin');
  });

  it('retains the saved board and blocks further writes after a conflict until reload', async () => {
    const { api, fixture, root, click, move } = await setup();
    api.layout.mockRejectedValue(
      new HttpErrorResponse({
        status: 409,
        error: { error: { message: 'Changed in another tab. Reload.' } },
      }),
    );
    move();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(root.textContent).toContain('Changed in another tab. Reload.');
    expect(root.querySelector('section[aria-label="S tier"]')?.textContent).toContain('Goblin');
    expect(root.querySelector<HTMLButtonElement>('button.poster')?.disabled).toBe(true);
    click('Reload saved board');
    await fixture.whenStable();
    fixture.detectChanges();
    expect(api.get).toHaveBeenCalledTimes(2);
    expect(root.querySelector<HTMLButtonElement>('button.poster')?.disabled).toBe(false);
  });

  it('requires confirmation before deleting a board', async () => {
    const { api, root, click } = await setup();
    click('Delete tier list');
    expect(api.delete).not.toHaveBeenCalled();
    expect(root.querySelector('dialog[open]')?.textContent).toContain('Delete this tier list?');
    click('Cancel');
    expect(api.delete).not.toHaveBeenCalled();
  });

  it('adds the complete selection in sequential batches with fresh revisions and no duplicates', async () => {
    const { api, fixture } = await setup();
    const additions = Array.from({ length: 121 }, (_, i) => ({
      ...media,
      id: `tv:${i + 1}`,
      tmdbId: i + 1,
    }));
    let saved = structuredClone(original);
    api.add.mockImplementation(async (_id, input) => {
      expect(input.revision).toBe(saved.revision);
      saved = {
        ...saved,
        revision: saved.revision + 1,
        itemCount: saved.itemCount + input.items.length,
      };
      return saved;
    });
    await fixture.componentInstance['add']([...additions, additions[1]]);
    expect(api.add.mock.calls.map((call) => call[1].items.length)).toEqual([50, 50, 20]);
    expect(api.add.mock.calls.map((call) => call[1].revision)).toEqual([2, 3, 4]);
    expect(
      api.add.mock.calls.flatMap((call) => call[1].items).some((item) => item.tmdbId === 1),
    ).toBe(false);
    expect(fixture.componentInstance['notice']()).toBe('Added 120 titles to Unranked');
    expect(fixture.componentInstance['busy']()).toBe(false);
  });

  it('blocks overlapping writes and stops after a partial failure until reload', async () => {
    const { api, fixture } = await setup();
    const additions = Array.from({ length: 110 }, (_, i) => ({
      ...media,
      id: `tv:${i + 2}`,
      tmdbId: i + 2,
    }));
    let resolve!: (board: TierList) => void;
    api.add
      .mockImplementationOnce(
        () =>
          new Promise<TierList>((done) => {
            resolve = done;
          }),
      )
      .mockRejectedValueOnce(new HttpErrorResponse({ status: 409 }));
    const operation = fixture.componentInstance['add'](additions);
    await fixture.componentInstance['add'](additions);
    expect(api.add).toHaveBeenCalledTimes(1);
    resolve({ ...original, revision: 3, itemCount: 51 });
    await operation;
    expect(api.add).toHaveBeenCalledTimes(2);
    expect(fixture.componentInstance['board']()?.revision).toBe(3);
    expect(fixture.componentInstance['error']()).toContain('50 additions confirmed');
    expect(fixture.componentInstance['conflict']()).toBe(true);
    await fixture.componentInstance['add'](additions);
    expect(api.add).toHaveBeenCalledTimes(2);
  });

  it('rejects oversized selections without writing and restores navigation after focus mode', async () => {
    const { api, fixture, click } = await setup();
    await fixture.componentInstance['add'](
      Array.from({ length: 300 }, (_, i) => ({ ...media, id: `tv:${i + 2}`, tmdbId: i + 2 })),
    );
    expect(api.add).not.toHaveBeenCalled();
    expect(fixture.componentInstance['error']()).toContain('300-title limit');
    const focus = TestBed.inject(FocusModeService);
    click('Focus mode');
    expect(focus.active()).toBe(true);
    fixture.destroy();
    expect(focus.active()).toBe(false);
  });

  it('opens library tools only on demand', async () => {
    const { root, click } = await setup();
    expect(root.querySelector('app-tier-picker')).toBeNull();
    click('+ Add titles');
    expect(root.querySelector('app-tier-picker')).not.toBeNull();
    expect(root.querySelector<HTMLDetailsElement>('details.quick-add')?.open).toBe(false);
  });

  it('keeps auto-board ranking editable while hiding manual membership and list settings', async () => {
    const auto: TierList = {
      ...original,
      source: 'library_all',
      capacity: 5000,
      unranked: [{ ...media, id: 'tv:2', tmdbId: 2, title: 'New drama' }],
      itemCount: 2,
    };
    const { api, root, fixture, click } = await setup(auto);
    expect(root.textContent).toContain('Auto-synced with your watched and watching library');
    expect(root.textContent).not.toContain('+ Add titles');
    expect(root.textContent).not.toContain('Delete tier list');
    expect(root.textContent).not.toContain('List settings');
    root.querySelector<HTMLButtonElement>('button.poster')!.click();
    fixture.detectChanges();
    expect(root.querySelector<HTMLButtonElement>('button[aria-label="Move to A"]')).not.toBeNull();
    expect(root.textContent).not.toContain('Remove title');
    await fixture.componentInstance['add']([{ ...media, id: 'tv:3', tmdbId: 3 }]);
    expect(api.add).not.toHaveBeenCalled();
    click('Done');
  });
});
