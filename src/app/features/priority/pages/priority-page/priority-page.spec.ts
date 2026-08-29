import { CdkDrag, CdkDropList } from '@angular/cdk/drag-drop';
import { BreakpointObserver } from '@angular/cdk/layout';
import { signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { LibraryService } from '../../../library/data-access/library.service';
import { LibraryEntry } from '../../../library/models/library';
import { PriorityService } from '../../data-access/priority.service';
import { PriorityPage } from './priority-page';

describe('PriorityPage', () => {
  const entry: LibraryEntry = {
    id: 'entry-1',
    mediaId: 'media-1',
    status: 'to_watch',
    categoryIds: [],
    sharedLists: [],
    media: {
      id: 'tv:1',
      tmdbId: 1,
      mediaType: 'tv',
      title: 'Goblin',
      originalTitle: 'Goblin',
      originCountry: ['KR'],
      genreIds: [18],
    },
    createdAt: '2026-07-24T10:00:00.000Z',
    updatedAt: '2026-07-24T10:00:00.000Z',
  };

  it('renders default lanes and unassigned to-watch entries', async () => {
    const deleteLane = vi.fn().mockResolvedValue(true);
    const clearPriorityLane = vi.fn();
    const reorderItems = vi.fn().mockResolvedValue(true);
    const applyPriorityOrder = vi.fn();
    const entriesState = signal([entry]);

    await TestBed.configureTestingModule({
      imports: [PriorityPage],
      providers: [
        provideRouter([]),
        {
          provide: BreakpointObserver,
          useValue: {
            observe: vi.fn().mockReturnValue(of({ matches: false, breakpoints: {} })),
          },
        },
        {
          provide: PriorityService,
          useValue: {
            lanes: signal([
              {
                id: 'lane-1',
                name: 'Must watch',
                position: 0,
                isDefault: true,
                createdAt: '2026-07-24T10:00:00.000Z',
                updatedAt: '2026-07-24T10:00:00.000Z',
              },
            ]).asReadonly(),
            isLoading: signal(false).asReadonly(),
            error: signal<string | null>(null).asReadonly(),
            load: vi.fn().mockResolvedValue(true),
            create: vi.fn(),
            update: vi.fn(),
            delete: deleteLane,
            reorderLanes: vi.fn(),
            reorderItems,
          },
        },
        {
          provide: LibraryService,
          useValue: {
            entries: entriesState.asReadonly(),
            isLoading: signal(false).asReadonly(),
            load: vi.fn().mockResolvedValue(true),
            applyPriorityOrder,
            clearPriorityLane,
          },
        },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(PriorityPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelector('.priority-lane h2')?.textContent).toContain('Must watch');
    expect(root.querySelector('.unassigned')?.textContent).toContain('Goblin');
    expect(root.querySelector('.priority-item__handle')).toBeNull();
    expect(root.querySelector('.priority-lane__drag')).toBeNull();
    expect(root.querySelector('.priority-lane.cdk-drag')).not.toBeNull();
    expect(
      fixture.debugElement
        .queryAll(By.directive(CdkDrag))
        .every((element) => !element.injector.get(CdkDrag).disabled),
    ).toBe(true);
    expect(root.querySelector('.priority-page__reorder-help')?.textContent).toContain('Drag lanes');
    expect(root.querySelector('button[aria-label="Pick a random title"] svg')).not.toBeNull();
    expect(root.textContent).not.toContain('Collapse');

    findButtonByLabel(root, 'Move Goblin to next lane').click();
    await fixture.whenStable();

    expect(reorderItems).toHaveBeenCalledWith([{ laneId: 'lane-1', itemIds: ['entry-1'] }]);
    expect(applyPriorityOrder).toHaveBeenCalledWith('lane-1', ['entry-1']);

    const deleteButton = findButtonByLabel(root, 'Delete lane');
    deleteButton.click();
    fixture.detectChanges();

    expect(deleteLane).not.toHaveBeenCalled();
    expect(root.textContent).toContain('Delete this lane?');

    findButtonByLabel(root, 'Confirm lane deletion').click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(deleteLane).toHaveBeenCalledWith('lane-1');
    expect(clearPriorityLane).toHaveBeenCalledWith('lane-1');

    entriesState.set([
      {
        ...entry,
        priorityLaneId: 'lane-1',
        priorityPosition: 0,
      },
    ]);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    findButtonByLabel(root, 'Pick a random title').click();
    fixture.detectChanges();

    expect(root.querySelector('.case-opening')).not.toBeNull();
    expect(root.querySelectorAll('.case-opening__card')).toHaveLength(42);
    expect(root.querySelector('.case-opening__marker')).not.toBeNull();

    const skipButton = root.querySelector<HTMLButtonElement>('.case-opening__skip');
    skipButton?.click();
    fixture.detectChanges();

    expect(root.querySelector('.case-opening__status')?.textContent).toContain('Goblin');
  });

  it('disables drag and drop and exposes touch-sized move controls on mobile', async () => {
    const reorderItems = vi.fn().mockResolvedValue(true);
    const applyPriorityOrder = vi.fn();

    await TestBed.configureTestingModule({
      imports: [PriorityPage],
      providers: [
        provideRouter([]),
        {
          provide: BreakpointObserver,
          useValue: {
            observe: vi.fn().mockReturnValue(of({ matches: true, breakpoints: {} })),
          },
        },
        {
          provide: PriorityService,
          useValue: {
            lanes: signal([
              {
                id: 'lane-1',
                name: 'Must watch',
                position: 0,
                isDefault: true,
                createdAt: '2026-07-24T10:00:00.000Z',
                updatedAt: '2026-07-24T10:00:00.000Z',
              },
            ]).asReadonly(),
            isLoading: signal(false).asReadonly(),
            error: signal<string | null>(null).asReadonly(),
            load: vi.fn().mockResolvedValue(true),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
            reorderLanes: vi.fn(),
            reorderItems,
          },
        },
        {
          provide: LibraryService,
          useValue: {
            entries: signal([entry]).asReadonly(),
            isLoading: signal(false).asReadonly(),
            load: vi.fn().mockResolvedValue(true),
            applyPriorityOrder,
            clearPriorityLane: vi.fn(),
          },
        },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(PriorityPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    expect(
      fixture.debugElement
        .queryAll(By.directive(CdkDrag))
        .every((element) => element.injector.get(CdkDrag).disabled),
    ).toBe(true);
    expect(
      fixture.debugElement
        .queryAll(By.directive(CdkDropList))
        .every((element) => element.injector.get(CdkDropList).disabled),
    ).toBe(true);
    expect(root.querySelector('.priority-page__reorder-help')?.textContent).toContain(
      'Use the arrow buttons',
    );
    expect(root.querySelectorAll('.keyboard-reorder--touch').length).toBeGreaterThan(0);

    findButtonByLabel(root, 'Move Goblin to next lane').click();
    await fixture.whenStable();

    expect(reorderItems).toHaveBeenCalledWith([{ laneId: 'lane-1', itemIds: ['entry-1'] }]);
    expect(applyPriorityOrder).toHaveBeenCalledWith('lane-1', ['entry-1']);
  });
});

function findButtonByLabel(root: HTMLElement, label: string): HTMLButtonElement {
  const button = root.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`);

  if (!button) {
    throw new Error(`Expected a "${label}" button.`);
  }

  return button;
}
