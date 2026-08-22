import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { SharedListsService } from '../../data-access/shared-lists.service';

@Component({
  selector: 'app-shared-lists-page',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './shared-lists-page.html',
  styleUrl: './shared-lists-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SharedListsPage implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);
  protected readonly sharedLists = inject(SharedListsService);
  protected readonly isSaving = signal(false);
  protected readonly form = this.formBuilder.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(100)]],
    description: ['', [Validators.maxLength(2000)]],
  });

  ngOnInit(): void {
    this.sharedLists.clearActive();
    void this.sharedLists.load();
  }

  protected async create(): Promise<void> {
    if (this.form.invalid || this.isSaving()) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const title = value.title.trim();
    if (!title) return;
    this.isSaving.set(true);
    const list = await this.sharedLists.create(title, value.description.trim() || undefined);
    this.isSaving.set(false);
    if (list) await this.router.navigate(['/lists', list.id]);
  }
}
