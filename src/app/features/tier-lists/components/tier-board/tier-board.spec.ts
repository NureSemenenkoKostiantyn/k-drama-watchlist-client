import { CdkDrag, CdkDropList } from '@angular/cdk/drag-drop';
import { BreakpointObserver } from '@angular/cdk/layout';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { TierBoard } from './tier-board';

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
    const select = root.querySelector<HTMLSelectElement>('#move-tier')!;
    select.value = 'a';
    select.dispatchEvent(new Event('change'));
    expect(emitted).toHaveBeenCalledWith({ mediaId: 'tv:1', targetId: 'a', index: 0 });
    expect(root.textContent).toContain('Move earlier');
  });

  it('enables whole-poster dragging on desktop and disables editing while saving', async () => {
    const fixture = await setup(false);
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
