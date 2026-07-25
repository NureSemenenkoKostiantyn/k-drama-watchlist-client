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
    path: 'search',
    title: 'Search · Drama Watch',
    canActivate: [profileCompleteGuard],
    loadComponent: () =>
      import('./features/search/pages/search-page/search-page').then(
        ({ SearchPage }) => SearchPage,
      ),
  },
  {
    path: 'media/:mediaType/:tmdbId',
    title: 'Media details · Drama Watch',
    canActivate: [profileCompleteGuard],
    loadComponent: () =>
      import('./features/search/pages/media-details-page/media-details-page').then(
        ({ MediaDetailsPage }) => MediaDetailsPage,
      ),
  },
  {
    path: 'library',
    pathMatch: 'full',
    redirectTo: 'library/to-watch',
  },
  {
    path: 'library/to-watch',
    title: 'To watch · Drama Watch',
    canActivate: [profileCompleteGuard],
    data: { status: 'to_watch' },
    loadComponent: () =>
      import('./features/library/pages/library-page/library-page').then(
        ({ LibraryPage }) => LibraryPage,
      ),
  },
  {
    path: 'library/watching',
    title: 'Watching · Drama Watch',
    canActivate: [profileCompleteGuard],
    data: { status: 'watching' },
    loadComponent: () =>
      import('./features/library/pages/library-page/library-page').then(
        ({ LibraryPage }) => LibraryPage,
      ),
  },
  {
    path: 'library/watched',
    title: 'Watched · Drama Watch',
    canActivate: [profileCompleteGuard],
    data: { status: 'watched' },
    loadComponent: () =>
      import('./features/library/pages/library-page/library-page').then(
        ({ LibraryPage }) => LibraryPage,
      ),
  },
  {
    path: 'priority',
    title: 'Priority board · Drama Watch',
    canActivate: [profileCompleteGuard],
    loadComponent: () =>
      import('./features/priority/pages/priority-page/priority-page').then(
        ({ PriorityPage }) => PriorityPage,
      ),
  },
  {
    path: 'verify-email',
    title: 'Verify email - Drama Watch',
    loadComponent: () =>
      import('./features/auth/pages/verify-email-page/verify-email-page').then(
        ({ VerifyEmailPage }) => VerifyEmailPage,
      ),
  },
  {
    path: 'forgot-password',
    title: 'Forgot password - Drama Watch',
    loadComponent: () =>
      import('./features/auth/pages/forgot-password-page/forgot-password-page').then(
        ({ ForgotPasswordPage }) => ForgotPasswordPage,
      ),
  },
  {
    path: 'reset-password',
    title: 'Reset password - Drama Watch',
    loadComponent: () =>
      import('./features/auth/pages/reset-password-page/reset-password-page').then(
        ({ ResetPasswordPage }) => ResetPasswordPage,
      ),
  },
  {
    path: 'wheels',
    title: 'Wheels · Drama Watch',
    canActivate: [profileCompleteGuard],
    loadComponent: () =>
      import('./features/wheels/pages/wheels-page/wheels-page').then(
        ({ WheelsPage }) => WheelsPage,
      ),
  },
  {
    path: 'wheels/:wheelId',
    title: 'Wheel · Drama Watch',
    canActivate: [profileCompleteGuard],
    loadComponent: () =>
      import('./features/wheels/pages/wheel-page/wheel-page').then(
        ({ WheelPage }) => WheelPage,
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
