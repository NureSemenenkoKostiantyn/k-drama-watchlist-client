import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { vi } from 'vitest';

import { AuthenticationService } from '../../../../core/auth/authentication.service';
import { LoginPage } from './login-page';

describe('LoginPage', () => {
  const signIn = vi.fn();
  const clearError = vi.fn();
  const authentication = {
    clearError,
    error: signal<string | null>(null),
    isPending: signal(false),
    needsOnboarding: signal(false),
    signIn,
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    authentication.needsOnboarding.set(false);
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
    expect(fixture.nativeElement.querySelectorAll('.field__error')).toHaveLength(2);
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
