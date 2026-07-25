import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { vi } from 'vitest';

import { AuthenticationService } from '../../../../core/auth/authentication.service';
import { ResetPasswordPage } from './reset-password-page';

describe('ResetPasswordPage', () => {
  const resetPassword = vi.fn();
  const authentication = {
    clearError: vi.fn(),
    error: signal<string | null>(null),
    isPending: signal(false),
    resetPassword,
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    resetPassword.mockResolvedValue(true);

    await TestBed.configureTestingModule({
      imports: [ResetPasswordPage],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: convertToParamMap({ token: 'reset-token' }),
            },
          },
        },
        { provide: AuthenticationService, useValue: authentication },
      ],
    }).compileComponents();
  });

  it('submits matching passwords with the link token', async () => {
    const fixture = TestBed.createComponent(ResetPasswordPage);
    fixture.detectChanges();

    setInput(fixture.nativeElement, '#reset-password', 'new-strong-password');
    setInput(
      fixture.nativeElement,
      '#reset-password-confirmation',
      'new-strong-password',
    );
    fixture.nativeElement.querySelector('form')?.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(resetPassword).toHaveBeenCalledWith('new-strong-password', 'reset-token');
    expect(fixture.nativeElement.querySelector('[role="status"]')?.textContent).toContain(
      'password has been updated',
    );
  });

  it('does not submit mismatched passwords', async () => {
    const fixture = TestBed.createComponent(ResetPasswordPage);
    fixture.detectChanges();

    setInput(fixture.nativeElement, '#reset-password', 'new-strong-password');
    setInput(fixture.nativeElement, '#reset-password-confirmation', 'different-password');
    fixture.nativeElement.querySelector('form')?.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(resetPassword).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('.field__error')?.textContent).toContain(
      'do not match',
    );
  });
});

function setInput(root: HTMLElement, selector: string, value: string): void {
  const input = root.querySelector<HTMLInputElement>(selector);

  if (!input) {
    throw new Error(`Missing test input: ${selector}`);
  }

  input.value = value;
  input.dispatchEvent(new Event('input'));
}
