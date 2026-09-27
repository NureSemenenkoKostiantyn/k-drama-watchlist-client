import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { readApiErrorMessage } from '../../../core/api/api-error';
import { Button } from '../../../shared/components/button/button';
import { FormField } from '../../../shared/components/form-field/form-field';
import { PageState } from '../../../shared/components/page-state/page-state';
import { TierListsService } from '../data-access/tier-lists.service';
import { TierListSummary } from '../models/tier-list';

@Component({
  selector: 'app-tier-lists-page',
  imports: [ReactiveFormsModule, RouterLink, Button, FormField, PageState],
  template: `
    <main class="page">
      <header>
        <p class="eyebrow">Your taste, ranked</p>
        <h1>Tier lists</h1>
        <p>
          Your auto-synced ranking follows watched and watching titles. Create other boards for
          independent rankings and shareable snapshots.
        </p>
        <a routerLink="/settings">Choose which auto-synced boards appear in Settings</a>
      </header>
      <form class="panel create" [formGroup]="form" (ngSubmit)="create()">
        <app-form-field label="New tier list" inputId="tier-title"
          ><input
            id="tier-title"
            formControlName="title"
            maxlength="100"
            placeholder="My all-time K-drama ranking"
            required
        /></app-form-field>
        <app-button
          type="submit"
          [disabled]="busy() || form.invalid || !form.controls.title.value.trim()"
          [busy]="busy()"
          >Create tier list</app-button
        >
      </form>
      @if (error()) {
        <app-page-state variant="error" [message]="error()"
          ><app-button variant="secondary" (click)="load()">Retry</app-button></app-page-state
        >
      }
      @if (loading()) {
        <app-page-state variant="loading" message="Loading tier lists…" />
      }
      <div class="list-grid">
        @for (list of lists(); track list.id) {
          <a class="panel list-card" [routerLink]="['/tier-lists', list.id]">
            @if (list.source !== 'manual') {
              <span class="auto-badge">Featured · Auto-synced</span>
            }
            <div class="mini-tiers" aria-hidden="true">
              <span>S</span><span>A</span><span>B</span>
            </div>
            <h2>{{ list.title }}</h2>
            <p>{{ list.description }}</p>
            <small>{{ list.itemCount }} titles · {{ list.visibility }}</small>
          </a>
        } @empty {
          @if (!loading() && !error()) {
            <app-page-state
              variant="empty"
              heading="Build your first ranking"
              message="Start with S–F tiers, add titles, then make it your own. New boards are private."
            />
          }
        }
      </div>
    </main>
  `,
  styleUrl: './tier-pages.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TierListsPage implements OnInit {
  private readonly api = inject(TierListsService);
  private readonly router = inject(Router);
  protected readonly lists = signal<TierListSummary[]>([]);
  protected readonly loading = signal(true);
  protected readonly busy = signal(false);
  protected readonly error = signal('');
  protected readonly form = inject(FormBuilder).nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(100)]],
  });
  ngOnInit(): void {
    void this.load();
  }

  protected async load(): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    try {
      this.lists.set(await this.api.list());
    } catch (error) {
      this.error.set(readApiErrorMessage(error, 'Tier lists could not be loaded.'));
    } finally {
      this.loading.set(false);
    }
  }

  protected async create(): Promise<void> {
    const title = this.form.controls.title.value.trim();
    if (!title || this.form.invalid || this.busy()) return;
    this.busy.set(true);
    this.error.set('');
    try {
      const board = await this.api.create({ title });
      await this.router.navigate(['/tier-lists', board.id]);
    } catch (error) {
      this.error.set(readApiErrorMessage(error, 'The tier list could not be created.'));
    } finally {
      this.busy.set(false);
    }
  }
}
