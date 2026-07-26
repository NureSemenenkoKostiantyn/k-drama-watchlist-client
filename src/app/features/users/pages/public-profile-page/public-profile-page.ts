import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { readApiErrorMessage } from '../../../../core/api/api-error';
import { AuthenticationService } from '../../../../core/auth/authentication.service';
import { LibraryVisibilitySettingsComponent } from '../../../settings/components/library-visibility-settings/library-visibility-settings';
import { UsersService } from '../../data-access/users.service';
import { PublicUserProfile } from '../../models/public-user-profile';

@Component({
  selector: 'app-public-profile-page',
  imports: [
    DatePipe,
    RouterLink,
    LibraryVisibilitySettingsComponent,
  ],
  templateUrl: './public-profile-page.html',
  styleUrl: './public-profile-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicProfilePage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly users = inject(UsersService);
  protected readonly authentication = inject(AuthenticationService);
  protected readonly profile = signal<PublicUserProfile | null>(null);
  protected readonly isLoading = signal(true);
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const username =
          params.get('username') ??
          this.authentication.session()?.user.username;

        if (!username) {
          this.isLoading.set(false);
          this.error.set('Finish username onboarding to view your profile.');
          return;
        }

        void this.load(username);
      });
  }

  protected initials(profile: PublicUserProfile): string {
    return profile.name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toLocaleUpperCase())
      .join('');
  }

  protected isOwnProfile(profile: PublicUserProfile): boolean {
    return this.authentication.session()?.user.id === profile.id;
  }

  private async load(username: string): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      this.profile.set(await this.users.getByUsername(username));
    } catch (error: unknown) {
      this.profile.set(null);
      this.error.set(
        readApiErrorMessage(
          error,
          'This profile is unavailable right now. Please try again.',
        ),
      );
    } finally {
      this.isLoading.set(false);
    }
  }
}
