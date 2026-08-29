import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AuthenticationService } from '../../../../core/auth/authentication.service';

@Component({
  selector: 'app-login-page',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login-page.html',
  styleUrl: '../../auth-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPage {
  protected readonly authentication = inject(AuthenticationService);
  private readonly route = inject(ActivatedRoute);
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);

  protected readonly form = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  protected async submit(): Promise<void> {
    this.authentication.clearError();

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const succeeded = await this.authentication.signIn(this.form.getRawValue());

    if (succeeded) {
      const oauthContinuation = buildOAuthContinuation(
        this.route.snapshot.queryParams,
      );
      if (oauthContinuation && !this.authentication.needsOnboarding()) {
        globalThis.location.assign(oauthContinuation);
        return;
      }

      await this.router.navigate([this.authentication.needsOnboarding() ? '/onboarding' : '/']);
    }
  }
}

export function buildOAuthContinuation(
  queryParams: Record<string, unknown>,
): string | null {
  if (typeof queryParams['sig'] !== 'string') {
    return null;
  }

  const search = new URLSearchParams();
  for (const [name, value] of Object.entries(queryParams)) {
    if (typeof value === 'string') {
      search.append(name, value);
    } else if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === 'string') search.append(name, item);
      }
    }
  }

  return `/api/auth/oauth2/authorize?${search.toString()}`;
}
