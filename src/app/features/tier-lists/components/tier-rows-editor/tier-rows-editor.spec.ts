import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { TierRowsEditor } from './tier-rows-editor';

describe('TierRowsEditor', () => {
  it('keeps draft labels when only the saved poster arrangement changes', async () => {
    await TestBed.configureTestingModule({ imports: [TierRowsEditor] }).compileComponents();
    const fixture = TestBed.createComponent(TierRowsEditor);
    const board = { id: 'board', revision: 0, tiers: [{ id: 's', label: 'S', color: 'red', items: [] }], unranked: [] };
    fixture.componentRef.setInput('board', board); fixture.detectChanges();
    const input = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>('#tier-label-0')!;
    input.value = 'My favourites'; input.dispatchEvent(new Event('input'));
    fixture.componentRef.setInput('board', { ...board, revision: 1, tiers: [{ ...board.tiers[0], items: [{ id: 'tv:1' }] }] });
    fixture.detectChanges();
    expect(input.value).toBe('My favourites');
    const saved = vi.fn(); fixture.componentInstance.saved.subscribe(saved);
    (fixture.nativeElement as HTMLElement).querySelector<HTMLFormElement>('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    expect(saved).toHaveBeenCalledWith({ revision: 1, tiers: [{ id: 's', label: 'My favourites', color: 'red', mediaIds: ['tv:1'] }], unrankedMediaIds: [] });
  });

  it('confirms tier deletion and preserves every title in Unranked on save', async () => {
    await TestBed.configureTestingModule({ imports: [TierRowsEditor] }).compileComponents();
    const fixture = TestBed.createComponent(TierRowsEditor);
    fixture.componentRef.setInput('board', {
      revision: 6,
      tiers: [
        { id: 's', label: 'S', color: 'red', items: [{ id: 'tv:1' }] },
        { id: 'a', label: 'A', color: 'green', items: [{ id: 'tv:2' }] },
      ],
      unranked: [{ id: 'movie:3' }],
    });
    fixture.detectChanges();
    const saved = vi.fn();
    fixture.componentInstance.saved.subscribe(saved);
    const root = fixture.nativeElement as HTMLElement;
    [...root.querySelectorAll<HTMLButtonElement>('button')]
      .find((button) => button.textContent?.trim() === 'Remove tier')!
      .click();
    fixture.detectChanges();
    expect(root.querySelectorAll('.row')).toHaveLength(2);
    expect(saved).not.toHaveBeenCalled();
    // Select the confirmation by its accessible text, independent of dialog styling.
    [...root.querySelectorAll<HTMLButtonElement>('dialog button')]
      .find((button) => button.textContent?.trim() === 'Remove tier')!
      .click();
    fixture.detectChanges();
    expect(root.querySelectorAll('.row')).toHaveLength(1);
    root
      .querySelector<HTMLFormElement>('form')!
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    expect(saved).toHaveBeenCalledWith({
      revision: 6,
      tiers: [{ id: 'a', label: 'A', color: 'green', mediaIds: ['tv:2'] }],
      unrankedMediaIds: ['movie:3', 'tv:1'],
    });
  });
});
