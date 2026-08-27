import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';

import { AuthenticationService } from './core/auth/authentication.service';
import { NotificationsService } from './features/notifications/data-access/notifications.service';
import { SettingsService } from './features/settings/data-access/settings.service';
import { App } from './app';

describe('App', () => {
  const authenticated = signal(false);
  const session = signal<{
    user: { name: string; username?: string; displayUsername?: string };
  } | null>(null);
  const signOut = vi.fn().mockResolvedValue(true);
  const unreadCount = signal(0);
  const refreshNotifications = vi.fn().mockResolvedValue({
    items: [],
    unreadCount: 0,
  });
  const clearNotifications = vi.fn();
  const clearSettings = vi.fn();

  beforeEach(async () => {
    authenticated.set(false);
    session.set(null);
    signOut.mockClear();
    unreadCount.set(0);
    refreshNotifications.mockClear();
    clearNotifications.mockClear();
    clearSettings.mockClear();

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
        {
          provide: NotificationsService,
          useValue: {
            unreadCount: unreadCount.asReadonly(),
            refresh: refreshNotifications,
            clear: clearNotifications,
          },
        },
        {
          provide: SettingsService,
          useValue: {
            clear: clearSettings,
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

  it('provides a skip target and a polite route announcement', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('.skip-link')?.getAttribute('href')).toBe(
      '#main-content',
    );
    expect(compiled.querySelector('#main-content')?.getAttribute('tabindex')).toBe(
      '-1',
    );
    expect(
      compiled.querySelector('[aria-live="polite"]')?.getAttribute('aria-atomic'),
    ).toBe('true');
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
    expect(
      (fixture.nativeElement as HTMLElement)
        .querySelector('.app-shell__profile-link')
        ?.getAttribute('href'),
    ).toBe('/profile');
  });

  it('shows the unread notification count for an authenticated user', async () => {
    authenticated.set(true);
    unreadCount.set(3);
    session.set({
      user: {
        name: 'Dahyun',
        displayUsername: 'dahyun',
      },
    });
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();

    const link = (fixture.nativeElement as HTMLElement).querySelector(
      '.app-shell__notifications-link',
    );
    expect(link?.getAttribute('href')).toBe('/notifications');
    expect(link?.getAttribute('aria-label')).toBe(
      'Notifications, 3 unread',
    );
    expect(link?.textContent).toContain('3');
  });
});
