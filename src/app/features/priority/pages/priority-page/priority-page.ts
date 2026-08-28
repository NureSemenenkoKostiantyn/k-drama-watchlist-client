import {
  CdkDrag,
  CdkDragDrop,
  CdkDropList,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
import { BreakpointObserver } from '@angular/cdk/layout';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { map } from 'rxjs';

import { LibraryService } from '../../../library/data-access/library.service';
import { LibraryEntry } from '../../../library/models/library';
import {
  KeyboardReorderAction,
  KeyboardReorderControls,
} from '../../../../shared/components/keyboard-reorder-controls/keyboard-reorder-controls';
import { PriorityService } from '../../data-access/priority.service';
import { PriorityLane } from '../../models/priority';

interface PriorityLaneView {
  lane: PriorityLane;
  items: LibraryEntry[];
}

type CaseOpeningPhase = 'ready' | 'spinning' | 'complete';

interface CaseOpeningReelItem {
  key: string;
  entry: LibraryEntry;
  isWinner: boolean;
}

interface CaseOpeningState {
  laneName: string;
  winner: LibraryEntry;
  items: CaseOpeningReelItem[];
  targetOffset: number;
  phase: CaseOpeningPhase;
}

const caseOpeningCardWidth = 128;
const caseOpeningGap = 12;
const caseOpeningWinnerIndex = 32;
const caseOpeningItemCount = 42;
const caseOpeningDurationMs = 5_200;
const mobilePriorityBreakpoint = '(max-width: 48rem)';

@Component({
  selector: 'app-priority-page',
  imports: [CdkDrag, CdkDropList, KeyboardReorderControls, ReactiveFormsModule, RouterLink],
  templateUrl: './priority-page.html',
  styleUrls: ['./priority-page.scss', './priority-mobile.scss', './case-opening.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PriorityPage implements OnInit, OnDestroy {
  private readonly breakpointObserver = inject(BreakpointObserver);
  private readonly formBuilder = inject(FormBuilder);
  private caseOpeningTimer: ReturnType<typeof setTimeout> | undefined;
  private caseOpeningFrame: number | undefined;
  protected readonly library = inject(LibraryService);
  protected readonly priority = inject(PriorityService);
  protected readonly laneViews = signal<PriorityLaneView[]>([]);
  protected readonly unassigned = signal<LibraryEntry[]>([]);
  protected readonly isSaving = signal(false);
  protected readonly isMobilePriorityLayout = toSignal(
    this.breakpointObserver
      .observe(mobilePriorityBreakpoint)
      .pipe(map((breakpointState) => breakpointState.matches)),
    { initialValue: false },
  );
  protected readonly editingLaneId = signal<string | null>(null);
  protected readonly pendingDeleteLaneId = signal<string | null>(null);
  protected readonly randomPick = signal<string | null>(null);
  protected readonly reorderAnnouncement = signal('');
  protected readonly caseOpening = signal<CaseOpeningState | null>(null);
  protected readonly caseOpeningOffset = signal(0);
  protected readonly isCaseOpening = computed(() => {
    const opening = this.caseOpening();
    return opening !== null && opening.phase !== 'complete';
  });
  protected readonly isInteractionLocked = computed(() => this.isSaving() || this.isCaseOpening());
  protected readonly isPriorityDragDisabled = computed(
    () => this.isMobilePriorityLayout() || this.isInteractionLocked(),
  );
  protected readonly createForm = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
  });
  protected readonly renameForm = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
  });
  protected readonly itemDropListIds = computed(() => [
    'unassigned-priority-items',
    ...this.priority.lanes().map((lane) => laneDropListId(lane.id)),
  ]);

  constructor() {
    effect(() => {
      const lanes = this.priority.lanes();
      const laneIds = new Set(lanes.map((lane) => lane.id));
      const entries = this.library.entries().filter((entry) => entry.status === 'to_watch');
      this.laneViews.set(
        lanes.map((lane) => ({
          lane,
          items: entries
            .filter((entry) => entry.priorityLaneId === lane.id)
            .sort((left, right) => (left.priorityPosition ?? 0) - (right.priorityPosition ?? 0)),
        })),
      );
      this.unassigned.set(
        entries.filter(
          (entry) => entry.priorityLaneId === undefined || !laneIds.has(entry.priorityLaneId),
        ),
      );
    });
  }

  ngOnInit(): void {
    void this.initialize();
  }

  ngOnDestroy(): void {
    this.clearCaseOpeningHandles();
  }

  protected async createLane(): Promise<void> {
    if (this.createForm.invalid || this.isInteractionLocked()) {
      this.createForm.markAllAsTouched();
      return;
    }

    const name = this.createForm.controls.name.value.trim();

    if (!name) {
      return;
    }

    this.isSaving.set(true);
    const result = await this.priority.create(name);
    this.isSaving.set(false);

    if (result) {
      this.createForm.reset({ name: '' });
    }
  }

  protected startRename(lane: PriorityLane): void {
    this.editingLaneId.set(lane.id);
    this.renameForm.setValue({ name: lane.name });
  }

  protected cancelRename(): void {
    this.editingLaneId.set(null);
    this.renameForm.reset({ name: '' });
  }

  protected requestDelete(laneId: string): void {
    this.pendingDeleteLaneId.set(laneId);
  }

  protected cancelDelete(): void {
    this.pendingDeleteLaneId.set(null);
  }

  protected async renameLane(): Promise<void> {
    const laneId = this.editingLaneId();

    if (!laneId || this.renameForm.invalid || this.isInteractionLocked()) {
      return;
    }

    const name = this.renameForm.controls.name.value.trim();
    this.isSaving.set(true);
    const result = await this.priority.update(laneId, name);
    this.isSaving.set(false);

    if (result) {
      this.cancelRename();
    }
  }

  protected async deleteLane(laneId: string): Promise<void> {
    if (this.isInteractionLocked()) {
      return;
    }

    this.isSaving.set(true);
    const deleted = await this.priority.delete(laneId);
    this.isSaving.set(false);

    if (deleted) {
      this.library.clearPriorityLane(laneId);
      this.cancelDelete();
    }
  }

  protected pickRandom(view: PriorityLaneView): void {
    if (this.isCaseOpening()) {
      return;
    }

    const winner = view.items[Math.floor(Math.random() * view.items.length)];

    if (!winner) {
      this.randomPick.set(`${view.lane.name} is empty.`);
      return;
    }

    this.clearCaseOpeningHandles();
    this.randomPick.set(null);
    this.caseOpeningOffset.set(-(caseOpeningCardWidth / 2));
    const items = Array.from({ length: caseOpeningItemCount }, (_, index): CaseOpeningReelItem => {
      const entry =
        index === caseOpeningWinnerIndex
          ? winner
          : (view.items[Math.floor(Math.random() * view.items.length)] ?? winner);
      return {
        key: `${index}-${entry.id}`,
        entry,
        isWinner: index === caseOpeningWinnerIndex,
      };
    });
    const landingJitter = Math.round((Math.random() - 0.5) * 48);
    const targetOffset = -(
      caseOpeningWinnerIndex * (caseOpeningCardWidth + caseOpeningGap) +
      caseOpeningCardWidth / 2 +
      landingJitter
    );
    this.caseOpening.set({
      laneName: view.lane.name,
      winner,
      items,
      targetOffset,
      phase: prefersReducedMotion() ? 'complete' : 'ready',
    });

    if (prefersReducedMotion()) {
      this.caseOpeningOffset.set(targetOffset);
      this.randomPick.set(`${view.lane.name}: ${winner.media.title}`);
      return;
    }

    this.caseOpeningFrame = requestAnimationFrame(() => {
      this.caseOpeningFrame = requestAnimationFrame(() => {
        this.caseOpeningFrame = undefined;
        this.caseOpening.update((opening) => (opening ? { ...opening, phase: 'spinning' } : null));
        this.caseOpeningOffset.set(targetOffset);
        this.caseOpeningTimer = setTimeout(() => this.finishCaseOpening(), caseOpeningDurationMs);
      });
    });
  }

  protected finishCaseOpening(): void {
    const opening = this.caseOpening();

    if (!opening) {
      return;
    }

    this.clearCaseOpeningHandles();
    this.caseOpeningOffset.set(opening.targetOffset);
    this.caseOpening.set({ ...opening, phase: 'complete' });
    this.randomPick.set(`${opening.laneName}: ${opening.winner.media.title}`);
  }

  protected closeCaseOpening(): void {
    this.clearCaseOpeningHandles();
    this.caseOpening.set(null);
    this.caseOpeningOffset.set(0);
  }

  protected async dropLane(event: CdkDragDrop<PriorityLaneView[]>): Promise<void> {
    if (event.previousIndex === event.currentIndex || this.isInteractionLocked()) {
      return;
    }

    const views = [...event.container.data];
    moveItemInArray(views, event.previousIndex, event.currentIndex);
    this.laneViews.set(views);
    this.isSaving.set(true);
    const saved = await this.priority.reorderLanes(views.map((view) => view.lane.id));
    this.isSaving.set(false);

    if (!saved) {
      await this.priority.load();
    }
  }

  protected async moveLaneWithKeyboard(
    view: PriorityLaneView,
    action: KeyboardReorderAction,
  ): Promise<void> {
    if ((action !== 'before' && action !== 'after') || this.isInteractionLocked()) {
      return;
    }

    const views = [...this.laneViews()];
    const currentIndex = views.findIndex((candidate) => candidate.lane.id === view.lane.id);
    const targetIndex = currentIndex + (action === 'before' ? -1 : 1);

    if (currentIndex === -1 || targetIndex < 0 || targetIndex >= views.length) {
      return;
    }

    moveItemInArray(views, currentIndex, targetIndex);
    this.laneViews.set(views);
    this.isSaving.set(true);
    const saved = await this.priority.reorderLanes(views.map((candidate) => candidate.lane.id));
    this.isSaving.set(false);

    if (saved) {
      this.reorderAnnouncement.set(`${view.lane.name} moved to position ${targetIndex + 1}.`);
    } else {
      await this.priority.load();
    }
  }

  protected async dropItem(event: CdkDragDrop<LibraryEntry[]>): Promise<void> {
    if (this.isInteractionLocked()) {
      return;
    }

    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );
    }

    this.updateContainer(event.previousContainer.id, event.previousContainer.data);
    this.updateContainer(event.container.id, event.container.data);
    const affectedLaneIds = [
      readLaneId(event.previousContainer.id),
      readLaneId(event.container.id),
    ].filter((laneId): laneId is string => laneId !== null);
    const uniqueLaneIds = [...new Set(affectedLaneIds)];
    if (uniqueLaneIds.length === 0) {
      return;
    }
    const laneOrders = uniqueLaneIds.map((laneId) => ({
      laneId,
      itemIds: this.itemsForLane(laneId).map((entry) => entry.id),
    }));
    this.isSaving.set(true);
    const saved = await this.priority.reorderItems(laneOrders);

    if (!saved) {
      await this.initialize();
      this.isSaving.set(false);
      return;
    }

    for (const laneOrder of laneOrders) {
      this.library.applyPriorityOrder(laneOrder.laneId, laneOrder.itemIds);
    }

    this.isSaving.set(false);
  }

  protected async moveItemWithKeyboard(
    entry: LibraryEntry,
    containerId: string,
    action: KeyboardReorderAction,
  ): Promise<void> {
    if (this.isInteractionLocked()) {
      return;
    }

    const containerIds = [
      'unassigned-priority-items',
      ...this.laneViews().map((view) => laneDropListId(view.lane.id)),
    ];
    const containerIndex = containerIds.indexOf(containerId);
    const sourceItems = [...this.itemsForContainer(containerId)];
    const currentIndex = sourceItems.findIndex((candidate) => candidate.id === entry.id);

    if (containerIndex === -1 || currentIndex === -1) {
      return;
    }

    let targetContainerId = containerId;
    let targetIndex = currentIndex;

    if (action === 'before' || action === 'after') {
      targetIndex += action === 'before' ? -1 : 1;
      if (targetIndex < 0 || targetIndex >= sourceItems.length) {
        return;
      }
      moveItemInArray(sourceItems, currentIndex, targetIndex);
      this.updateContainer(containerId, sourceItems);
    } else {
      const targetContainerIndex = containerIndex + (action === 'previous-group' ? -1 : 1);
      targetContainerId = containerIds[targetContainerIndex] ?? '';

      if (!targetContainerId) {
        return;
      }

      const targetItems = [...this.itemsForContainer(targetContainerId)];
      const [movedEntry] = sourceItems.splice(currentIndex, 1);
      targetIndex = Math.min(currentIndex, targetItems.length);
      targetItems.splice(targetIndex, 0, movedEntry);
      this.updateContainer(containerId, sourceItems);
      this.updateContainer(targetContainerId, targetItems);
    }

    const affectedLaneIds = [readLaneId(containerId), readLaneId(targetContainerId)].filter(
      (laneId): laneId is string => laneId !== null,
    );
    const laneOrders = [...new Set(affectedLaneIds)].map((laneId) => ({
      laneId,
      itemIds: this.itemsForLane(laneId).map((candidate) => candidate.id),
    }));

    if (laneOrders.length === 0) {
      return;
    }

    this.isSaving.set(true);
    const saved = await this.priority.reorderItems(laneOrders);

    if (!saved) {
      await this.initialize();
      this.isSaving.set(false);
      return;
    }

    for (const laneOrder of laneOrders) {
      this.library.applyPriorityOrder(laneOrder.laneId, laneOrder.itemIds);
    }

    this.isSaving.set(false);
    const targetName = this.containerName(targetContainerId);
    this.reorderAnnouncement.set(
      `${entry.media.title} moved to ${targetName}, position ${targetIndex + 1}.`,
    );
  }

  protected laneListId(laneId: string): string {
    return laneDropListId(laneId);
  }

  private async initialize(): Promise<void> {
    await Promise.all([this.priority.load(), this.library.load()]);
  }

  private updateContainer(containerId: string, items: LibraryEntry[]): void {
    const laneId = readLaneId(containerId);

    if (laneId === null) {
      this.unassigned.set([...items]);
      return;
    }

    this.laneViews.update((views) =>
      views.map((view) => (view.lane.id === laneId ? { ...view, items: [...items] } : view)),
    );
  }

  private itemsForLane(laneId: string): LibraryEntry[] {
    return this.laneViews().find((view) => view.lane.id === laneId)?.items ?? [];
  }

  private itemsForContainer(containerId: string): LibraryEntry[] {
    const laneId = readLaneId(containerId);
    return laneId === null ? this.unassigned() : this.itemsForLane(laneId);
  }

  private containerName(containerId: string): string {
    const laneId = readLaneId(containerId);
    return laneId === null
      ? 'Unassigned'
      : (this.laneViews().find((view) => view.lane.id === laneId)?.lane.name ?? 'priority lane');
  }

  private clearCaseOpeningHandles(): void {
    if (this.caseOpeningFrame !== undefined) {
      cancelAnimationFrame(this.caseOpeningFrame);
      this.caseOpeningFrame = undefined;
    }

    if (this.caseOpeningTimer !== undefined) {
      clearTimeout(this.caseOpeningTimer);
      this.caseOpeningTimer = undefined;
    }
  }
}

function laneDropListId(laneId: string): string {
  return `priority-lane-${laneId}`;
}

function readLaneId(dropListId: string): string | null {
  const prefix = 'priority-lane-';
  return dropListId.startsWith(prefix) ? dropListId.slice(prefix.length) : null;
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}
