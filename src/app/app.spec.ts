import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';

import { AuthenticationService } from './core/auth/authentication.service';
import { App } from './app';

describe('App', () => {
  const authenticated = signal(false);
  const session = signal<{
    user: { name: string; displayUsername?: string };
  } | null>(null);
  const signOut = vi.fn().mockResolvedValue(true);

  beforeEach(async () => {
    authenticated.set(false);
    session.set(null);
    signOut.mockClear();

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        {
          provide: AuthenticationService,
          useValue: {
            isAuthenticated: authenticated.asReadonly(),
            isPending: signal(false).asReadonly(),
            session: session.asReadonly(),
            signOut,
          },
        },
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the application name', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.app-shell__brand')?.textContent).toContain('Drama Watch');
  });

  it('renders the five Phase 1 mobile destinations for an authenticated user', async () => {
    authenticated.set(true);
    session.set({
      user: {
        name: 'Dahyun',
        displayUsername: 'dahyun',
      },
    });
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();
    const links = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLAnchorElement>(
        '.app-shell__mobile-nav a',
      ),
    );

    expect(links.map((link) => link.textContent?.trim())).toEqual([
      'Home',
      'Search',
      'Library',
      'Priority',
      'Wheels',
    ]);
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/',
      '/search',
      '/library',
      '/priority',
      '/wheels',
    ]);
  });
});
