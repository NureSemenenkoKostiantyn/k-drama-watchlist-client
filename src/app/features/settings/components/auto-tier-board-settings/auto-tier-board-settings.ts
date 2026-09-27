import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import { SettingsService } from '../../data-access/settings.service';
import { TierBoardMode } from '../../models/settings';

@Component({
  selector: 'app-auto-tier-board-settings',
  imports: [ReactiveFormsModule],
  template: `
    <section class="auto-tier-settings" aria-labelledby="auto-tier-title">
      <p>Tier lists</p>
      <h2 id="auto-tier-title">Auto-synced rankings</h2>
      <p>
        Choose which live boards appear at the top of Tier Lists. They stay private and follow
        titles marked Watching or Watched.
      </p>
      @if (settings.isLoading()) {
        <p role="status">Loading settings…</p>
      } @else {
        <fieldset [disabled]="saving()">
          <legend>Show</legend>
          <label
            ><input type="radio" value="all" [formControl]="mode" /><span
              ><strong>All titles</strong
              ><small>Movies and TV from your library. Default.</small></span
            ></label
          >
          <label
            ><input type="radio" value="kdrama" [formControl]="mode" /><span
              ><strong>K-dramas only</strong
              ><small>Korean TV series from your library.</small></span
            ></label
          >
          <label
            ><input type="radio" value="both" [formControl]="mode" /><span
              ><strong>Both boards</strong
              ><small>Keep separate All titles and K-drama rankings.</small></span
            ></label
          >
        </fieldset>
        <button type="button" [disabled]="saving()" (click)="save()">
          {{ saving() ? 'Saving…' : 'Save tier-list preference' }}
        </button>
      }
      @if (settings.error()) {
        <p role="alert">{{ settings.error() }}</p>
      } @else if (saved()) {
        <p role="status">Tier-list preference saved.</p>
      }
    </section>
  `,
  styles: [
    `
      .auto-tier-settings {
        padding: 1.5rem;
        border: 1px solid var(--color-border);
        background: var(--color-surface);
      }
      h2 {
        margin: 0.25rem 0;
      }
      p,
      small {
        color: var(--color-text-muted);
      }
      fieldset {
        border: 0;
        padding: 0;
        display: grid;
        gap: 0.75rem;
        margin: 1rem 0;
      }
      label {
        display: flex;
        gap: 0.75rem;
        align-items: flex-start;
        cursor: pointer;
      }
      label span {
        display: grid;
        gap: 0.2rem;
      }
      button {
        cursor: pointer;
        padding: 0.65rem 1rem;
        background: var(--color-accent);
        color: #17101e;
        border: 0;
        font: inherit;
        font-weight: 700;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AutoTierBoardSettingsComponent implements OnInit {
  protected readonly settings = inject(SettingsService);
  protected readonly mode = new FormControl<TierBoardMode>('all', { nonNullable: true });
  protected readonly saving = signal(false);
  protected readonly saved = signal(false);

  async ngOnInit(): Promise<void> {
    const settings = await this.settings.load();
    if (settings) this.mode.setValue(settings.tierBoardMode);
  }

  protected async save(): Promise<void> {
    if (this.saving()) return;
    this.saving.set(true);
    this.saved.set(false);
    const result = await this.settings.updateTierBoardMode(this.mode.value);
    this.saved.set(result !== null);
    this.saving.set(false);
  }
}
