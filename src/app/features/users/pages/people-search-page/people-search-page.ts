import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { readApiErrorMessage } from '../../../../core/api/api-error';
import { UsersService } from '../../data-access/users.service';
import { PublicUserProfile } from '../../models/public-user-profile';

@Component({
  selector: 'app-people-search-page',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './people-search-page.html',
  styleUrl: './people-search-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PeopleSearchPage {
  private readonly formBuilder = inject(FormBuilder);
  private readonly users = inject(UsersService);
  protected readonly results = signal<PublicUserProfile[]>([]);
  protected readonly isLoading = signal(false);
  protected readonly hasSearched = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly searchForm = this.formBuilder.nonNullable.group({
    query: [
      '',
      [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(30),
        Validators.pattern(/^[a-zA-Z0-9_.]+$/),
      ],
    ],
  });

  protected async search(): Promise<void> {
    if (this.searchForm.invalid || this.isLoading()) {
      this.searchForm.markAllAsTouched();
      return;
    }

    const query = this.searchForm.controls.query.value.trim();
    this.isLoading.set(true);
    this.hasSearched.set(true);
    this.error.set(null);

    try {
      this.results.set(await this.users.search(query));
    } catch (error: unknown) {
      this.results.set([]);
      this.error.set(
        readApiErrorMessage(
          error,
          'People search is unavailable right now. Please try again.',
        ),
      );
    } finally {
      this.isLoading.set(false);
    }
  }

  protected initials(profile: PublicUserProfile): string {
    return profile.name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toLocaleUpperCase())
      .join('');
  }
}
