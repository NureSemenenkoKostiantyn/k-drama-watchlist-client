import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';

import { AuthenticationService } from '../../../../core/auth/authentication.service';
import { ForgotPasswordPage } from './forgot-password-page';

describe('ForgotPasswordPage', () => {
  const requestPasswordReset = vi.fn();
  const authentication = {
    clearError: vi.fn(),
    error: signal<string | null>(null),
    isPending: signal(false),
    requestPasswordReset,
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    requestPasswordReset.mockResolvedValue(true);

    await TestBed.configureTestingModule({
      imports: [ForgotPasswordPage],
      providers: [
        provideRouter([]),
        { provide: AuthenticationService, useValue: authentication },
      ],
    }).compileComponents();
  });

  it('shows the same neutral success message after requesting a reset', async () => {
    const fixture = TestBed.createComponent(ForgotPasswordPage);
    fixture.detectChanges();
    const input = (
      fixture.nativeElement as HTMLElement
    ).querySelector<HTMLInputElement>('#forgot-password-email');

    if (!input) {
      throw new Error('Missing email input');
    }

    input.value = 'viewer@example.com';
    input.dispatchEvent(new Event('input'));
    fixture.nativeElement.querySelector('form')?.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(requestPasswordReset).toHaveBeenCalledWith('viewer@example.com');
    expect(fixture.nativeElement.querySelector('[role="status"]')?.textContent).toContain(
      'If an account exists',
    );
  });
});
