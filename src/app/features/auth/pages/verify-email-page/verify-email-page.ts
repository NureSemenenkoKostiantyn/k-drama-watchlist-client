import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { AuthenticationService } from '../../../../core/auth/authentication.service';
import { Button } from '../../../../shared/components/button/button';
import { FormField } from '../../../../shared/components/form-field/form-field';

@Component({
  selector: 'app-verify-email-page',
  imports: [ReactiveFormsModule, RouterLink, Button, FormField],
  templateUrl: './verify-email-page.html',
  styleUrl: '../../auth-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VerifyEmailPage {
  protected readonly authentication = inject(AuthenticationService);
  private readonly formBuilder = inject(FormBuilder);

  protected readonly sent = signal(Boolean(this.authentication.verificationEmail()));
  protected readonly form = this.formBuilder.nonNullable.group({
    email: [
      this.authentication.verificationEmail() ?? '',
      [Validators.required, Validators.email],
    ],
  });

  protected async submit(): Promise<void> {
    this.authentication.clearError();

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const succeeded = await this.authentication.sendVerificationEmail(
      this.form.getRawValue().email,
    );

    if (succeeded) {
      this.sent.set(true);
    }
  }
}
