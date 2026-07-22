import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

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
      await this.router.navigate([this.authentication.needsOnboarding() ? '/onboarding' : '/']);
    }
  }
}
