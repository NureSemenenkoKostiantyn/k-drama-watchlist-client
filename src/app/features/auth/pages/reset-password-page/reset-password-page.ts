import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { AuthenticationService } from '../../../../core/auth/authentication.service';
import { Button } from '../../../../shared/components/button/button';
import { FormField } from '../../../../shared/components/form-field/form-field';

@Component({
  selector: 'app-reset-password-page',
  imports: [ReactiveFormsModule, RouterLink, Button, FormField],
  templateUrl: './reset-password-page.html',
  styleUrls: ['../../auth-page.scss', '../../auth-password.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResetPasswordPage {
  protected readonly authentication = inject(AuthenticationService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);

  protected readonly succeeded = signal(false);
  protected readonly passwordsMismatch = signal(false);
  protected readonly passwordVisible = signal(false);
  protected readonly confirmationVisible = signal(false);
  protected readonly token = this.route.snapshot.queryParamMap.get('token');
  protected readonly invalidLink =
    !this.token || this.route.snapshot.queryParamMap.get('error') === 'INVALID_TOKEN';
  protected readonly form = this.formBuilder.nonNullable.group({
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(128)]],
    confirmation: ['', [Validators.required]],
  });

  protected togglePasswordVisibility(): void {
    this.passwordVisible.update((visible) => !visible);
  }

  protected toggleConfirmationVisibility(): void {
    this.confirmationVisible.update((visible) => !visible);
  }

  protected async submit(): Promise<void> {
    this.authentication.clearError();
    this.passwordsMismatch.set(false);

    if (this.form.invalid || !this.token) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();

    if (value.password !== value.confirmation) {
      this.passwordsMismatch.set(true);
      return;
    }

    const succeeded = await this.authentication.resetPassword(value.password, this.token);

    if (succeeded) {
      this.succeeded.set(true);
      this.form.disable();
    }
  }
}
