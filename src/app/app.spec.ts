import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
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
  const refreshNotificationsIfStale = vi.fn().mockResolvedValue({
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
    refreshNotificationsIfStale.mockClear();
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
            refreshIfStale: refreshNotificationsIfStale,
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
    expect(
      compiled.querySelector<HTMLImageElement>('.app-shell__brand-mark')?.getAttribute('src'),
    ).toBe('/brand/drama-watch-mark.png');
  });

  it('provides a skip target and a polite route announcement', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('.skip-link')?.getAttribute('href')).toBe('#main-content');
    expect(compiled.querySelector('#main-content')?.getAttribute('tabindex')).toBe('-1');
    expect(compiled.querySelector('[aria-live="polite"]')?.getAttribute('aria-atomic')).toBe(
      'true',
    );
  });

  it('keeps programmatic route focus visually silent', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const main = compiled.querySelector<HTMLElement>('#main-content');
    const heading = document.createElement('h1');
    heading.textContent = 'Library';
    main?.append(heading);

    (
      fixture.componentInstance as unknown as {
        handleRouteActivation(): void;
      }
    ).handleRouteActivation();
    await fixture.whenStable();

    expect(heading.classList).toContain('route-focus-target');
    expect(heading.getAttribute('tabindex')).toBe('-1');

    heading.dispatchEvent(new FocusEvent('blur'));

    expect(heading.classList).not.toContain('route-focus-target');
    expect(heading.hasAttribute('tabindex')).toBe(false);
  });

  it('renders the compact primary navigation and opens the complete mobile navigation sheet', async () => {
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
    ]);
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/',
      '/search',
      '/library',
    ]);
    const moreButton = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
      '.app-shell__mobile-more-button',
    );
    expect(moreButton?.textContent).toContain('More');
    expect(moreButton?.getAttribute('aria-expanded')).toBe('false');

    moreButton?.click();
    fixture.detectChanges();

    const sheet = (fixture.nativeElement as HTMLElement).querySelector(
      '.app-shell__mobile-more-sheet',
    );
    const moreLinks = Array.from(sheet?.querySelectorAll<HTMLAnchorElement>('nav a') ?? []);
    expect(sheet?.getAttribute('aria-modal')).toBe('true');
    expect(moreLinks.map((link) => link.getAttribute('href'))).toEqual([
      '/activity',
      '/statistics',
      '/priority',
      '/wheels',
      '/lists',
      '/friends',
      '/suggestions',
      '/notifications',
      '/profile',
      '/settings',
    ]);
    expect(
      (fixture.nativeElement as HTMLElement)
        .querySelector('.app-shell__profile-trigger')
        ?.textContent,
    ).toContain('dahyun');
  });

  it('keeps desktop navigation focused on primary destinations', async () => {
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

    const compiled = fixture.nativeElement as HTMLElement;
    const primaryLinks = Array.from(
      compiled.querySelectorAll<HTMLAnchorElement>('.app-shell__primary-links > a'),
    );
    expect(primaryLinks.map((link) => link.textContent?.trim())).toEqual(['Library']);
    const navbarSearch = compiled.querySelector<HTMLFormElement>(
      '.app-shell__nav-search',
    );
    expect(navbarSearch).not.toBeNull();

    const moreButton = compiled.querySelector<HTMLButtonElement>('.app-shell__menu-trigger');
    expect(moreButton?.textContent).toContain('More');
    expect(moreButton?.getAttribute('aria-expanded')).toBe('false');

    moreButton?.click();
    fixture.detectChanges();

    const moreLinks = Array.from(
      compiled.querySelectorAll<HTMLAnchorElement>('#desktop-more-menu a'),
    );
    expect(moreLinks.map((link) => link.getAttribute('href'))).toEqual([
      '/activity',
      '/statistics',
      '/priority',
      '/wheels',
      '/lists',
      '/friends',
      '/suggestions',
    ]);

    const profileTrigger = compiled.querySelector<HTMLButtonElement>('.app-shell__profile-trigger');
    expect(profileTrigger?.textContent).toContain('dahyun');

    profileTrigger?.click();
    fixture.detectChanges();
    const accountLinks = Array.from(
      compiled.querySelectorAll<HTMLAnchorElement>('#profile-menu a'),
    );
    expect(accountLinks.map((link) => link.getAttribute('href'))).toEqual([
      '/profile',
      '/settings',
    ]);
    expect(compiled.querySelector('#profile-menu button')?.textContent).toContain('Sign out');
  });

  it('submits navbar searches to the search route', async () => {
    authenticated.set(true);
    session.set({ user: { name: 'Dahyun', displayUsername: 'dahyun' } });
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const input = root.querySelector<HTMLInputElement>('#navbar-media-search');
    const form = root.querySelector<HTMLFormElement>('.app-shell__nav-search');

    input!.value = '  Goblin  ';
    form!.dispatchEvent(new Event('submit'));

    expect(navigate).toHaveBeenCalledWith(['/search'], {
      queryParams: { q: 'Goblin' },
    });
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
    expect(link?.getAttribute('aria-label')).toBe('Notifications, 3 unread');
    expect(link?.textContent).toContain('3');
  });

  it('refreshes notifications when an authenticated visible window becomes active', async () => {
    authenticated.set(true);
    session.set({ user: { name: 'Dahyun', displayUsername: 'dahyun' } });
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();

    window.dispatchEvent(new Event('focus'));
    window.dispatchEvent(new Event('online'));
    document.dispatchEvent(new Event('visibilitychange'));

    expect(refreshNotificationsIfStale).toHaveBeenCalledTimes(3);
  });

  it('does not refresh notifications from activation events while signed out', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();

    window.dispatchEvent(new Event('focus'));

    expect(refreshNotificationsIfStale).not.toHaveBeenCalled();
  });
});
