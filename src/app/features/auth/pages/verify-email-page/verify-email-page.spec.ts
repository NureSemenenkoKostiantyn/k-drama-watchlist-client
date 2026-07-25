import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';

import { AuthenticationService } from '../../../../core/auth/authentication.service';
import { VerifyEmailPage } from './verify-email-page';

describe('VerifyEmailPage', () => {
  const sendVerificationEmail = vi.fn();
  const authentication = {
    clearError: vi.fn(),
    error: signal<string | null>(null),
    isPending: signal(false),
    sendVerificationEmail,
    verificationEmail: signal<string | null>('viewer@example.com'),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    sendVerificationEmail.mockResolvedValue(true);

    await TestBed.configureTestingModule({
      imports: [VerifyEmailPage],
      providers: [
        provideRouter([]),
        { provide: AuthenticationService, useValue: authentication },
      ],
    }).compileComponents();
  });

  it('prefills and resends to the registration address', async () => {
    const fixture = TestBed.createComponent(VerifyEmailPage);
    fixture.detectChanges();

    fixture.nativeElement.querySelector('form')?.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(sendVerificationEmail).toHaveBeenCalledWith('viewer@example.com');
    expect(fixture.nativeElement.querySelector('[role="status"]')?.textContent).toContain(
      'new link is on its way',
    );
  });
});
