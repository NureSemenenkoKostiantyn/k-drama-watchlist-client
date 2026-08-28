import { CdkDrag, CdkDropList } from '@angular/cdk/drag-drop';
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { vi } from 'vitest';

import { AuthenticationService } from '../../../../core/auth/authentication.service';
import { LibraryService } from '../../../library/data-access/library.service';
import { SharedListCommentsService } from '../../data-access/shared-list-comments.service';
import { SharedListsService } from '../../data-access/shared-lists.service';
import { SharedListDetails } from '../../models/shared-list';
import { SharedListPage } from './shared-list-page';

describe('SharedListPage mobile workspace', () => {
  const list: SharedListDetails = {
    id: 'list-1',
    title: 'Weekend picks',
    visibility: 'private',
    role: 'owner',
    itemCount: 2,
    members: [
      {
        user: {
          id: 'user-1',
          username: 'dahyun',
          displayUsername: 'Dahyun',
          name: 'Dahyun',
          joinedAt: '2026-08-01T10:00:00.000Z',
        },
        role: 'owner',
        joinedAt: '2026-08-01T10:00:00.000Z',
      },
    ],
    items: [
      {
        id: 'item-1',
        mediaId: 'media-1',
        position: 0,
        media: {
          id: 'tv:1',
          tmdbId: 1,
          mediaType: 'tv',
          title: 'Goblin',
          originalTitle: 'Goblin',
          originCountry: ['KR'],
          genreIds: [18],
        },
        createdAt: '2026-08-01T10:00:00.000Z',
        updatedAt: '2026-08-01T10:00:00.000Z',
      },
      {
        id: 'item-2',
        mediaId: 'media-2',
        position: 1,
        media: {
          id: 'movie:2',
          tmdbId: 2,
          mediaType: 'movie',
          title: 'Parasite',
          originalTitle: 'Parasite',
          originCountry: ['KR'],
          genreIds: [18],
        },
        createdAt: '2026-08-01T10:00:00.000Z',
        updatedAt: '2026-08-01T10:00:00.000Z',
      },
    ],
    createdAt: '2026-08-01T10:00:00.000Z',
    updatedAt: '2026-08-01T10:00:00.000Z',
  };

  it('disables dragging and persists arrow-button reordering on mobile', async () => {
    const breakpointState = new BehaviorSubject<BreakpointState>({
      matches: true,
      breakpoints: {},
    });
    const reorder = vi.fn().mockResolvedValue(true);

    await TestBed.configureTestingModule({
      imports: [SharedListPage],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: { get: vi.fn().mockReturnValue('list-1') } },
          },
        },
        {
          provide: BreakpointObserver,
          useValue: { observe: vi.fn().mockReturnValue(breakpointState) },
        },
        {
          provide: SharedListsService,
          useValue: {
            activeList: signal(list).asReadonly(),
            isLoading: signal(false).asReadonly(),
            error: signal<string | null>(null).asReadonly(),
            loadList: vi.fn().mockResolvedValue(true),
            update: vi.fn(),
            addItem: vi.fn(),
            updateItem: vi.fn(),
            deleteItem: vi.fn(),
            reorder,
            createInvite: vi.fn(),
            updateMember: vi.fn(),
            removeMember: vi.fn(),
            delete: vi.fn(),
          },
        },
        {
          provide: LibraryService,
          useValue: {
            entries: signal([]).asReadonly(),
            load: vi.fn().mockResolvedValue(true),
          },
        },
        {
          provide: SharedListCommentsService,
          useValue: { list: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
        },
        {
          provide: AuthenticationService,
          useValue: { session: signal({ user: { id: 'user-1' } }).asReadonly() },
        },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(SharedListPage);
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
      fixture.debugElement.query(By.directive(CdkDropList)).injector.get(CdkDropList).disabled,
    ).toBe(true);
    expect(root.querySelector('.section-heading > span')?.textContent).toContain(
      'Use arrow controls',
    );
    expect(root.querySelectorAll('.keyboard-reorder--touch')).toHaveLength(2);

    root.querySelector<HTMLButtonElement>('button[aria-label="Move Goblin later"]')?.click();
    await fixture.whenStable();

    expect(reorder).toHaveBeenCalledWith('list-1', ['item-2', 'item-1']);
    expect(root.textContent).toContain('Goblin moved to position 2.');
  });
});
