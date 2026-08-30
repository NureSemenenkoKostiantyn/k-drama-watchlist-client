import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { vi } from 'vitest';

import { AuthenticationService } from '../../../../core/auth/authentication.service';
import { buildOAuthContinuation, LoginPage } from './login-page';

describe('LoginPage', () => {
  const signIn = vi.fn();
  const clearError = vi.fn();
  const authentication = {
    clearError,
    emailVerificationRequired: signal(false),
    error: signal<string | null>(null),
    isPending: signal(false),
    needsOnboarding: signal(false),
    signIn,
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    authentication.needsOnboarding.set(false);
    authentication.emailVerificationRequired.set(false);
    signIn.mockResolvedValue(true);

    await TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [
        provideRouter([]),
        { provide: AuthenticationService, useValue: authentication },
      ],
    }).compileComponents();
  });

  it('submits valid credentials and opens the authenticated application', async () => {
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(LoginPage);
    fixture.detectChanges();

    setInput(fixture.nativeElement, '#login-email', 'viewer@example.com');
    setInput(fixture.nativeElement, '#login-password', 'strong-password');
    (fixture.nativeElement as HTMLElement)
      .querySelector('form')
      ?.dispatchEvent(new Event('submit'));
    await fixture.whenStable();

    expect(signIn).toHaveBeenCalledWith({
      email: 'viewer@example.com',
      password: 'strong-password',
    });
    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });

  it('does not call the API for invalid credentials', async () => {
    const fixture = TestBed.createComponent(LoginPage);
    fixture.detectChanges();

    (fixture.nativeElement as HTMLElement)
      .querySelector('form')
      ?.dispatchEvent(new Event('submit'));
    await fixture.whenStable();

    expect(signIn).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelectorAll('.ui-form-field__error')).toHaveLength(2);
  });

  it('shows and hides the password without submitting the form', () => {
    const fixture = TestBed.createComponent(LoginPage);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const input = root.querySelector<HTMLInputElement>('#login-password');
    const toggle = root.querySelector<HTMLButtonElement>(
      'button[aria-controls="login-password"]',
    );

    expect(input?.type).toBe('password');
    expect(toggle?.getAttribute('aria-pressed')).toBe('false');

    toggle?.click();
    fixture.detectChanges();

    expect(input?.type).toBe('text');
    expect(toggle?.textContent).toContain('Hide');
    expect(signIn).not.toHaveBeenCalled();
  });
});

describe('buildOAuthContinuation', () => {
  it('resumes a signed OAuth authorization request after login', () => {
    expect(
      buildOAuthContinuation({
        client_id: 'https://assistant.example/client.json',
        scope: 'openid mcp:library:read',
        sig: 'signed-value',
      }),
    ).toBe(
      '/api/auth/oauth2/authorize?' +
        'client_id=https%3A%2F%2Fassistant.example%2Fclient.json&' +
        'scope=openid+mcp%3Alibrary%3Aread&sig=signed-value',
    );
  });

  it('does not turn an ordinary login query into an OAuth continuation', () => {
    expect(buildOAuthContinuation({ returnUrl: '/library' })).toBeNull();
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
