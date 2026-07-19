import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  type ActivatedRouteSnapshot,
  provideRouter,
  Router,
  type RouterStateSnapshot,
  type UrlTree,
} from '@angular/router';

import {
  anonymousOnlyGuard,
  onboardingGuard,
  profileCompleteGuard,
  requireAuthGuard,
} from './auth.guards';
import { AuthenticationService } from './authentication.service';

describe('authentication route guards', () => {
  const isAuthenticated = signal(false);
  const needsOnboarding = signal(false);

  beforeEach(() => {
    isAuthenticated.set(false);
    needsOnboarding.set(false);

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: AuthenticationService,
          useValue: { isAuthenticated, needsOnboarding },
        },
      ],
    });
  });

  it('redirects anonymous users away from protected routes', () => {
    expect(runGuard(requireAuthGuard)).toBe('/login');
    expect(runGuard(profileCompleteGuard)).toBe('/login');
    expect(runGuard(onboardingGuard)).toBe('/login');
  });

  it('allows anonymous users to open account routes', () => {
    expect(runGuard(anonymousOnlyGuard)).toBe(true);
  });

  it('requires authenticated users without usernames to finish onboarding', () => {
    isAuthenticated.set(true);
    needsOnboarding.set(true);

    expect(runGuard(profileCompleteGuard)).toBe('/onboarding');
    expect(runGuard(onboardingGuard)).toBe(true);
    expect(runGuard(anonymousOnlyGuard)).toBe('/onboarding');
  });

  it('allows fully onboarded users into the application', () => {
    isAuthenticated.set(true);

    expect(runGuard(requireAuthGuard)).toBe(true);
    expect(runGuard(profileCompleteGuard)).toBe(true);
    expect(runGuard(onboardingGuard)).toBe('/');
    expect(runGuard(anonymousOnlyGuard)).toBe('/');
  });
});

function runGuard(guard: typeof requireAuthGuard): boolean | string {
  const result = TestBed.runInInjectionContext(() =>
    guard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
  );

  if (typeof result === 'boolean') {
    return result;
  }

  return TestBed.inject(Router).serializeUrl(result as UrlTree);
}
