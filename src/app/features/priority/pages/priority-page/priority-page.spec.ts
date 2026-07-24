import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
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
    const entriesState = signal([entry]);

    await TestBed.configureTestingModule({
      imports: [PriorityPage],
      providers: [
        provideRouter([]),
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
            reorderItems: vi.fn(),
          },
        },
        {
          provide: LibraryService,
          useValue: {
            entries: entriesState.asReadonly(),
            isLoading: signal(false).asReadonly(),
            load: vi.fn().mockResolvedValue(true),
            applyPriorityOrder: vi.fn(),
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

    expect(root.querySelector('.priority-lane h2')?.textContent).toContain(
      'Must watch',
    );
    expect(root.querySelector('.unassigned')?.textContent).toContain('Goblin');
    expect(root.querySelector('.priority-item__handle')).toBeNull();
    expect(root.querySelector('.priority-lane__drag')).toBeNull();
    expect(root.querySelector('.priority-lane.cdk-drag')).not.toBeNull();
    expect(
      root.querySelector('button[aria-label="Pick a random title"] svg'),
    ).not.toBeNull();
    expect(root.textContent).not.toContain('Collapse');

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
    expect(root.querySelectorAll('.case-opening__card')).toHaveLength(
      42,
    );
    expect(root.querySelector('.case-opening__marker')).not.toBeNull();

    const skipButton =
      root.querySelector<HTMLButtonElement>('.case-opening__skip');
    skipButton?.click();
    fixture.detectChanges();

    expect(root.querySelector('.case-opening__status')?.textContent).toContain(
      'Goblin',
    );
  });
});

function findButtonByLabel(
  root: HTMLElement,
  label: string,
): HTMLButtonElement {
  const button = root.querySelector<HTMLButtonElement>(
    `button[aria-label="${label}"]`,
  );

  if (!button) {
    throw new Error(`Expected a "${label}" button.`);
  }

  return button;
}
