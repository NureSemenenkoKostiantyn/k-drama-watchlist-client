import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { vi } from 'vitest';

import { AuthenticationService } from '../../../../core/auth/authentication.service';
import { RegisterPage } from './register-page';

describe('RegisterPage', () => {
  const register = vi.fn();
  const authentication = {
    clearError: vi.fn(),
    error: signal<string | null>(null),
    isPending: signal(false),
    register,
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    register.mockResolvedValue(true);

    await TestBed.configureTestingModule({
      imports: [RegisterPage],
      providers: [
        provideRouter([]),
        { provide: AuthenticationService, useValue: authentication },
      ],
    }).compileComponents();
  });

  it('opens the verification instructions after registration', async () => {
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(RegisterPage);
    fixture.detectChanges();

    setInput(fixture.nativeElement, '#register-name', 'Viewer');
    setInput(fixture.nativeElement, '#register-email', 'viewer@example.com');
    setInput(fixture.nativeElement, '#register-password', 'strong-password');
    submit(fixture.nativeElement);
    await fixture.whenStable();

    expect(register).toHaveBeenCalledWith({
      email: 'viewer@example.com',
      name: 'Viewer',
      password: 'strong-password',
    });
    expect(router.navigate).toHaveBeenCalledWith(['/verify-email']);
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

function submit(root: HTMLElement): void {
  root.querySelector('form')?.dispatchEvent(new Event('submit'));
}
