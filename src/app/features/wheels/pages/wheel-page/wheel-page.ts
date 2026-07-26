import {
  CdkDrag,
  CdkDragDrop,
  CdkDropList,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AuthenticationService } from '../../../../core/auth/authentication.service';
import { LibraryService } from '../../../library/data-access/library.service';
import { ShareCardCreator } from '../../../share-cards/components/share-card-creator/share-card-creator';
import { ShareCardSource } from '../../../share-cards/models/share-card';
import { WheelsService } from '../../data-access/wheels.service';
import {
  WheelItem,
  WheelSelectionMode,
  WheelSpin,
} from '../../models/wheel';

const wheelColors = [
  '#ff719a',
  '#886cff',
  '#39c6b0',
  '#ffc857',
  '#f45b69',
  '#5aa9e6',
  '#d18ce0',
  '#8ac926',
] as const;
const spinDurationMs = 4_800;
const fullRotations = 6;

@Component({
  selector: 'app-wheel-page',
  imports: [
    CdkDrag,
    CdkDropList,
    DatePipe,
    ReactiveFormsModule,
    RouterLink,
    ShareCardCreator,
  ],
  templateUrl: './wheel-page.html',
  styleUrls: [
    './wheel-page.scss',
    './wheel-animation.scss',
    './wheel-items.scss',
    './wheel-history.scss',
    './wheel-share.scss',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WheelPage implements OnInit, OnDestroy {
  private readonly formBuilder = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authentication = inject(AuthenticationService);
  private spinTimer: ReturnType<typeof setTimeout> | undefined;
  private readonly wheelId = this.route.snapshot.paramMap.get('wheelId') ?? '';
  protected readonly library = inject(LibraryService);
  protected readonly wheels = inject(WheelsService);
  protected readonly isSaving = signal(false);
  protected readonly isSpinning = signal(false);
  protected readonly wheelRotation = signal(0);
  protected readonly pendingSpin = signal<WheelSpin | null>(null);
  protected readonly winner = signal<WheelSpin | null>(null);
  protected readonly winnerShareOpen = signal(false);
  protected readonly pendingDelete = signal(false);
  protected readonly pendingHistoryReset = signal(false);
  protected readonly wheel = this.wheels.activeWheel;
  protected readonly enabledItems = computed(() =>
    this.wheel()?.items.filter((item) => item.isEnabled) ?? [],
  );
  protected readonly availableEntries = computed(() => {
    const mediaIds = new Set(
      this.wheel()?.items.map((item) => item.mediaId) ?? [],
    );
    return this.library
      .entries()
      .filter((entry) => !mediaIds.has(entry.mediaId));
  });
  protected readonly wheelBackground = computed(() =>
    buildWheelBackground(this.enabledItems()),
  );
  protected readonly winnerShareSource = computed<ShareCardSource | null>(() => {
    const spin = this.winner();
    const wheel = this.wheel();

    if (!spin || !wheel) {
      return null;
    }

    const item = wheel.items.find(
      (candidate) => candidate.id === spin.selectedItem.wheelItemId,
    );
    const user = this.authentication.session()?.user;

    return {
      kind: 'wheel_result',
      title: spin.selectedItem.title,
      posterUrl: spin.selectedItem.posterUrl,
      backdropUrl: item?.media.backdropUrl,
      username: user?.displayUsername ?? user?.username ?? user?.name,
      wheelTitle: wheel.title,
    };
  });
  protected readonly settingsForm = this.formBuilder.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(100)]],
    description: ['', [Validators.maxLength(1000)]],
    selectionMode: this.formBuilder.nonNullable.control<WheelSelectionMode>(
      'fully_random',
    ),
  });
  protected readonly addItemForm = this.formBuilder.nonNullable.group({
    mediaId: ['', [Validators.required]],
    weight: [1, [Validators.required, Validators.min(1), Validators.max(100)]],
  });

  ngOnInit(): void {
    if (!this.wheelId) {
      void this.router.navigate(['/wheels']);
      return;
    }

    void this.initialize();
  }

  ngOnDestroy(): void {
    this.clearSpinTimer();
    this.wheels.clearActiveWheel();
  }

  protected async saveSettings(): Promise<void> {
    if (this.settingsForm.invalid || this.isSaving() || this.isSpinning()) {
      this.settingsForm.markAllAsTouched();
      return;
    }

    const value = this.settingsForm.getRawValue();
    const title = value.title.trim();

    if (!title) {
      return;
    }

    this.isSaving.set(true);
    await this.wheels.update(this.wheelId, {
      title,
      description: value.description.trim() || null,
      selectionMode: value.selectionMode,
    });
    this.isSaving.set(false);
  }

  protected async addItem(): Promise<void> {
    if (this.addItemForm.invalid || this.isSaving() || this.isSpinning()) {
      this.addItemForm.markAllAsTouched();
      return;
    }

    const value = this.addItemForm.getRawValue();
    this.isSaving.set(true);
    const item = await this.wheels.addItem(
      this.wheelId,
      value.mediaId,
      value.weight,
    );
    this.isSaving.set(false);

    if (item) {
      this.addItemForm.reset({ mediaId: '', weight: 1 });
    }
  }

  protected async toggleItem(item: WheelItem): Promise<void> {
    if (this.isSaving() || this.isSpinning()) {
      return;
    }

    this.isSaving.set(true);
    await this.wheels.updateItem(this.wheelId, item.id, {
      isEnabled: !item.isEnabled,
    });
    this.isSaving.set(false);
  }

  protected async updateWeight(item: WheelItem, event: Event): Promise<void> {
    if (this.isSaving() || this.isSpinning()) {
      return;
    }

    const input = event.target;

    if (!(input instanceof HTMLInputElement)) {
      return;
    }

    const weight = Number(input.value);

    if (!Number.isInteger(weight) || weight < 1 || weight > 100) {
      input.value = item.weight.toString();
      return;
    }

    this.isSaving.set(true);
    const updated = await this.wheels.updateItem(this.wheelId, item.id, {
      weight,
    });
    this.isSaving.set(false);

    if (!updated) {
      input.value = item.weight.toString();
    }
  }

  protected async removeItem(itemId: string): Promise<void> {
    if (this.isSaving() || this.isSpinning()) {
      return;
    }

    this.isSaving.set(true);
    await this.wheels.deleteItem(this.wheelId, itemId);
    this.isSaving.set(false);
  }

  protected async dropItem(event: CdkDragDrop<WheelItem[]>): Promise<void> {
    if (
      event.previousIndex === event.currentIndex ||
      this.isSaving() ||
      this.isSpinning()
    ) {
      return;
    }

    const items = [...event.container.data];
    moveItemInArray(items, event.previousIndex, event.currentIndex);
    this.isSaving.set(true);
    const saved = await this.wheels.reorderItems(
      this.wheelId,
      items.map((item) => item.id),
    );
    this.isSaving.set(false);

    if (!saved) {
      await this.wheels.loadWheel(this.wheelId);
    }
  }

  protected async spin(): Promise<void> {
    if (
      this.enabledItems().length === 0 ||
      this.isSaving() ||
      this.isSpinning()
    ) {
      return;
    }

    this.clearSpinTimer();
    this.winner.set(null);
    this.winnerShareOpen.set(false);
    this.pendingSpin.set(null);
    this.isSpinning.set(true);
    const spin = await this.wheels.spin(this.wheelId);

    if (!spin) {
      this.isSpinning.set(false);
      return;
    }

    const items = this.enabledItems();
    const selectedIndex = items.findIndex(
      (item) => item.id === spin.selectedItem.wheelItemId,
    );

    if (selectedIndex === -1) {
      this.isSpinning.set(false);
      await this.wheels.loadWheel(this.wheelId);
      return;
    }

    this.pendingSpin.set(spin);
    this.wheelRotation.set(
      nextWheelRotation(
        this.wheelRotation(),
        selectedIndex,
        items.length,
      ),
    );

    if (prefersReducedMotion()) {
      this.finishSpin();
      return;
    }

    this.spinTimer = setTimeout(() => this.finishSpin(), spinDurationMs);
  }

  protected finishSpin(): void {
    const spin = this.pendingSpin();

    if (!spin) {
      return;
    }

    this.clearSpinTimer();
    this.isSpinning.set(false);
    this.winner.set(spin);
    this.pendingSpin.set(null);
  }

  protected closeWinner(): void {
    this.winner.set(null);
    this.winnerShareOpen.set(false);
  }

  protected closeWinnerShare(): void {
    this.winnerShareOpen.set(false);
  }

  protected async startWinner(): Promise<void> {
    const spin = this.winner();
    const item = this.wheel()?.items.find(
      (candidate) =>
        candidate.id === spin?.selectedItem.wheelItemId,
    );

    if (!item || this.isSaving()) {
      return;
    }

    this.isSaving.set(true);
    const entry = await this.library.setStatus(
      item.media.mediaType,
      item.media.tmdbId,
      'watching',
    );
    this.isSaving.set(false);

    if (entry) {
      this.winner.set(null);
      this.winnerShareOpen.set(false);
    }
  }

  protected async resetHistory(): Promise<void> {
    if (this.isSaving() || this.isSpinning()) {
      return;
    }

    this.isSaving.set(true);
    const reset = await this.wheels.resetHistory(this.wheelId);
    this.isSaving.set(false);

    if (reset) {
      this.pendingHistoryReset.set(false);
      this.winner.set(null);
      this.winnerShareOpen.set(false);
    }
  }

  protected async deleteWheel(): Promise<void> {
    if (this.isSaving() || this.isSpinning()) {
      return;
    }

    this.isSaving.set(true);
    const deleted = await this.wheels.delete(this.wheelId);
    this.isSaving.set(false);

    if (deleted) {
      await this.router.navigate(['/wheels']);
    }
  }

  protected segmentColor(index: number): string {
    return wheelColors[index % wheelColors.length] ?? wheelColors[0];
  }

  private async initialize(): Promise<void> {
    const [loaded] = await Promise.all([
      this.wheels.loadWheel(this.wheelId),
      this.library.load(),
      this.wheels.loadHistory(this.wheelId),
    ]);
    const wheel = this.wheel();

    if (loaded && wheel) {
      this.settingsForm.setValue({
        title: wheel.title,
        description: wheel.description ?? '',
        selectionMode: wheel.selectionMode,
      });
    }
  }

  private clearSpinTimer(): void {
    if (this.spinTimer !== undefined) {
      clearTimeout(this.spinTimer);
      this.spinTimer = undefined;
    }
  }
}

export function nextWheelRotation(
  currentRotation: number,
  selectedIndex: number,
  itemCount: number,
): number {
  if (itemCount < 1 || selectedIndex < 0 || selectedIndex >= itemCount) {
    return currentRotation;
  }

  const segmentAngle = 360 / itemCount;
  const winnerCenter = selectedIndex * segmentAngle + segmentAngle / 2;
  const currentModulo = positiveModulo(currentRotation, 360);
  const targetModulo = positiveModulo(-winnerCenter, 360);
  const alignmentDelta = positiveModulo(targetModulo - currentModulo, 360);
  return currentRotation + fullRotations * 360 + alignmentDelta;
}

function buildWheelBackground(items: WheelItem[]): string {
  if (items.length === 0) {
    return 'conic-gradient(#30273f 0 100%)';
  }

  const segmentAngle = 360 / items.length;
  const stops = items.map((_, index) => {
    const start = index * segmentAngle;
    const end = (index + 1) * segmentAngle;
    const color = wheelColors[index % wheelColors.length] ?? wheelColors[0];
    return `${color} ${start}deg ${end}deg`;
  });
  return `conic-gradient(${stops.join(', ')})`;
}

function positiveModulo(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor;
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}
