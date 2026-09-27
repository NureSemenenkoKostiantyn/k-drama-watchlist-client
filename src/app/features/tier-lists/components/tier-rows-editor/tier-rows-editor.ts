import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Button } from '../../../../shared/components/button/button';
import { ConfirmationDialog } from '../../../../shared/components/confirmation-dialog/confirmation-dialog';
import { FormField } from '../../../../shared/components/form-field/form-field';
import { KeyboardReorderControls } from '../../../../shared/components/keyboard-reorder-controls/keyboard-reorder-controls';
import { TierColor, TierLayout, TierList, TIER_COLORS } from '../../models/tier-list';
import { layoutOf } from '../../utils/tier-layout';

@Component({
  selector: 'app-tier-rows-editor',
  imports: [ReactiveFormsModule, Button, ConfirmationDialog, FormField, KeyboardReorderControls],
  template: `
    <details>
      <summary>Customize tiers</summary>
      <p>
        Rename, recolor, and reorder tiers. Removing a tier moves its titles to Unranked when you
        save.
      </p>
      <form [formGroup]="form" (ngSubmit)="save()">
        <div formArrayName="rows">
          @for (row of form.controls.rows.controls; track row.controls.id.value; let i = $index) {
            <div class="row" [formGroupName]="i">
              <app-form-field label="Label" [inputId]="'tier-label-' + i"
                ><input [id]="'tier-label-' + i" formControlName="label" maxlength="40" required
              /></app-form-field>
              <app-form-field label="Color" [inputId]="'tier-color-' + i"
                ><select [id]="'tier-color-' + i" formControlName="color">
                  @for (color of colors; track color) {
                    <option [value]="color">{{ color }}</option>
                  }
                </select></app-form-field
              >
              <div class="actions">
                <app-keyboard-reorder-controls
                  [itemLabel]="'tier ' + row.controls.label.value"
                  [disabled]="busy()"
                  [touchFriendly]="true"
                  [canMoveBefore]="i > 0"
                  [canMoveAfter]="i < form.controls.rows.length - 1"
                  orientation="vertical"
                  (moveRequested)="reorder(i, $event === 'before' ? -1 : 1)"
                />
                <app-button
                  variant="danger"
                  [disabled]="busy() || form.controls.rows.length <= 1"
                  (click)="pendingRemoval.set(i)"
                  >Remove tier</app-button
                >
              </div>
            </div>
          }
        </div>
        <div class="actions">
          <app-button
            variant="secondary"
            [disabled]="busy() || form.controls.rows.length >= 20"
            (click)="add()"
            >Add tier</app-button
          >
          <app-button type="submit" [disabled]="busy() || form.invalid" [busy]="busy()"
            >Save tiers</app-button
          >
          <app-button variant="secondary" [disabled]="busy()" (click)="reset()"
            >Discard changes</app-button
          >
        </div>
      </form>
    </details>
    <app-confirmation-dialog
      [open]="pendingRemoval() !== null"
      title="Remove this tier?"
      message="Its titles will move to Unranked when you save the tiers. No title is removed from your library."
      confirmLabel="Remove tier"
      [busy]="busy()"
      (confirmed)="remove()"
      (cancelled)="pendingRemoval.set(null)"
    />
  `,
  styles: `
    details {
      border: 1px solid var(--color-border);
      padding: 1rem;
      background: var(--color-surface);
    }
    summary {
      cursor: pointer;
      font-weight: 700;
    }
    p {
      color: var(--color-text-muted);
      line-height: 1.5;
    }
    .row {
      display: grid;
      grid-template-columns: minmax(6rem, 1fr) minmax(6rem, 1fr) auto;
      align-items: end;
      gap: 0.7rem;
      margin: 0.8rem 0;
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    @media (max-width: 48rem) {
      .row {
        grid-template-columns: 1fr 1fr;
      }
      .row .actions {
        grid-column: 1 / -1;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TierRowsEditor {
  readonly board = input.required<TierList>();
  readonly busy = input(false);
  readonly saved = output<TierLayout>();
  private readonly fb = inject(FormBuilder).nonNullable;
  protected readonly colors = Object.keys(TIER_COLORS) as TierColor[];
  protected readonly pendingRemoval = signal<number | null>(null);
  protected readonly form = this.fb.group({
    rows: new FormArray<ReturnType<TierRowsEditor['makeRow']>>([]),
  });
  private synchronizedTiers = '';

  constructor() {
    effect(() => {
      const board = this.board();
      const signature = JSON.stringify([
        board.id,
        board.tiers.map(({ id, label, color }) => ({ id, label, color })),
      ]);
      // A poster move or a settings save must not discard an unfinished tier-label edit.
      if (signature !== this.synchronizedTiers) {
        this.synchronizedTiers = signature;
        untracked(() => this.reset());
      }
    });
    effect(() => {
      const busy = this.busy();
      untracked(() => {
        if (busy) this.form.disable();
        else this.form.enable();
      });
    });
  }

  protected reset(): void {
    this.form.controls.rows.clear();
    for (const row of this.board().tiers)
      this.form.controls.rows.push(this.makeRow(row.id, row.label, row.color));
    this.pendingRemoval.set(null);
  }

  private makeRow(id: string, label: string, color: TierColor) {
    return this.fb.group({
      id,
      label: [label, [Validators.required, Validators.maxLength(40)]],
      color: this.fb.control<TierColor>(color),
    });
  }

  protected add(): void {
    if (!this.busy() && this.form.controls.rows.length < 20)
      this.form.controls.rows.push(this.makeRow(crypto.randomUUID(), 'New tier', 'gray'));
  }
  protected reorder(index: number, offset: number): void {
    const rows = this.form.controls.rows;
    const next = index + offset;
    if (this.busy() || next < 0 || next >= rows.length) return;
    const row = rows.at(index);
    rows.removeAt(index);
    rows.insert(next, row);
  }
  protected remove(): void {
    const index = this.pendingRemoval();
    if (index !== null && !this.busy() && this.form.controls.rows.length > 1)
      this.form.controls.rows.removeAt(index);
    this.pendingRemoval.set(null);
  }
  protected save(): void {
    if (this.busy() || this.form.invalid) return;
    const value = this.form.getRawValue().rows;
    if (value.some((row) => !row.label.trim())) return;
    const previous = layoutOf(this.board());
    const retained = new Set(value.map((row) => row.id));
    this.saved.emit({
      revision: previous.revision,
      tiers: value.map((row) => ({
        ...row,
        label: row.label.trim(),
        mediaIds: previous.tiers.find((tier) => tier.id === row.id)?.mediaIds ?? [],
      })),
      unrankedMediaIds: [
        ...previous.unrankedMediaIds,
        ...previous.tiers.filter((row) => !retained.has(row.id)).flatMap((row) => row.mediaIds),
      ],
    });
  }
}
