import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthenticationService } from './authentication.service';

export const requireAuthGuard: CanActivateFn = () => {
  const authentication = inject(AuthenticationService);

  return authentication.isAuthenticated() || inject(Router).createUrlTree(['/login']);
};

export const profileCompleteGuard: CanActivateFn = () => {
  const authentication = inject(AuthenticationService);
  const router = inject(Router);

  if (!authentication.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }

  return authentication.needsOnboarding() ? router.createUrlTree(['/onboarding']) : true;
};

export const onboardingGuard: CanActivateFn = () => {
  const authentication = inject(AuthenticationService);
  const router = inject(Router);

  if (!authentication.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }

  return authentication.needsOnboarding() ? true : router.createUrlTree(['/']);
};

export const anonymousOnlyGuard: CanActivateFn = () => {
  const authentication = inject(AuthenticationService);
  const router = inject(Router);

  if (!authentication.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree([authentication.needsOnboarding() ? '/onboarding' : '/']);
};
