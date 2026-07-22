import { Routes } from '@angular/router';

import { anonymousOnlyGuard, onboardingGuard, profileCompleteGuard } from './core/auth/auth.guards';

export const routes: Routes = [
  {
    path: 'login',
    title: 'Log in · Drama Watch',
    canActivate: [anonymousOnlyGuard],
    loadComponent: () =>
      import('./features/auth/pages/login-page/login-page').then(({ LoginPage }) => LoginPage),
  },
  {
    path: 'register',
    title: 'Create account · Drama Watch',
    canActivate: [anonymousOnlyGuard],
    loadComponent: () =>
      import('./features/auth/pages/register-page/register-page').then(
        ({ RegisterPage }) => RegisterPage,
      ),
  },
  {
    path: 'onboarding',
    title: 'Choose a username · Drama Watch',
    canActivate: [onboardingGuard],
    loadComponent: () =>
      import('./features/auth/pages/onboarding-page/onboarding-page').then(
        ({ OnboardingPage }) => OnboardingPage,
      ),
  },
  {
    path: '',
    title: 'Drama Watch',
    canActivate: [profileCompleteGuard],
    loadComponent: () =>
      import('./features/home/pages/home-page/home-page').then(({ HomePage }) => HomePage),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
