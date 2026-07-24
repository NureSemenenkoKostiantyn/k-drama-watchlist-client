import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { LibraryService } from '../../../library/data-access/library.service';
import { CategoriesService } from '../../data-access/categories.service';
import { Category } from '../../models/category';

@Component({
  selector: 'app-category-manager',
  imports: [ReactiveFormsModule],
  templateUrl: './category-manager.html',
  styleUrl: './category-manager.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryManager {
  private readonly formBuilder = inject(FormBuilder);
  private readonly library = inject(LibraryService);
  protected readonly categoriesService = inject(CategoriesService);
  protected readonly editingCategoryId = signal<string | null>(null);
  protected readonly pendingCategoryId = signal<string | null>(null);
  protected readonly editingCategory = computed(() =>
    this.categoriesService
      .categories()
      .find((category) => category.id === this.editingCategoryId()),
  );
  protected readonly categoryForm = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    icon: ['', [Validators.maxLength(100)]],
  });

  protected startEdit(category: Category): void {
    this.editingCategoryId.set(category.id);
    this.categoryForm.setValue({
      name: category.name,
      icon: category.icon ?? '',
    });
    this.categoriesService.clearError();
  }

  protected cancelEdit(): void {
    this.resetForm();
  }

  protected async submit(): Promise<void> {
    if (this.categoryForm.invalid || this.pendingCategoryId()) {
      this.categoryForm.markAllAsTouched();
      return;
    }

    const value = this.categoryForm.getRawValue();
    const name = value.name.trim();

    if (!name) {
      this.categoryForm.controls.name.setErrors({ required: true });
      return;
    }

    const editingId = this.editingCategoryId();
    this.pendingCategoryId.set(editingId ?? 'new');
    const result = editingId
      ? await this.categoriesService.update(editingId, {
          name,
          icon: value.icon.trim() || null,
        })
      : await this.categoriesService.create({
          name,
          ...(value.icon.trim() ? { icon: value.icon.trim() } : {}),
        });
    this.pendingCategoryId.set(null);

    if (result) {
      this.resetForm();
    }
  }

  protected async delete(category: Category): Promise<void> {
    if (this.pendingCategoryId()) {
      return;
    }

    this.pendingCategoryId.set(category.id);
    const deleted = await this.categoriesService.delete(category.id);
    this.pendingCategoryId.set(null);

    if (deleted) {
      this.library.removeCategoryReference(category.id);

      if (this.editingCategoryId() === category.id) {
        this.resetForm();
      }
    }
  }

  private resetForm(): void {
    this.editingCategoryId.set(null);
    this.categoryForm.reset({
      name: '',
      icon: '',
    });
  }
}
