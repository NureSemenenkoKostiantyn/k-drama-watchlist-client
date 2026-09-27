import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { TierRowsEditor } from './tier-rows-editor';

describe('TierRowsEditor', () => {
  const board = {
    id: 'board',
    revision: 6,
    tiers: [
      { id: 's', label: 'S', color: 'red', items: [{ id: 'tv:1' }] },
      { id: 'a', label: 'A', color: 'green', items: [{ id: 'tv:2' }] },
    ],
    unranked: [{ id: 'movie:3' }],
  };
  async function setup() {
    await TestBed.configureTestingModule({ imports: [TierRowsEditor] }).compileComponents();
    const fixture = TestBed.createComponent(TierRowsEditor);
    fixture.componentRef.setInput('board', board);
    fixture.componentRef.setInput('tierId', 's');
    fixture.detectChanges();
    const saved = vi.fn();
    fixture.componentInstance.saved.subscribe(saved);
    const root = fixture.nativeElement as HTMLElement;
    const click = (text: string) => {
      [...root.querySelectorAll<HTMLButtonElement>('button')]
        .find((button) => button.textContent?.trim() === text)!
        .click();
      fixture.detectChanges();
    };
    return { fixture, root, saved, click };
  }

  it('keeps draft labels when only the saved poster arrangement changes', async () => {
    const { fixture, root, saved } = await setup();
    const input = root.querySelector<HTMLInputElement>('#tier-label')!;
    input.value = 'My favourites';
    input.dispatchEvent(new Event('input'));
    fixture.componentRef.setInput('board', {
      ...board,
      revision: 7,
      tiers: [
        { ...board.tiers[0], items: [{ id: 'tv:1' }, { id: 'tv:2' }] },
        { ...board.tiers[1], items: [] },
      ],
    });
    fixture.detectChanges();
    expect(input.value).toBe('My favourites');
    root
      .querySelector<HTMLFormElement>('form')!
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    expect(saved.mock.lastCall?.[0]).toMatchObject({
      revision: 7,
      tiers: [
        { id: 's', label: 'My favourites', mediaIds: ['tv:1', 'tv:2'] },
        { id: 'a', mediaIds: [] },
      ],
    });
  });

  it('confirms tier deletion and preserves every title in Unranked', async () => {
    const { fixture, root, saved, click } = await setup();
    click('Delete tier');
    expect(saved).not.toHaveBeenCalled();
    expect(root.querySelector('app-confirmation-dialog dialog[open]')).not.toBeNull();
    root.querySelector<HTMLButtonElement>('app-confirmation-dialog button.danger')!.click();
    fixture.detectChanges();
    expect(saved).toHaveBeenCalledWith({
      revision: 6,
      tiers: [{ id: 'a', label: 'A', color: 'green', mediaIds: ['tv:2'] }],
      unrankedMediaIds: ['movie:3', 'tv:1'],
    });
  });

  it('clears a tier without deleting it and requires confirmation', async () => {
    const { root, saved, click } = await setup();
    click('Clear tier');
    expect(saved).not.toHaveBeenCalled();
    root.querySelector<HTMLButtonElement>('app-confirmation-dialog button.danger')!.click();
    expect(saved.mock.lastCall?.[0]).toMatchObject({
      tiers: [
        { id: 's', mediaIds: [] },
        { id: 'a', mediaIds: ['tv:2'] },
      ],
      unrankedMediaIds: ['movie:3', 'tv:1'],
    });
  });

  it('moves rows and inserts a new tier beside the selected row', async () => {
    const { saved, click } = await setup();
    click('Move down');
    expect(saved.mock.lastCall?.[0].tiers.map((row: { id: string }) => row.id)).toEqual(['a', 's']);
    click('Add tier above');
    expect(saved.mock.lastCall?.[0].tiers).toHaveLength(3);
    expect(saved.mock.lastCall?.[0].tiers[0]).toMatchObject({
      label: 'New tier',
      color: 'gray',
      mediaIds: [],
    });
  });

  it('does not delete the last tier or save an empty label', async () => {
    const { fixture, root, saved, click } = await setup();
    fixture.componentRef.setInput('board', { ...board, tiers: [board.tiers[0]] });
    fixture.detectChanges();
    click('Delete tier');
    expect(root.querySelector('app-confirmation-dialog dialog[open]')).toBeNull();
    const input = root.querySelector<HTMLInputElement>('#tier-label')!;
    input.value = '  ';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    click('Save tier');
    expect(saved).not.toHaveBeenCalled();
  });
});
