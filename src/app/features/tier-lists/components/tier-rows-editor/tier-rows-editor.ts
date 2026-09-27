import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Button } from '../../../../shared/components/button/button';
import { ConfirmationDialog } from '../../../../shared/components/confirmation-dialog/confirmation-dialog';
import { DialogPanel } from '../../../../shared/components/dialog-panel/dialog-panel';
import { FormField } from '../../../../shared/components/form-field/form-field';
import { TierColor, TierLayout, TierList, TIER_COLORS } from '../../models/tier-list';
import { layoutOf } from '../../utils/tier-layout';

@Component({
  selector: 'app-tier-rows-editor',
  imports: [ReactiveFormsModule, Button, ConfirmationDialog, DialogPanel, FormField],
  template: `
    <app-dialog-panel
      [open]="row() !== null"
      title="Edit tier"
      [busy]="saving()"
      (dismissed)="dismissed.emit()"
    >
      @if (row(); as current) {
        <form [formGroup]="form" (ngSubmit)="save()">
          <app-form-field label="Tier label" inputId="tier-label">
            <input id="tier-label" formControlName="label" maxlength="40" required />
          </app-form-field>
          <fieldset [disabled]="busy()">
            <legend>Label color</legend>
            <div class="swatches">
              @for (color of colors; track color) {
                <button
                  type="button"
                  [style.background]="palette[color]"
                  [attr.aria-label]="color"
                  [attr.aria-pressed]="form.controls.color.value === color"
                  (click)="form.controls.color.setValue(color)"
                >
                  @if (form.controls.color.value === color) {
                    ✓
                  }
                </button>
              }
            </div>
          </fieldset>
          @if (error()) {
            <p role="alert">{{ error() }}</p>
          }
          <div class="actions">
            <app-button
              type="submit"
              density="compact"
              [disabled]="busy() || form.invalid"
              [busy]="busy()"
              >Save tier</app-button
            >
            <app-button
              variant="secondary"
              density="compact"
              [disabled]="busy()"
              (click)="dismissed.emit()"
              >Cancel</app-button
            >
          </div>
          <div class="row-actions">
            <app-button
              variant="secondary"
              density="compact"
              [disabled]="busy() || form.invalid || index() === 0"
              (click)="reorder(-1)"
              >Move up</app-button
            >
            <app-button
              variant="secondary"
              density="compact"
              [disabled]="busy() || form.invalid || index() === board().tiers.length - 1"
              (click)="reorder(1)"
              >Move down</app-button
            >
            <app-button
              variant="secondary"
              density="compact"
              [disabled]="busy() || form.invalid || board().tiers.length >= 20"
              (click)="add(false)"
              >Add tier above</app-button
            >
            <app-button
              variant="secondary"
              density="compact"
              [disabled]="busy() || form.invalid || board().tiers.length >= 20"
              (click)="add(true)"
              >Add tier below</app-button
            >
            <app-button
              variant="secondary"
              density="compact"
              [disabled]="busy() || !current.items.length"
              (click)="pending.set('clear')"
              >Clear tier</app-button
            >
            <app-button
              variant="danger"
              density="compact"
              [disabled]="busy() || board().tiers.length <= 1"
              (click)="pending.set('delete')"
              >Delete tier</app-button
            >
          </div>
          <p class="hint">
            Clearing or deleting moves titles to Unranked. Your library is never changed.
          </p>
        </form>
      }
    </app-dialog-panel>
    <app-confirmation-dialog
      [open]="pending() !== null"
      [title]="pending() === 'delete' ? 'Delete this tier?' : 'Clear this tier?'"
      message="Its titles will move to Unranked. No titles are removed from your library."
      [confirmLabel]="pending() === 'delete' ? 'Delete tier' : 'Clear tier'"
      [busy]="busy()"
      (confirmed)="confirm()"
      (cancelled)="pending.set(null)"
    />
  `,
  styles: `
    form {
      display: grid;
      gap: 1.1rem;
    }
    fieldset {
      margin: 0;
      padding: 0;
      border: 0;
    }
    legend {
      margin-bottom: 0.6rem;
      font-size: 0.85rem;
    }
    .swatches,
    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    .swatches button {
      width: 2.75rem;
      height: 2.75rem;
      padding: 0;
      border: 2px solid transparent;
      color: #17101d;
      font-size: 1.2rem;
      cursor: pointer;
    }
    .swatches button[aria-pressed='true'] {
      border-color: #17101d;
      outline: 2px solid var(--color-accent);
      outline-offset: 2px;
    }
    .row-actions {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 0.65rem;
      padding-top: 1rem;
      border-top: 1px solid var(--color-border);
    }
    .row-actions app-button { width: 100%; }
    .hint {
      margin: 0;
      font-size: 0.8rem;
      color: var(--color-text-muted);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TierRowsEditor {
  readonly board = input.required<TierList>();
  readonly tierId = input<string | null>(null);
  readonly busy = input(false);
  readonly saving = input(false);
  readonly error = input('');
  readonly saved = output<TierLayout>();
  readonly dismissed = output<void>();
  protected readonly palette = TIER_COLORS;
  protected readonly colors = Object.keys(TIER_COLORS) as TierColor[];
  protected readonly pending = signal<'delete' | 'clear' | null>(null);
  protected readonly row = computed(
    () => this.board().tiers.find((row) => row.id === this.tierId()) ?? null,
  );
  protected readonly index = computed(() =>
    this.board().tiers.findIndex((row) => row.id === this.tierId()),
  );
  private readonly fb = inject(FormBuilder).nonNullable;
  protected readonly form = this.fb.group({
    label: ['', [Validators.required, Validators.maxLength(40), Validators.pattern(/\S/)]],
    color: this.fb.control<TierColor>('gray'),
  });
  private synchronizedRow = '';

  constructor() {
    effect(() => {
      const row = this.row();
      const signature = JSON.stringify([this.board().id, row?.id, row?.label, row?.color]);
      // Revision changes from poster movement must not erase an unfinished label edit.
      if (signature !== this.synchronizedRow) {
        this.synchronizedRow = signature;
        untracked(() => {
          this.form.reset({ label: row?.label ?? '', color: row?.color ?? 'gray' });
          this.pending.set(null);
        });
      }
    });
    effect(() => {
      const busy = this.busy();
      untracked(() => (busy ? this.form.disable() : this.form.enable()));
    });
  }

  private draft(): TierLayout | null {
    if (this.busy() || this.form.invalid || !this.row()) return null;
    const layout = layoutOf(this.board());
    const row = layout.tiers[this.index()];
    row.label = this.form.controls.label.value.trim();
    row.color = this.form.controls.color.value;
    return layout;
  }

  protected save(): void {
    const layout = this.draft();
    if (layout) this.saved.emit(layout);
  }
  protected reorder(offset: number): void {
    const layout = this.draft();
    const index = this.index();
    const next = index + offset;
    if (!layout || next < 0 || next >= layout.tiers.length) return;
    const [row] = layout.tiers.splice(index, 1);
    layout.tiers.splice(next, 0, row);
    this.saved.emit(layout);
  }
  protected add(below: boolean): void {
    const layout = this.draft();
    if (!layout || layout.tiers.length >= 20) return;
    layout.tiers.splice(this.index() + Number(below), 0, {
      id: crypto.randomUUID(),
      label: 'New tier',
      color: 'gray',
      mediaIds: [],
    });
    this.saved.emit(layout);
  }
  protected confirm(): void {
    if (this.busy() || !this.row() || !this.pending()) return;
    const layout = layoutOf(this.board());
    const index = this.index();
    if (this.pending() === 'delete' && layout.tiers.length <= 1) return;
    layout.unrankedMediaIds.push(...layout.tiers[index].mediaIds);
    if (this.pending() === 'delete') layout.tiers.splice(index, 1);
    else layout.tiers[index].mediaIds = [];
    this.pending.set(null);
    this.saved.emit(layout);
  }
}
