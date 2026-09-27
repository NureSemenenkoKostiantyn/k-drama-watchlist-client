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

  async function setup() {
    const api = {
      get: vi.fn().mockResolvedValue(structuredClone(original)),
      layout: vi.fn(),
      delete: vi.fn(),
      update: vi.fn(),
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
      const select = root.querySelector<HTMLSelectElement>('#move-tier')!;
      select.value = 'a';
      select.dispatchEvent(new Event('change'));
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
          (button) => button.textContent?.trim() === 'Undo last arrangement',
        )?.disabled,
      ).toBe(false);
    });
    api.layout.mockResolvedValueOnce({ ...original, revision: 4 });
    click('Undo last arrangement');
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
});
