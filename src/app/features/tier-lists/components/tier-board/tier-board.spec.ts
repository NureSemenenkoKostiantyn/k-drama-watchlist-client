import { CdkDrag, CdkDragDrop, CdkDropList, CdkDropListGroup } from '@angular/cdk/drag-drop';
import { BreakpointObserver } from '@angular/cdk/layout';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { TierBoard } from './tier-board';
import { TierRow } from '../../models/tier-list';

describe('TierBoard', () => {
  async function setup(mobile: boolean, editable = true) {
    await TestBed.configureTestingModule({
      imports: [TierBoard],
      providers: [
        provideRouter([]),
        { provide: BreakpointObserver, useValue: { observe: () => of({ matches: mobile }) } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(TierBoard);
    fixture.componentRef.setInput('tiers', [
      {
        id: 's',
        label: 'S',
        color: 'red',
        items: [
          { id: 'tv:1', mediaType: 'tv', tmdbId: 1, title: 'Goblin', originalTitle: 'Goblin' },
        ],
      },
      { id: 'a', label: 'A', color: 'green', items: [] },
    ]);
    fixture.componentRef.setInput('editable', editable);
    fixture.componentRef.setInput('unranked', editable ? [] : null);
    fixture.detectChanges();
    return fixture;
  }

  it('disables every drag and drop source on mobile but permits tap moves', async () => {
    const fixture = await setup(true);
    const emitted = vi.fn();
    fixture.componentInstance.moved.subscribe(emitted);
    expect(
      fixture.debugElement
        .queryAll(By.directive(CdkDrag))
        .every((item) => item.injector.get(CdkDrag).disabled),
    ).toBe(true);
    expect(
      fixture.debugElement
        .queryAll(By.directive(CdkDropList))
        .every((item) => item.injector.get(CdkDropList).disabled),
    ).toBe(true);
    const root = fixture.nativeElement as HTMLElement;
    root.querySelector<HTMLButtonElement>('button.poster')!.click();
    fixture.detectChanges();
    root.querySelector<HTMLButtonElement>('button[aria-label="Move to A"]')!.click();
    expect(emitted).toHaveBeenCalledWith({ mediaId: 'tv:1', targetId: 'a', index: 0 });
    expect(root.textContent).toContain('Move earlier');
  });

  it('enables whole-poster dragging on desktop and disables editing while saving', async () => {
    const fixture = await setup(false);
    const group = fixture.debugElement
      .query(By.directive(CdkDropListGroup))
      .injector.get(CdkDropListGroup);
    expect(group._items.size).toBe(3);
    expect(fixture.debugElement.query(By.directive(CdkDrag)).injector.get(CdkDrag).disabled).toBe(
      false,
    );
    fixture.componentRef.setInput('busy', true);
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.directive(CdkDrag)).injector.get(CdkDrag).disabled).toBe(
      true,
    );
    expect(
      (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('button.poster')!
        .disabled,
    ).toBe(true);
  });

  it('uses a separate searchable tray and contextual tier settings', async () => {
    const fixture = await setup(false);
    const edit = vi.fn();
    fixture.componentInstance.editTier.subscribe(edit);
    fixture.componentRef.setInput('unranked', [
      { id: 'tv:2', title: 'Signal', originalTitle: 'Signal', mediaType: 'tv', tmdbId: 2 },
      { id: 'movie:3', title: 'Parasite', originalTitle: '기생충', mediaType: 'movie', tmdbId: 3 },
    ]);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('.board .tray')).toBeNull();
    expect(root.querySelectorAll('.tray .item')).toHaveLength(2);
    const filter = root.querySelector<HTMLInputElement>('input[type="search"]')!;
    filter.value = '기생충';
    filter.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(root.querySelectorAll('.tray .item')).toHaveLength(1);
    expect(root.querySelector('.tray .item')?.textContent).toContain('Parasite');
    root.querySelector<HTMLButtonElement>('[aria-label="Edit tier S"]')!.click();
    expect(edit).toHaveBeenCalledWith('s');
  });

  it('allows closing the move panel after a conflict even though edits are locked', async () => {
    const fixture = await setup(true);
    const root = fixture.nativeElement as HTMLElement;
    root.querySelector<HTMLButtonElement>('button.poster')!.click();
    fixture.detectChanges();
    fixture.componentRef.setInput('busy', true);
    fixture.componentRef.setInput('error', 'Reload required');
    fixture.detectChanges();
    expect(root.querySelector('dialog[open]')?.textContent).toContain('Reload required');
    root.querySelector<HTMLButtonElement>('[aria-label="Close panel"]')!.click();
    fixture.detectChanges();
    expect(root.querySelector('dialog[open]')).toBeNull();
  });

  it('translates filtered-tray drop positions without removing hidden items', async () => {
    const fixture = await setup(false);
    fixture.componentRef.setInput('unranked', [
      { id: 'tv:2', title: 'Hidden', originalTitle: 'Hidden', mediaType: 'tv', tmdbId: 2 },
      { id: 'tv:3', title: 'Match', originalTitle: 'Match', mediaType: 'tv', tmdbId: 3 },
    ]);
    fixture.detectChanges();
    fixture.componentInstance['filter'].set('Match');
    const moved = vi.fn();
    fixture.componentInstance.moved.subscribe(moved);
    fixture.componentInstance['drop']({
      item: { data: { id: 'tv:1' } },
      container: { data: { id: '__unranked' } },
      currentIndex: 0,
    } as unknown as CdkDragDrop<TierRow>);
    expect(moved).toHaveBeenCalledWith({ mediaId: 'tv:1', targetId: '__unranked', index: 1 });
    expect(fixture.componentInstance.unranked()?.map((item) => item.id)).toEqual(['tv:2', 'tv:3']);
  });

  it('renders shared boards read-only without Unranked or edit controls', async () => {
    const fixture = await setup(false, false);
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('button')).toBeNull();
    expect(root.textContent).not.toContain('Unranked');
    expect(root.querySelector('a.poster')?.getAttribute('href')).toBe('/media/tv/1');
    expect(fixture.debugElement.query(By.directive(CdkDrag)).injector.get(CdkDrag).disabled).toBe(
      true,
    );
  });
});
