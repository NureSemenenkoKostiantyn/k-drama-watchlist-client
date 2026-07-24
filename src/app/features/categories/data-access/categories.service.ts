import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { firstValueFrom, Observable } from 'rxjs';

import { readApiErrorMessage } from '../../../core/api/api-error';
import { environment } from '../../../../environments/environment';
import {
  Category,
  CreateCategoryRequest,
  UpdateCategoryRequest,
} from '../models/category';

@Injectable({ providedIn: 'root' })
export class CategoriesService {
  private readonly http = inject(HttpClient);
  private readonly categoriesState = signal<Category[]>([]);
  private readonly loadingState = signal(false);
  private readonly errorState = signal<string | null>(null);

  readonly categories = this.categoriesState.asReadonly();
  readonly isLoading = this.loadingState.asReadonly();
  readonly error = this.errorState.asReadonly();

  async load(): Promise<boolean> {
    this.loadingState.set(true);
    this.errorState.set(null);

    try {
      const categories = await firstValueFrom(
        this.http.get<Category[]>(`${environment.apiBaseUrl}/categories`),
      );
      this.categoriesState.set(categories);
      return true;
    } catch (error: unknown) {
      this.errorState.set(
        readApiErrorMessage(error, 'Your categories are unavailable right now.'),
      );
      return false;
    } finally {
      this.loadingState.set(false);
    }
  }

  async create(input: CreateCategoryRequest): Promise<Category | null> {
    return this.save(
      this.http.post<Category>(`${environment.apiBaseUrl}/categories`, input),
      'The category could not be created. Please try again.',
    );
  }

  async update(
    categoryId: string,
    input: UpdateCategoryRequest,
  ): Promise<Category | null> {
    return this.save(
      this.http.patch<Category>(
        `${environment.apiBaseUrl}/categories/${categoryId}`,
        input,
      ),
      'The category could not be updated. Please try again.',
    );
  }

  async delete(categoryId: string): Promise<boolean> {
    this.errorState.set(null);

    try {
      await firstValueFrom(
        this.http.delete<void>(
          `${environment.apiBaseUrl}/categories/${categoryId}`,
        ),
      );
      this.categoriesState.update((categories) =>
        categories.filter((category) => category.id !== categoryId),
      );
      return true;
    } catch (error: unknown) {
      this.errorState.set(
        readApiErrorMessage(error, 'The category could not be deleted. Please try again.'),
      );
      return false;
    }
  }

  clearError(): void {
    this.errorState.set(null);
  }

  private async save(
    request: Observable<Category>,
    fallbackMessage: string,
  ): Promise<Category | null> {
    this.errorState.set(null);

    try {
      const category = await firstValueFrom(request);
      this.categoriesState.update((categories) => {
        const exists = categories.some((candidate) => candidate.id === category.id);
        const next = exists
          ? categories.map((candidate) =>
              candidate.id === category.id ? category : candidate,
            )
          : [...categories, category];
        return [...next].sort((left, right) => left.name.localeCompare(right.name));
      });
      return category;
    } catch (error: unknown) {
      this.errorState.set(readApiErrorMessage(error, fallbackMessage));
      return null;
    }
  }
}
